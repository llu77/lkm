import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/session';
import { expenseQueries } from '@/lib/db';

export const DELETE: APIRoute = async ({ request, locals }) => {
  // Check admin authentication
  const authResult = await requireAdmin(locals.runtime.env.SESSIONS, request);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'معرف المصروف مطلوب' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    await expenseQueries.delete(locals.runtime.env.DB, id);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Delete expense error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء حذف المصروف' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
