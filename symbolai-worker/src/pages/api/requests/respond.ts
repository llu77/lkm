import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/session';
import { employeeRequestQueries } from '@/lib/db';
import { triggerEmployeeRequestResponded } from '@/lib/email-triggers';

export const PUT: APIRoute = async ({ request, locals }) => {
  // Check admin authentication
  const authResult = await requireAdmin(locals.runtime.env.SESSIONS, request);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id, status, adminResponse } = await request.json();

    // Validation
    if (!id || !status || !adminResponse) {
      return new Response(
        JSON.stringify({ error: 'البيانات المطلوبة ناقصة' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!['approved', 'rejected'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'الحالة غير صحيحة' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get request details before updating
    const requestDetails = await locals.runtime.env.DB.prepare(`
      SELECT employee_name, request_type, user_id
      FROM employee_requests
      WHERE id = ?
    `).bind(id).first();

    if (!requestDetails) {
      return new Response(
        JSON.stringify({ error: 'الطلب غير موجود' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Update request with response
    await employeeRequestQueries.respond(
      locals.runtime.env.DB,
      id,
      status,
      adminResponse
    );

    // Send email to employee
    try {
      await triggerEmployeeRequestResponded(locals.runtime.env, {
        requestId: id,
        employeeName: requestDetails.employee_name as string,
        requestType: requestDetails.request_type as string,
        status,
        adminResponse,
        responseDate: new Date().toLocaleDateString('ar-EG'),
        userId: requestDetails.user_id as string
      });
    } catch (emailError) {
      console.error('Email trigger error:', emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم الرد على الطلب بنجاح'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Respond to request error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء الرد على الطلب' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
