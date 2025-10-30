import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/session';
import { employeeRequestQueries } from '@/lib/db';

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

    // Update request with response
    await employeeRequestQueries.respond(
      locals.runtime.env.DB,
      id,
      status,
      adminResponse
    );

    // TODO: Send email to employee
    // This will be implemented in the Email module
    // For now, just log it
    console.log(`Email should be sent for request ${id}: ${status}`);

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
