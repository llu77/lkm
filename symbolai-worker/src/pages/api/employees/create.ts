import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/session';
import { employeeQueries, generateId } from '@/lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  // Check admin authentication
  const authResult = await requireAdmin(locals.runtime.env.SESSIONS, request);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const {
      branchId,
      employeeName,
      nationalId,
      baseSalary,
      supervisorAllowance = 0,
      incentives = 0
    } = await request.json();

    // Validation
    if (!branchId || !employeeName || baseSalary === undefined) {
      return new Response(
        JSON.stringify({ error: 'البيانات المطلوبة ناقصة' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create employee record
    const employeeId = generateId();
    await employeeQueries.create(locals.runtime.env.DB, {
      id: employeeId,
      branchId,
      employeeName,
      nationalId,
      baseSalary: parseFloat(baseSalary),
      supervisorAllowance: parseFloat(supervisorAllowance) || 0,
      incentives: parseFloat(incentives) || 0
    });

    return new Response(
      JSON.stringify({
        success: true,
        employee: {
          id: employeeId
        }
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Create employee error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء إضافة الموظف' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
