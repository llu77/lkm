import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/session';
import { bonusQueries, generateId } from '@/lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  // Check admin authentication
  const authResult = await requireAdmin(locals.runtime.env.SESSIONS, request);
  if (authResult instanceof Response) {
    return authResult;
  }

  const session = authResult;

  try {
    const {
      branchId,
      weekNumber,
      month,
      year,
      employeeBonuses,
      totalBonusPaid,
      revenueSnapshot,
      approved = false
    } = await request.json();

    // Validation
    if (!branchId || !weekNumber || !month || !year || !employeeBonuses) {
      return new Response(
        JSON.stringify({ error: 'البيانات المطلوبة ناقصة' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const bonusId = generateId();

    await bonusQueries.create(locals.runtime.env.DB, {
      id: bonusId,
      branchId,
      weekNumber,
      month,
      year,
      employeeBonuses: JSON.stringify(employeeBonuses),
      totalBonusPaid: totalBonusPaid || 0,
      revenueSnapshot: revenueSnapshot ? JSON.stringify(revenueSnapshot) : undefined
    });

    // If approved, update approval status
    if (approved) {
      await bonusQueries.approve(
        locals.runtime.env.DB,
        bonusId,
        session.username
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        bonusId
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Save bonus error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء حفظ البونص' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
