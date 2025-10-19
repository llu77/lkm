import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getStats = query({
  args: { branchId: v.string() },
  handler: async (ctx, args) => {
    const revenues = await ctx.db
      .query("revenues")
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .collect();

    const totalRevenue = revenues.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalCash = revenues.reduce((sum, r) => sum + (r.cash || 0), 0);
    const totalNetwork = revenues.reduce((sum, r) => sum + (r.network || 0), 0);
    const totalBudget = revenues.reduce((sum, r) => sum + (r.budget || 0), 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    const currentMonthRevenues = revenues.filter(
      (r) => r.date >= startOfMonth && r.date <= endOfMonth,
    );
    const currentMonthTotal = currentMonthRevenues.reduce(
      (sum, r) => sum + (r.total || 0),
      0,
    );

    return {
      totalRevenue,
      totalCash,
      totalNetwork,
      totalBudget,
      currentMonthTotal,
      count: revenues.length,
    };
  },
});

export const list = query({
  args: { 
    branchId: v.string(),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const targetMonth = args.month ?? now.getMonth();
    const targetYear = args.year ?? now.getFullYear();
    
    const startOfMonth = new Date(targetYear, targetMonth, 1).getTime();
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59).getTime();

    const revenues = await ctx.db
      .query("revenues")
      .filter((q) => 
        q.and(
          q.eq(q.field("branchId"), args.branchId),
          q.gte(q.field("date"), startOfMonth),
          q.lte(q.field("date"), endOfMonth)
        )
      )
      .order("desc")
      .collect();

    return revenues;
  },
});

export const create = mutation({
  args: {
    date: v.number(),
    cash: v.number(),
    network: v.number(),
    budget: v.number(),
    branchId: v.string(),
    branchName: v.string(),
    employees: v.optional(
      v.array(
        v.object({
          name: v.string(),
          revenue: v.number(),
        }),
      ),
    ),
    mismatchReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
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
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    // المجموع المحسوب = كاش + شبكة فقط
    const calculatedTotal = args.cash + args.network;
    const total = args.cash + args.network + args.budget;
    
    // شروط المطابقة المنفصلة:
    // الشرط الأول: المجموع = كاش + شبكة (يعني budget = 0)
    const condition1 = total === calculatedTotal;
    // الشرط الثاني: الموازنة = الشبكة
    const condition2 = args.budget === args.network;
    
    // يجب تحقق الشرطين معاً
    const isMatched = condition1 && condition2;

    if (!isMatched && !args.mismatchReason) {
      throw new ConvexError({
        message: "Mismatch reason is required when revenues don't match",
        code: "BAD_REQUEST",
      });
    }

    await ctx.db.insert("revenues", {
      date: args.date,
      cash: args.cash,
      network: args.network,
      budget: args.budget,
      total,
      calculatedTotal,
      isMatched,
      mismatchReason: args.mismatchReason,
      userId: user._id,
      branchId: args.branchId,
      branchName: args.branchName,
      employees: args.employees,
    });
  },
});

export const remove = mutation({
  args: { 
    id: v.id("revenues"),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    // التحقق من كلمة المرور
    if (args.password !== "Omar101010#") {
      throw new ConvexError({
        message: "كلمة المرور غير صحيحة",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.id);
  },
});