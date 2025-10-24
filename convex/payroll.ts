import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { ConvexError } from "convex/values";

// Get payroll records with filters
export const listPayrollRecords = query({
  args: {
    branchId: v.optional(v.string()),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not authenticated",
        code: "UNAUTHENTICATED",
      });
    }

    let records;
    
    // Apply filters
    if (args.branchId && args.branchId !== undefined) {
      const branchId = args.branchId;
      records = await ctx.db
        .query("payrollRecords")
        .withIndex("by_branch_month", (q) =>
          q.eq("branchId", branchId)
        )
        .collect();
    } else {
      records = await ctx.db.query("payrollRecords").collect();
    }

    // Additional filters
    let filtered = records;
    if (args.month !== undefined) {
      filtered = filtered.filter((r) => r.month === args.month);
    }
    if (args.year !== undefined) {
      filtered = filtered.filter((r) => r.year === args.year);
    }

    return filtered.sort((a, b) => b.generatedAt - a.generatedAt);
  },
});

// Generate payroll for a specific branch and month
export const generatePayroll = mutation({
  args: {
    branchId: v.string(),
    branchName: v.string(),
    supervisorName: v.optional(v.string()),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not authenticated",
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
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    // Get active employees for this branch
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (employees.length === 0) {
      throw new ConvexError({
        message: "No active employees found for this branch",
        code: "NOT_FOUND",
      });
    }

    // Process each employee
    const employeePayrolls = [];
    let totalNetSalary = 0;

    for (const employee of employees) {
      // Get advances for this employee this month
      const advances = await ctx.db
        .query("advances")
        .withIndex("by_employee_month", (q) =>
          q
            .eq("employeeId", employee._id)
            .eq("year", args.year)
            .eq("month", args.month)
        )
        .collect();

      const totalAdvances = advances.reduce(
        (sum, advance) => sum + advance.amount,
        0
      );

      // Get deductions for this employee this month
      const deductions = await ctx.db
        .query("deductions")
        .withIndex("by_employee_month", (q) =>
          q
            .eq("employeeId", employee._id)
            .eq("year", args.year)
            .eq("month", args.month)
        )
        .collect();

      const totalDeductions = deductions.reduce(
        (sum, deduction) => sum + deduction.amount,
        0
      );

      // Calculate net salary
      const grossSalary =
        employee.baseSalary +
        employee.supervisorAllowance +
        employee.incentives;
      const netSalary = grossSalary - totalAdvances - totalDeductions;

      totalNetSalary += netSalary;

      employeePayrolls.push({
        employeeId: employee._id,
        employeeName: employee.employeeName,
        nationalId: employee.nationalId,
        baseSalary: employee.baseSalary,
        supervisorAllowance: employee.supervisorAllowance,
        incentives: employee.incentives,
        totalAdvances,
        totalDeductions,
        netSalary,
      });
    }

    // Create payroll record
    const payrollId = await ctx.db.insert("payrollRecords", {
      branchId: args.branchId,
      branchName: args.branchName,
      supervisorName: args.supervisorName,
      month: args.month,
      year: args.year,
      employees: employeePayrolls,
      totalNetSalary,
      generatedAt: Date.now(),
      generatedBy: user._id,
      emailSent: false,
    });

    return payrollId;
  },
});

// Delete payroll record
export const deletePayroll = mutation({
  args: {
    payrollId: v.id("payrollRecords"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not authenticated",
        code: "UNAUTHENTICATED",
      });
    }

    const payroll = await ctx.db.get(args.payrollId);
    if (!payroll) {
      throw new ConvexError({
        message: "Payroll record not found",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.delete(args.payrollId);
  },
});

// Mark payroll as email sent (public mutation)
export const markEmailSent = mutation({
  args: {
    payrollId: v.id("payrollRecords"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not authenticated",
        code: "UNAUTHENTICATED",
      });
    }

    await ctx.db.patch(args.payrollId, {
      emailSent: true,
      emailSentAt: Date.now(),
    });
  },
});

// Internal version for scheduled tasks
export const markEmailSentInternal = internalMutation({
  args: {
    payrollId: v.id("payrollRecords"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.payrollId, {
      emailSent: true,
      emailSentAt: Date.now(),
    });
  },
});

// Update payroll email status with PDF URL
export const updatePayrollEmailStatus = mutation({
  args: {
    payrollId: v.id("payrollRecords"),
    emailSent: v.boolean(),
    pdfUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.payrollId, {
      emailSent: args.emailSent,
      emailSentAt: args.emailSent ? Date.now() : undefined,
      pdfUrl: args.pdfUrl,
    });
  },
});
