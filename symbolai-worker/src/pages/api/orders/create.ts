import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/session';
import { generateId } from '@/lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  // Check authentication
  const authResult = await requireAuth(locals.runtime.env.SESSIONS, request);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const {
      branchId,
      employeeName,
      products,
      notes,
      isDraft
    } = await request.json();

    // Validation
    if (!branchId || !employeeName || !products || !Array.isArray(products) || products.length === 0) {
      return new Response(
        JSON.stringify({ error: 'البيانات المطلوبة ناقصة' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate each product
    for (const product of products) {
      if (!product.name || !product.quantity || !product.price) {
        return new Response(
          JSON.stringify({ error: 'يجب إدخال بيانات المنتج كاملة (الاسم، الكمية، السعر)' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (product.quantity <= 0 || product.price < 0) {
        return new Response(
          JSON.stringify({ error: 'الكمية يجب أن تكون أكبر من صفر والسعر لا يمكن أن يكون سالب' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Calculate grand total
    const grandTotal = products.reduce((sum: number, p: any) => {
      const total = (p.quantity || 0) * (p.price || 0);
      return sum + total;
    }, 0);

    // Create order record
    const orderId = generateId();
    const status = isDraft ? 'draft' : 'pending';
    const productsJson = JSON.stringify(products);

    await locals.runtime.env.DB.prepare(`
      INSERT INTO product_orders (
        id, branch_id, employee_name, products, grand_total, status, is_draft, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId,
      branchId,
      employeeName,
      productsJson,
      grandTotal,
      status,
      isDraft ? 1 : 0,
      notes || ''
    ).run();

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: orderId,
          branchId,
          employeeName,
          products,
          grandTotal,
          status,
          isDraft,
          notes
        }
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Create order error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء إنشاء الطلب' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
