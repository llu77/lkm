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

    const revenueId = await ctx.db.insert("revenues", {
      title: args.title,
      amount: args.amount,
      category: args.category,
      description: args.description,
      date: args.date,
      userId: user._id,
    });

    return revenueId;
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

    let revenues = await ctx.db
      .query("revenues")
      .order("desc")
      .collect();

    // Filter by category if provided
    if (args.category && args.category !== "all") {
      revenues = revenues.filter((r) => r.category === args.category);
    }

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

    const revenue = await ctx.db.get(args.id);
    if (!revenue) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Revenue not found",
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

    const revenues = await ctx.db.query("revenues").collect();
    const categories = [...new Set(revenues.map((r) => r.category))];
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

    const allRevenues = await ctx.db.query("revenues").collect();

    // Get current month data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();

    const currentMonthRevenues = allRevenues.filter(
      (r) => r.date >= startOfMonth && r.date <= endOfMonth,
    );

    const totalRevenue = allRevenues.reduce((sum, r) => sum + r.amount, 0);
    const currentMonthTotal = currentMonthRevenues.reduce((sum, r) => sum + r.amount, 0);
    const averageRevenue = allRevenues.length > 0 ? totalRevenue / allRevenues.length : 0;

    // Get category breakdown
    const categoryMap = new Map<string, number>();
    allRevenues.forEach((r) => {
      categoryMap.set(r.category, (categoryMap.get(r.category) || 0) + r.amount);
    });

    const categoryTotals = Array.from(categoryMap.entries()).map(([category, total]) => ({
      category,
      total,
    }));

    return {
      totalRevenue,
      currentMonthTotal,
      totalCount: allRevenues.length,
      currentMonthCount: currentMonthRevenues.length,
      averageRevenue,
      categoryTotals,
    };
  },
});
