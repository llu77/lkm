import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";

// Get all product orders for a branch
export const getOrders = query({
  args: { branchId: v.string() },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("productOrders")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
      .filter((q) => q.eq(q.field("isDraft"), false))
      .order("desc")
      .collect();
    
    return orders;
  },
});

// Get saved drafts/templates for an employee
export const getDrafts = query({
  args: { branchId: v.string(), employeeName: v.string() },
  handler: async (ctx, args) => {
    const drafts = await ctx.db
      .query("productOrders")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isDraft"), true),
          q.eq(q.field("employeeName"), args.employeeName)
        )
      )
      .order("desc")
      .collect();
    
    return drafts;
  },
});

// Create or update a product order
export const createOrder = mutation({
  args: {
    orderName: v.optional(v.string()),
    products: v.array(v.object({
      productName: v.string(),
      quantity: v.number(),
      price: v.number(),
      total: v.number(),
    })),
    grandTotal: v.number(),
    isDraft: v.boolean(),
    employeeName: v.string(),
    notes: v.optional(v.string()),
    branchId: v.string(),
    branchName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول أولاً",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "المستخدم غير موجود",
        code: "NOT_FOUND",
      });
    }

    const orderId = await ctx.db.insert("productOrders", {
      orderName: args.orderName,
      products: args.products,
      grandTotal: args.grandTotal,
      status: args.isDraft ? "draft" : "pending",
      isDraft: args.isDraft,
      requestedBy: user._id,
      employeeName: args.employeeName,
      notes: args.notes,
      branchId: args.branchId,
      branchName: args.branchName,
    });

    return orderId;
  },
});

// Update an existing order (for drafts)
export const updateOrder = mutation({
  args: {
    orderId: v.id("productOrders"),
    orderName: v.optional(v.string()),
    products: v.array(v.object({
      productName: v.string(),
      quantity: v.number(),
      price: v.number(),
      total: v.number(),
    })),
    grandTotal: v.number(),
    isDraft: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول أولاً",
        code: "UNAUTHENTICATED",
      });
    }

    await ctx.db.patch(args.orderId, {
      orderName: args.orderName,
      products: args.products,
      grandTotal: args.grandTotal,
      status: args.isDraft ? "draft" : "pending",
      isDraft: args.isDraft,
      notes: args.notes,
    });

    return args.orderId;
  },
});

// Update order status (admin only)
export const updateStatus = mutation({
  args: {
    orderId: v.id("productOrders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول أولاً",
        code: "UNAUTHENTICATED",
      });
    }

    // التحقق من صلاحيات المستخدم (admin only)
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "المستخدم غير موجود",
        code: "NOT_FOUND",
      });
    }

    if (user.role !== "admin") {
      throw new ConvexError({
        message: "⚠️ غير مصرح لك بإدارة طلبات المنتجات - صلاحيات أدمن فقط",
        code: "FORBIDDEN",
      });
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new ConvexError({
        message: "الطلب غير موجود",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.orderId, {
      status: args.status,
    });

    return args.orderId;
  },
});

// Delete a draft
export const deleteDraft = mutation({
  args: { orderId: v.id("productOrders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول أولاً",
        code: "UNAUTHENTICATED",
      });
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new ConvexError({
        message: "الطلب غير موجود",
        code: "NOT_FOUND",
      });
    }

    if (!order.isDraft) {
      throw new ConvexError({
        message: "لا يمكن حذف طلب مرسل",
        code: "BAD_REQUEST",
      });
    }

    await ctx.db.delete(args.orderId);
  },
});
