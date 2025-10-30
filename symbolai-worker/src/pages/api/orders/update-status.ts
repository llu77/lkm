import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/session';

export const POST: APIRoute = async ({ request, locals }) => {
  // Check admin authentication
  const authResult = await requireAdmin(locals.runtime.env.SESSIONS, request);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const {
      orderId,
      newStatus
    } = await request.json();

    // Validation
    if (!orderId || !newStatus) {
      return new Response(
        JSON.stringify({ error: 'البيانات المطلوبة ناقصة' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate status value
    const validStatuses = ['draft', 'pending', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(newStatus)) {
      return new Response(
        JSON.stringify({ error: 'حالة الطلب غير صحيحة' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get current order
    const order = await locals.runtime.env.DB.prepare(
      `SELECT * FROM product_orders WHERE id = ?`
    ).bind(orderId).first();

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'الطلب غير موجود' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate workflow transitions
    const currentStatus = order.status;
    const validTransitions: { [key: string]: string[] } = {
      'draft': ['pending'],
      'pending': ['approved', 'rejected'],
      'approved': ['completed'],
      'rejected': [], // Cannot transition from rejected
      'completed': [] // Cannot transition from completed
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return new Response(
        JSON.stringify({
          error: `لا يمكن تغيير الحالة من ${currentStatus} إلى ${newStatus}`
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Update order status
    const updateTime = new Date().toISOString();
    await locals.runtime.env.DB.prepare(`
      UPDATE product_orders
      SET status = ?, is_draft = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      newStatus,
      newStatus === 'draft' ? 1 : 0,
      updateTime,
      orderId
    ).run();

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: orderId,
          status: newStatus,
          updatedAt: updateTime
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Update order status error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء تحديث حالة الطلب' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
