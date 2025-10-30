import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/session';
import { generateId } from '@/lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  // Check admin authentication
  const authResult = await requireAdmin(locals.runtime.env.SESSIONS, request);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const {
      branchId,
      month,
      year,
      payrollData,
      totals
    } = await request.json();

    // Validation
    if (!branchId || !month || !year || !payrollData || !Array.isArray(payrollData)) {
      return new Response(
        JSON.stringify({ error: 'البيانات المطلوبة ناقصة' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if payroll already exists for this month/year
    const existingPayroll = await locals.runtime.env.DB.prepare(`
      SELECT id FROM payroll_records
      WHERE branch_id = ? AND month = ? AND year = ?
    `).bind(branchId, month, parseInt(year)).first();

    if (existingPayroll) {
      return new Response(
        JSON.stringify({ error: 'سجل الرواتب لهذا الشهر موجود بالفعل' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Save payroll record
    const payrollId = generateId();
    const { username } = authResult;
    const employeesJson = JSON.stringify(payrollData);

    await locals.runtime.env.DB.prepare(`
      INSERT INTO payroll_records (
        id,
        branch_id,
        month,
        year,
        employees,
        total_net_salary,
        generated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      payrollId,
      branchId,
      month,
      parseInt(year),
      employeesJson,
      totals?.totalNetSalary || 0,
      username || 'admin'
    ).run();

    return new Response(
      JSON.stringify({
        success: true,
        payrollId,
        message: 'تم حفظ سجل الرواتب بنجاح'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Save payroll error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء حفظ سجل الرواتب' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
