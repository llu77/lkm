import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// =====================================
// Queries
// =====================================

export const listEmployees = query({
  args: { branchId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول",
        code: "UNAUTHENTICATED",
      });
    }

    let employees;
    if (args.branchId && args.branchId !== "all") {
      employees = await ctx.db
        .query("employees")
        .withIndex("by_branch", (q) => q.eq("branchId", args.branchId as string))
        .order("desc")
        .collect();
    } else {
      employees = await ctx.db
        .query("employees")
        .order("desc")
        .collect();
    }

    return employees;
  },
});

export const getActiveEmployees = query({
  args: { branchId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول",
        code: "UNAUTHENTICATED",
      });
    }

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_branch_and_active", (q) =>
        q.eq("branchId", args.branchId).eq("isActive", true)
      )
      .order("desc")
      .collect();

    return employees;
  },
});

export const getEmployee = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول",
        code: "UNAUTHENTICATED",
      });
    }

    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new ConvexError({
        message: "الموظف غير موجود",
        code: "NOT_FOUND",
      });
    }

    return employee;
  },
});

// =====================================
// Mutations
// =====================================

export const createEmployee = mutation({
  args: {
    branchId: v.string(),
    branchName: v.string(),
    employeeName: v.string(),
    nationalId: v.optional(v.string()),
    idExpiryDate: v.optional(v.number()),
    baseSalary: v.number(),
    incentives: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "المستخدم غير موجود",
        code: "NOT_FOUND",
      });
    }

    const employeeId = await ctx.db.insert("employees", {
      branchId: args.branchId,
      branchName: args.branchName,
      employeeName: args.employeeName,
      nationalId: args.nationalId,
      idExpiryDate: args.idExpiryDate,
      baseSalary: args.baseSalary,
      incentives: args.incentives,
      isActive: true,
      createdBy: user._id,
    });

    return employeeId;
  },
});

export const updateEmployee = mutation({
  args: {
    employeeId: v.id("employees"),
    employeeName: v.optional(v.string()),
    nationalId: v.optional(v.string()),
    idExpiryDate: v.optional(v.number()),
    baseSalary: v.optional(v.number()),
    incentives: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول",
        code: "UNAUTHENTICATED",
      });
    }

    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new ConvexError({
        message: "الموظف غير موجود",
        code: "NOT_FOUND",
      });
    }

    const updates: Record<string, unknown> = {};
    if (args.employeeName !== undefined) updates.employeeName = args.employeeName;
    if (args.nationalId !== undefined) updates.nationalId = args.nationalId;
    if (args.idExpiryDate !== undefined) updates.idExpiryDate = args.idExpiryDate;
    if (args.baseSalary !== undefined) updates.baseSalary = args.baseSalary;
    if (args.incentives !== undefined) updates.incentives = args.incentives;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.employeeId, updates);

    return args.employeeId;
  },
});

export const deleteEmployee = mutation({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول",
        code: "UNAUTHENTICATED",
      });
    }

    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new ConvexError({
        message: "الموظف غير موجود",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.delete(args.employeeId);

    return { success: true };
  },
});
