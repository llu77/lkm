import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    amount: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    date: v.number(),
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

    const expenseId = await ctx.db.insert("expenses", {
      title: args.title,
      amount: args.amount,
      category: args.category,
      description: args.description,
      date: args.date,
      userId: user._id,
    });

    return expenseId;
  },
});

export const list = query({
  args: {
    category: v.optional(v.string()),
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

    let expenses = await ctx.db
      .query("expenses")
      .order("desc")
      .collect();

    // Filter by category if provided
    if (args.category && args.category !== "all") {
      expenses = expenses.filter((e) => e.category === args.category);
    }

    // Filter by date range if provided
    if (args.startDate && args.endDate) {
      expenses = expenses.filter(
        (e) => e.date >= args.startDate! && e.date <= args.endDate!,
      );
    }

    return expenses;
  },
});

export const getById = query({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const expense = await ctx.db.get(args.id);
    if (!expense) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Expense not found",
      });
    }

    return expense;
  },
});

export const update = mutation({
  args: {
    id: v.id("expenses"),
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const expense = await ctx.db.get(args.id);
    if (!expense) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Expense not found",
      });
    }

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.amount !== undefined) updates.amount = args.amount;
    if (args.category !== undefined) updates.category = args.category;
    if (args.description !== undefined) updates.description = args.description;
    if (args.date !== undefined) updates.date = args.date;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const expense = await ctx.db.get(args.id);
    if (!expense) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Expense not found",
      });
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const expenses = await ctx.db.query("expenses").collect();
    const categories = [...new Set(expenses.map((e) => e.category))];
    return categories;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const allExpenses = await ctx.db.query("expenses").collect();

    // Get current month data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();

    const currentMonthExpenses = allExpenses.filter(
      (e) => e.date >= startOfMonth && e.date <= endOfMonth,
    );

    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const averageExpense = allExpenses.length > 0 ? totalExpenses / allExpenses.length : 0;

    // Get category breakdown
    const categoryMap = new Map<string, number>();
    allExpenses.forEach((e) => {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount);
    });

    const categoryTotals = Array.from(categoryMap.entries()).map(([category, total]) => ({
      category,
      total,
    }));

    return {
      totalExpenses,
      currentMonthTotal,
      totalCount: allExpenses.length,
      currentMonthCount: currentMonthExpenses.length,
      averageExpense,
      categoryTotals,
    };
  },
});
