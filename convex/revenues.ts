import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    date: v.number(),
    cash: v.number(),
    network: v.number(),
    budget: v.number(),
    mismatchReason: v.optional(v.string()),
    branchId: v.string(),
    branchName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const total = args.cash + args.network + args.budget;
    
    // شروط المطابقة:
    // الشرط الأول: المجموع = كاش + شبكة (بدون موازنة)
    // الشرط الثاني: الموازنة = الشبكة
    const condition1 = total === (args.cash + args.network);
    const condition2 = args.budget === args.network;
    const isMatched = condition1 && condition2;

    // إذا لم تكن مطابقة ولم يتم إدخال سبب، نرمي خطأ
    if (!isMatched && !args.mismatchReason) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "يجب إدخال سبب عدم المطابقة",
      });
    }

    const revenueId = await ctx.db.insert("revenues", {
      date: args.date,
      cash: args.cash,
      network: args.network,
      budget: args.budget,
      total,
      isMatched,
      mismatchReason: args.mismatchReason,
      userId: user._id,
      branchId: args.branchId,
      branchName: args.branchName,
    });

    return revenueId;
  },
});

export const list = query({
  args: {
    branchId: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    let revenues = await ctx.db
      .query("revenues")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
      .order("desc")
      .collect();

    // Filter by date range if provided
    if (args.startDate && args.endDate) {
      revenues = revenues.filter(
        (r) => r.date >= args.startDate! && r.date <= args.endDate!,
      );
    }

    return revenues;
  },
});

export const getById = query({
  args: { id: v.id("revenues") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const revenue = await ctx.db.get(args.id);
    if (!revenue) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Revenue not found",
      });
    }

    return revenue;
  },
});

export const update = mutation({
  args: {
    id: v.id("revenues"),
    date: v.optional(v.number()),
    cash: v.optional(v.number()),
    network: v.optional(v.number()),
    budget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const revenue = await ctx.db.get(args.id);
    if (!revenue) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Revenue not found",
      });
    }

    const updates: Record<string, unknown> = {};
    if (args.date !== undefined) updates.date = args.date;
    if (args.cash !== undefined) updates.cash = args.cash;
    if (args.network !== undefined) updates.network = args.network;
    if (args.budget !== undefined) updates.budget = args.budget;

    // Recalculate total if any amount field changed
    if (args.cash !== undefined || args.network !== undefined || args.budget !== undefined) {
      const cash = args.cash !== undefined ? args.cash : (revenue.cash || 0);
      const network = args.network !== undefined ? args.network : (revenue.network || 0);
      const budget = args.budget !== undefined ? args.budget : (revenue.budget || 0);
      updates.total = cash + network + budget;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("revenues") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const revenue = await ctx.db.get(args.id);
    if (!revenue) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Revenue not found",
      });
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});



export const getStats = query({
  args: { branchId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const allRevenues = await ctx.db
      .query("revenues")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
      .collect();

    // Get current month data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();

    const currentMonthRevenues = allRevenues.filter(
      (r) => r.date >= startOfMonth && r.date <= endOfMonth,
    );

    const totalRevenue = allRevenues.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalCash = allRevenues.reduce((sum, r) => sum + (r.cash || 0), 0);
    const totalNetwork = allRevenues.reduce((sum, r) => sum + (r.network || 0), 0);
    const totalBudget = allRevenues.reduce((sum, r) => sum + (r.budget || 0), 0);

    const currentMonthTotal = currentMonthRevenues.reduce((sum, r) => sum + (r.total || 0), 0);
    const currentMonthCash = currentMonthRevenues.reduce((sum, r) => sum + (r.cash || 0), 0);
    const currentMonthNetwork = currentMonthRevenues.reduce((sum, r) => sum + (r.network || 0), 0);
    const currentMonthBudget = currentMonthRevenues.reduce((sum, r) => sum + (r.budget || 0), 0);

    const averageRevenue = allRevenues.length > 0 ? totalRevenue / allRevenues.length : 0;

    return {
      totalRevenue,
      totalCash,
      totalNetwork,
      totalBudget,
      currentMonthTotal,
      currentMonthCash,
      currentMonthNetwork,
      currentMonthBudget,
      currentMonthRevenue: currentMonthTotal,
      totalCount: allRevenues.length,
      currentMonthCount: currentMonthRevenues.length,
      averageRevenue,
    };
  },
});
