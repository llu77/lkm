/**
 * Zapier Helper - Auto-trigger webhooks on events
 * 
 * استخدم هذه الـ helpers في mutations لإطلاق webhooks تلقائياً
 */

import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * إطلاق webhook عند إنشاء إيراد
 */
export async function triggerRevenueCreated(
  ctx: MutationCtx,
  revenue: {
    _id: string;
    date: number;
    cash?: number;
    network?: number;
    budget?: number;
    total?: number;
    branchId?: string;
    branchName?: string;
  }
) {
  try {
    await ctx.scheduler.runAfter(0, internal.zapier.triggerWebhooks, {
      eventType: "revenue_created",
      payload: {
        id: revenue._id,
        date: new Date(revenue.date).toISOString(),
        cash: revenue.cash || 0,
        network: revenue.network || 0,
        budget: revenue.budget || 0,
        total: revenue.total || 0,
        branch: {
          id: revenue.branchId,
          name: revenue.branchName,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to trigger revenue webhook:", error);
  }
}

/**
 * إطلاق webhook عند إنشاء مصروف
 */
export async function triggerExpenseCreated(
  ctx: MutationCtx,
  expense: {
    _id: string;
    title: string;
    amount: number;
    category: string;
    date: number;
    branchId?: string;
    branchName?: string;
  }
) {
  try {
    await ctx.scheduler.runAfter(0, internal.zapier.triggerWebhooks, {
      eventType: "expense_created",
      payload: {
        id: expense._id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: new Date(expense.date).toISOString(),
        branch: {
          id: expense.branchId,
          name: expense.branchName,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to trigger expense webhook:", error);
  }
}

/**
 * إطلاق webhook عند إنشاء طلب منتج
 */
export async function triggerProductOrderCreated(
  ctx: MutationCtx,
  order: {
    _id: string;
    employeeName: string;
    grandTotal: number;
    status: string;
    branchId: string;
    branchName: string;
    products: Array<{
      productName: string;
      quantity: number;
      price: number;
      total: number;
    }>;
  }
) {
  try {
    await ctx.scheduler.runAfter(0, internal.zapier.triggerWebhooks, {
      eventType: "product_order_created",
      payload: {
        id: order._id,
        employee: order.employeeName,
        total: order.grandTotal,
        status: order.status,
        branch: {
          id: order.branchId,
          name: order.branchName,
        },
        products: order.products,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to trigger product order webhook:", error);
  }
}

/**
 * إطلاق webhook عند إنشاء طلب موظف
 */
export async function triggerEmployeeRequestCreated(
  ctx: MutationCtx,
  request: {
    _id: string;
    employeeName: string;
    requestType: string;
    status: string;
    branchId: string;
    branchName: string;
  }
) {
  try {
    await ctx.scheduler.runAfter(0, internal.zapier.triggerWebhooks, {
      eventType: "employee_request_created",
      payload: {
        id: request._id,
        employee: request.employeeName,
        type: request.requestType,
        status: request.status,
        branch: {
          id: request.branchId,
          name: request.branchName,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to trigger employee request webhook:", error);
  }
}
