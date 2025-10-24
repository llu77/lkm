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
    if (args.branchId) {
      const branchId = args.branchId;
      employees = await ctx.db
        .query("employees")
        .withIndex("by_branch_and_active", (q) =>
          q.eq("branchId", branchId).eq("isActive", true)
        )
        .order("desc")
        .collect();
    } else {
      // If no branch selected, show all active employees
      const allEmployees = await ctx.db
        .query("employees")
        .collect();
      employees = allEmployees.filter((e) => e.isActive);
    }

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
    supervisorAllowance: v.number(),
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

    // === Comprehensive Validation ===

    // Validate required string fields
    if (!args.branchId?.trim()) {
      throw new ConvexError({
        message: "معرف الفرع مطلوب",
        code: "INVALID_INPUT",
      });
    }

    if (!args.branchName?.trim()) {
      throw new ConvexError({
        message: "اسم الفرع مطلوب",
        code: "INVALID_INPUT",
      });
    }

    if (!args.employeeName?.trim()) {
      throw new ConvexError({
        message: "اسم الموظف مطلوب",
        code: "INVALID_INPUT",
      });
    }

    // Validate salary values
    if (args.baseSalary <= 0) {
      throw new ConvexError({
        message: "الراتب الأساسي يجب أن يكون أكبر من صفر",
        code: "INVALID_SALARY",
      });
    }

    if (args.supervisorAllowance < 0) {
      throw new ConvexError({
        message: "بدل الإشراف لا يمكن أن يكون سالباً",
        code: "INVALID_ALLOWANCE",
      });
    }

    if (args.incentives < 0) {
      throw new ConvexError({
        message: "الحوافز لا يمكن أن تكون سالبة",
        code: "INVALID_INCENTIVES",
      });
    }

    // Validate total salary is reasonable
    const totalSalary = args.baseSalary + args.supervisorAllowance + args.incentives;
    if (totalSalary > 100000) {
      throw new ConvexError({
        message: "إجمالي الراتب يتجاوز الحد المسموح (100,000 ر.س)",
        code: "SALARY_TOO_HIGH",
      });
    }

    // Validate national ID format if provided
    if (args.nationalId) {
      const nationalIdTrimmed = args.nationalId.trim();
      if (nationalIdTrimmed.length !== 10) {
        throw new ConvexError({
          message: "رقم الهوية الوطنية يجب أن يكون 10 أرقام",
          code: "INVALID_NATIONAL_ID",
        });
      }

      // Check if it's all digits
      if (!/^\d+$/.test(nationalIdTrimmed)) {
        throw new ConvexError({
          message: "رقم الهوية الوطنية يجب أن يحتوي على أرقام فقط",
          code: "INVALID_NATIONAL_ID_FORMAT",
        });
      }
    }

    // Validate ID expiry date if provided
    if (args.idExpiryDate) {
      if (args.idExpiryDate < Date.now()) {
        throw new ConvexError({
          message: "تاريخ انتهاء الهوية يجب أن يكون في المستقبل",
          code: "EXPIRED_ID",
        });
      }
    }

    // Check for duplicate employee name in the same branch
    const existingEmployee = await ctx.db
      .query("employees")
      .filter((q) =>
        q.and(
          q.eq(q.field("branchId"), args.branchId),
          q.eq(q.field("employeeName"), args.employeeName.trim())
        )
      )
      .first();

    if (existingEmployee) {
      throw new ConvexError({
        message: `موظف بنفس الاسم "${args.employeeName}" موجود مسبقاً في فرع ${args.branchName}`,
        code: "DUPLICATE_EMPLOYEE",
      });
    }

    const employeeId = await ctx.db.insert("employees", {
      branchId: args.branchId,
      branchName: args.branchName,
      employeeName: args.employeeName.trim(),
      nationalId: args.nationalId?.trim(),
      idExpiryDate: args.idExpiryDate,
      baseSalary: args.baseSalary,
      supervisorAllowance: args.supervisorAllowance,
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
    supervisorAllowance: v.optional(v.number()),
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

    // === Comprehensive Validation ===

    // Validate employee name if being updated
    if (args.employeeName !== undefined && !args.employeeName?.trim()) {
      throw new ConvexError({
        message: "اسم الموظف لا يمكن أن يكون فارغاً",
        code: "INVALID_INPUT",
      });
    }

    // Validate salary values if being updated
    if (args.baseSalary !== undefined && args.baseSalary <= 0) {
      throw new ConvexError({
        message: "الراتب الأساسي يجب أن يكون أكبر من صفر",
        code: "INVALID_SALARY",
      });
    }

    if (args.supervisorAllowance !== undefined && args.supervisorAllowance < 0) {
      throw new ConvexError({
        message: "بدل الإشراف لا يمكن أن يكون سالباً",
        code: "INVALID_ALLOWANCE",
      });
    }

    if (args.incentives !== undefined && args.incentives < 0) {
      throw new ConvexError({
        message: "الحوافز لا يمكن أن تكون سالبة",
        code: "INVALID_INCENTIVES",
      });
    }

    // Validate total salary if any salary component is being updated
    if (args.baseSalary !== undefined || args.supervisorAllowance !== undefined || args.incentives !== undefined) {
      const newBaseSalary = args.baseSalary ?? employee.baseSalary;
      const newSupervisorAllowance = args.supervisorAllowance ?? employee.supervisorAllowance;
      const newIncentives = args.incentives ?? employee.incentives;
      const totalSalary = newBaseSalary + newSupervisorAllowance + newIncentives;

      if (totalSalary > 100000) {
        throw new ConvexError({
          message: "إجمالي الراتب يتجاوز الحد المسموح (100,000 ر.س)",
          code: "SALARY_TOO_HIGH",
        });
      }
    }

    // Validate national ID format if being updated
    if (args.nationalId !== undefined && args.nationalId) {
      const nationalIdTrimmed = args.nationalId.trim();
      if (nationalIdTrimmed.length !== 10) {
        throw new ConvexError({
          message: "رقم الهوية الوطنية يجب أن يكون 10 أرقام",
          code: "INVALID_NATIONAL_ID",
        });
      }

      if (!/^\d+$/.test(nationalIdTrimmed)) {
        throw new ConvexError({
          message: "رقم الهوية الوطنية يجب أن يحتوي على أرقام فقط",
          code: "INVALID_NATIONAL_ID_FORMAT",
        });
      }
    }

    // Validate ID expiry date if being updated
    if (args.idExpiryDate !== undefined && args.idExpiryDate) {
      if (args.idExpiryDate < Date.now()) {
        throw new ConvexError({
          message: "تاريخ انتهاء الهوية يجب أن يكون في المستقبل",
          code: "EXPIRED_ID",
        });
      }
    }

    const updates: Record<string, unknown> = {};
    if (args.employeeName !== undefined) updates.employeeName = args.employeeName.trim();
    if (args.nationalId !== undefined) updates.nationalId = args.nationalId?.trim();
    if (args.idExpiryDate !== undefined) updates.idExpiryDate = args.idExpiryDate;
    if (args.baseSalary !== undefined) updates.baseSalary = args.baseSalary;
    if (args.supervisorAllowance !== undefined) updates.supervisorAllowance = args.supervisorAllowance;
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
