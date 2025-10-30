import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/session';
import { revenueQueries, generateId, notificationQueries } from '@/lib/db';
import { triggerRevenueMismatch } from '@/lib/email-triggers';

export const POST: APIRoute = async ({ request, locals }) => {
  // Check authentication
  const authResult = await requireAuth(locals.runtime.env.SESSIONS, request);
  if (authResult instanceof Response) {
    return authResult;
  }

  const session = authResult;

  try {
    const {
      branchId,
      date,
      cash,
      network,
      budget,
      total,
      employees
    } = await request.json();

    // Validation
    if (!branchId || !date || total === undefined) {
      return new Response(
        JSON.stringify({ error: 'البيانات المطلوبة ناقصة' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create revenue record
    const revenueId = generateId();
    await revenueQueries.create(locals.runtime.env.DB, {
      id: revenueId,
      branchId,
      date,
      cash: cash || 0,
      network: network || 0,
      budget: budget || 0,
      total,
      employees: employees ? JSON.stringify(employees) : undefined
    });

    // Check if amounts match
    const calculatedTotal = (cash || 0) + (network || 0) + (budget || 0);
    const isMatched = Math.abs(calculatedTotal - total) < 0.01;

    // Create notification if mismatched
    if (!isMatched) {
      await notificationQueries.create(locals.runtime.env.DB, {
        id: generateId(),
        branchId,
        type: 'revenue_mismatch',
        severity: 'high',
        title: 'تحذير: إيراد غير متطابق',
        message: `الإيراد بتاريخ ${date} غير متطابق. المجموع المدخل: ${total} ج.م، المحسوب: ${calculatedTotal} ج.م`,
        actionRequired: true,
        relatedEntity: revenueId
      });

      // Send email alert for revenue mismatch
      try {
        await triggerRevenueMismatch(locals.runtime.env, {
          revenueId,
          date,
          enteredTotal: total,
          calculatedTotal,
          difference: total - calculatedTotal,
          cash: cash || 0,
          network: network || 0,
          budget: budget || 0,
          branchId,
          userId: session.userId
        });
      } catch (emailError) {
        console.error('Email trigger error:', emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        revenue: {
          id: revenueId,
          isMatched
        }
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Create revenue error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء إضافة الإيراد' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
