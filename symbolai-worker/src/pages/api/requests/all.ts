import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/session';
import { employeeRequestQueries } from '@/lib/db';

export const GET: APIRoute = async ({ request, locals }) => {
  // Check admin authentication
  const authResult = await requireAdmin(locals.runtime.env.SESSIONS, request);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const url = new URL(request.url);
    const branchId = url.searchParams.get('branchId') || 'BR001';
    const status = url.searchParams.get('status'); // optional filter

    const result = await employeeRequestQueries.getByBranch(
      locals.runtime.env.DB,
      branchId,
      status && status !== 'all' ? status : undefined
    );

    const requests = result.results || [];

    // Count by status
    const pending = requests.filter((r: any) => r.status === 'pending').length;
    const approved = requests.filter((r: any) => r.status === 'approved').length;
    const rejected = requests.filter((r: any) => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({
        success: true,
        requests,
        count: requests.length,
        stats: { pending, approved, rejected }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Get all requests error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء جلب البيانات' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
