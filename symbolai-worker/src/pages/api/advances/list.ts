import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/session';

export const GET: APIRoute = async ({ request, locals }) => {
  // Check authentication
  const authResult = await requireAuth(locals.runtime.env.SESSIONS, request);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');

    let query = `
      SELECT
        a.*,
        e.employee_name,
        e.national_id,
        e.branch_id
      FROM advances a
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (employeeId) {
      query += ` AND a.employee_id = ?`;
      params.push(employeeId);
    }

    if (month) {
      query += ` AND a.month = ?`;
      params.push(month);
    }

    if (year) {
      query += ` AND a.year = ?`;
      params.push(parseInt(year));
    }

    query += ` ORDER BY a.year DESC, a.month DESC, a.created_at DESC`;

    const stmt = locals.runtime.env.DB.prepare(query);
    const result = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    const advances = result.results || [];

    // Calculate total
    const total = advances.reduce((sum: number, a: any) => sum + (a.amount || 0), 0);

    return new Response(
      JSON.stringify({
        success: true,
        advances,
        count: advances.length,
        total
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('List advances error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء جلب البيانات' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
