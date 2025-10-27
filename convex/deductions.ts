import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Get all deductions with filters
export const listDeductions = query({
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

    let query = ctx.db.query("deductions");

    const deductions = await query.collect();

    // Filter by branchId
    let filtered = deductions;
    if (args.branchId) {
      filtered = filtered.filter((d) => d.branchId === args.branchId);
    }

    // Filter by employeeId
    if (args.employeeId) {
      filtered = filtered.filter((d) => d.employeeId === args.employeeId);
    }

    // Filter by month
    if (args.month !== undefined) {
      filtered = filtered.filter((d) => d.month === args.month);
    }

    // Filter by year
    if (args.year !== undefined) {
      filtered = filtered.filter((d) => d.year === args.year);
    }

    return filtered.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Create deduction
export const createDeduction = mutation({
  args: {
    branchId: v.string(),
    branchName: v.string(),
    employeeId: v.id("employees"),
    employeeName: v.string(),
    amount: v.number(),
    month: v.number(),
    year: v.number(),
    reason: v.string(),
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

    const deductionId = await ctx.db.insert("deductions", {
      branchId: args.branchId,
      branchName: args.branchName,
      employeeId: args.employeeId,
      employeeName: args.employeeName,
      amount: args.amount,
      month: args.month,
      year: args.year,
      reason: args.reason,
      description: args.description,
      recordedBy: user._id,
    });

    return deductionId;
  },
});

// Update deduction
export const updateDeduction = mutation({
  args: {
    deductionId: v.id("deductions"),
    amount: v.number(),
    reason: v.string(),
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

    const deduction = await ctx.db.get(args.deductionId);
    if (!deduction) {
      throw new ConvexError({
        message: "الخصم غير موجود",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.deductionId, {
      amount: args.amount,
      reason: args.reason,
      description: args.description,
    });

    return args.deductionId;
  },
});

// Delete deduction
export const deleteDeduction = mutation({
  args: {
    deductionId: v.id("deductions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول أولاً",
        code: "UNAUTHENTICATED",
      });
    }

    const deduction = await ctx.db.get(args.deductionId);
    if (!deduction) {
      throw new ConvexError({
        message: "الخصم غير موجود",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.delete(args.deductionId);
  },
});
