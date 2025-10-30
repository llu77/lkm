import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/session';
import { expenseQueries, generateId } from '@/lib/db';
import { categorizeExpense } from '@/lib/ai';

export const POST: APIRoute = async ({ request, locals }) => {
  // Check authentication
  const authResult = await requireAuth(locals.runtime.env.SESSIONS, request);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const {
      branchId,
      title,
      amount,
      category,
      description,
      date,
      autoCategorize = false
    } = await request.json();

    // Validation
    if (!branchId || !title || !amount || !date) {
      return new Response(
        JSON.stringify({ error: 'البيانات المطلوبة ناقصة' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    let finalCategory = category;

    // AI Auto-categorization if requested
    if (autoCategorize || !category) {
      try {
        const aiCategory = await categorizeExpense(
          {
            AI: locals.runtime.env.AI,
            ANTHROPIC_API_KEY: locals.runtime.env.ANTHROPIC_API_KEY,
            AI_GATEWAY_ACCOUNT_ID: locals.runtime.env.AI_GATEWAY_ACCOUNT_ID,
            AI_GATEWAY_NAME: locals.runtime.env.AI_GATEWAY_NAME
          },
          title,
          description
        );
        finalCategory = aiCategory;
      } catch (error) {
        console.error('AI categorization failed:', error);
        finalCategory = category || 'أخرى';
      }
    }

    // Create expense record
    const expenseId = generateId();
    await expenseQueries.create(locals.runtime.env.DB, {
      id: expenseId,
      branchId,
      title,
      amount: parseFloat(amount),
      category: finalCategory,
      description,
      date
    });

    return new Response(
      JSON.stringify({
        success: true,
        expense: {
          id: expenseId,
          category: finalCategory
        }
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Create expense error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء إضافة المصروف' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
