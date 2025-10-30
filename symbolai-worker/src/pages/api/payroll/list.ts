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
    const branchId = url.searchParams.get('branchId');
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');

    let query = `
      SELECT *
      FROM payroll_records
      WHERE 1=1
    `;
    const params: any[] = [];

    if (branchId) {
      query += ` AND branch_id = ?`;
      params.push(branchId);
    }

    if (month) {
      query += ` AND month = ?`;
      params.push(month);
    }

    if (year) {
      query += ` AND year = ?`;
      params.push(parseInt(year));
    }

    query += ` ORDER BY year DESC, month DESC, generated_at DESC`;

    const stmt = locals.runtime.env.DB.prepare(query);
    const result = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    const payrollRecords = (result.results || []).map((record: any) => ({
      ...record,
      employees: JSON.parse(record.employees || '[]')
    }));

    // Calculate statistics
    const stats = {
      totalRecords: payrollRecords.length,
      totalPaid: payrollRecords.reduce((sum: number, r: any) => sum + (r.total_net_salary || 0), 0),
      totalEmployees: payrollRecords.reduce((sum: number, r: any) => sum + r.employees.length, 0)
    };

    return new Response(
      JSON.stringify({
        success: true,
        payrollRecords,
        stats
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('List payroll error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء جلب البيانات' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
