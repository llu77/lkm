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

    // === Comprehensive Validation ===

    // Validate required string fields
    if (!args.title?.trim()) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "عنوان المصروف مطلوب",
      });
    }

    if (args.title.trim().length > 200) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "عنوان المصروف طويل جداً (الحد الأقصى 200 حرف)",
      });
    }

    if (!args.category?.trim()) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "تصنيف المصروف مطلوب",
      });
    }

    if (!args.branchId?.trim()) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "معرف الفرع مطلوب",
      });
    }

    if (!args.branchName?.trim()) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "اسم الفرع مطلوب",
      });
    }

    // Validate amount
    if (args.amount <= 0) {
      throw new ConvexError({
        code: "INVALID_AMOUNT",
        message: "مبلغ المصروف يجب أن يكون أكبر من صفر",
      });
    }

    if (args.amount > 1000000) {
      throw new ConvexError({
        code: "AMOUNT_TOO_HIGH",
        message: "مبلغ المصروف يتجاوز الحد المسموح (1,000,000 ر.س)",
      });
    }

    // Validate date
    if (args.date > Date.now() + (24 * 60 * 60 * 1000)) {
      throw new ConvexError({
        code: "INVALID_DATE",
        message: "تاريخ المصروف لا يمكن أن يكون في المستقبل",
      });
    }

    // Validate description length if provided
    if (args.description && args.description.trim().length > 500) {
      throw new ConvexError({
        code: "DESCRIPTION_TOO_LONG",
        message: "وصف المصروف طويل جداً (الحد الأقصى 500 حرف)",
      });
    }

    const expenseId = await ctx.db.insert("expenses", {
      title: args.title.trim(),
      amount: args.amount,
      category: args.category.trim(),
      description: args.description?.trim(),
      date: args.date,
      userId: user._id,
      branchId: args.branchId,
      branchName: args.branchName,
    });

    return expenseId;
  },
});

export const list = query({
  args: {
    branchId: v.string(),
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
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
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

    // === Comprehensive Validation ===

    // Validate title if being updated
    if (args.title !== undefined) {
      if (!args.title?.trim()) {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: "عنوان المصروف لا يمكن أن يكون فارغاً",
        });
      }

      if (args.title.trim().length > 200) {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: "عنوان المصروف طويل جداً (الحد الأقصى 200 حرف)",
        });
      }
    }

    // Validate category if being updated
    if (args.category !== undefined && !args.category?.trim()) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "تصنيف المصروف لا يمكن أن يكون فارغاً",
      });
    }

    // Validate amount if being updated
    if (args.amount !== undefined) {
      if (args.amount <= 0) {
        throw new ConvexError({
          code: "INVALID_AMOUNT",
          message: "مبلغ المصروف يجب أن يكون أكبر من صفر",
        });
      }

      if (args.amount > 1000000) {
        throw new ConvexError({
          code: "AMOUNT_TOO_HIGH",
          message: "مبلغ المصروف يتجاوز الحد المسموح (1,000,000 ر.س)",
        });
      }
    }

    // Validate date if being updated
    if (args.date !== undefined && args.date > Date.now() + (24 * 60 * 60 * 1000)) {
      throw new ConvexError({
        code: "INVALID_DATE",
        message: "تاريخ المصروف لا يمكن أن يكون في المستقبل",
      });
    }

    // Validate description length if being updated
    if (args.description !== undefined && args.description && args.description.trim().length > 500) {
      throw new ConvexError({
        code: "DESCRIPTION_TOO_LONG",
        message: "وصف المصروف طويل جداً (الحد الأقصى 500 حرف)",
      });
    }

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title.trim();
    if (args.amount !== undefined) updates.amount = args.amount;
    if (args.category !== undefined) updates.category = args.category.trim();
    if (args.description !== undefined) updates.description = args.description?.trim();
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
  args: { branchId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
      .collect();
    const categories = [...new Set(expenses.map((e) => e.category))];
    return categories;
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

    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
      .collect();

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
