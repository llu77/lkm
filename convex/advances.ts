import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Get all advances with filters
export const listAdvances = query({
  args: {
    branchId: v.optional(v.string()),
    employeeId: v.optional(v.id("employees")),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول أولاً",
        code: "UNAUTHENTICATED",
      });
    }

    let query = ctx.db.query("advances");

    const advances = await query.collect();

    // Filter by branchId
    let filtered = advances;
    if (args.branchId) {
      filtered = filtered.filter((a) => a.branchId === args.branchId);
    }

    // Filter by employeeId
    if (args.employeeId) {
      filtered = filtered.filter((a) => a.employeeId === args.employeeId);
    }

    // Filter by month
    if (args.month !== undefined) {
      filtered = filtered.filter((a) => a.month === args.month);
    }

    // Filter by year
    if (args.year !== undefined) {
      filtered = filtered.filter((a) => a.year === args.year);
    }

    return filtered.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Create advance
export const createAdvance = mutation({
  args: {
    branchId: v.string(),
    branchName: v.string(),
    employeeId: v.id("employees"),
    employeeName: v.string(),
    amount: v.number(),
    month: v.number(),
    year: v.number(),
    description: v.optional(v.string()),
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

    // Verify employee exists
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new ConvexError({
        message: "الموظف غير موجود",
        code: "NOT_FOUND",
      });
    }

    const advanceId = await ctx.db.insert("advances", {
      branchId: args.branchId,
      branchName: args.branchName,
      employeeId: args.employeeId,
      employeeName: args.employeeName,
      amount: args.amount,
      month: args.month,
      year: args.year,
      description: args.description,
      recordedBy: user._id,
    });

    return advanceId;
  },
});

// Update advance
export const updateAdvance = mutation({
  args: {
    advanceId: v.id("advances"),
    amount: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول أولاً",
        code: "UNAUTHENTICATED",
      });
    }

    const advance = await ctx.db.get(args.advanceId);
    if (!advance) {
      throw new ConvexError({
        message: "السلفة غير موجودة",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.advanceId, {
      amount: args.amount,
      description: args.description,
    });

    return args.advanceId;
  },
});

// Delete advance
export const deleteAdvance = mutation({
  args: {
    advanceId: v.id("advances"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول أولاً",
        code: "UNAUTHENTICATED",
      });
    }

    const advance = await ctx.db.get(args.advanceId);
    if (!advance) {
      throw new ConvexError({
        message: "السلفة غير موجودة",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.delete(args.advanceId);
  },
});
