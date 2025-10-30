import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/session';
import { bonusQueries } from '@/lib/db';

export const GET: APIRoute = async ({ request, locals }) => {
  // Check authentication
  const authResult = await requireAuth(locals.runtime.env.SESSIONS, request);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const url = new URL(request.url);
    const branchId = url.searchParams.get('branchId') || 'BR001';
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');

    if (!month || !year) {
      // Default to current month
      const now = new Date();
      const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];

      const result = await bonusQueries.getByBranchAndPeriod(
        locals.runtime.env.DB,
        branchId,
        monthNames[now.getMonth()],
        now.getFullYear()
      );

      return new Response(
        JSON.stringify({
          success: true,
          bonusRecords: result.results || [],
          count: result.results?.length || 0
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const result = await bonusQueries.getByBranchAndPeriod(
      locals.runtime.env.DB,
      branchId,
      month,
      parseInt(year)
    );

    // Parse employee bonuses JSON
    const bonusRecords = (result.results || []).map((record: any) => ({
      ...record,
      employee_bonuses: record.employee_bonuses ? JSON.parse(record.employee_bonuses) : []
    }));

    return new Response(
      JSON.stringify({
        success: true,
        bonusRecords,
        count: bonusRecords.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('List bonus error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء جلب البيانات' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
