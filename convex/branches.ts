import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

/**
 * إضافة البيانات الأولية للفروع (يتم تشغيله مرة واحدة فقط)
 * يضيف فرعين منفصلين تماماً:
 * - فرع لبن (1010)
 * - فرع طويق (2020)
 */
export const seedBranches = mutation({
  args: {},
  handler: async (ctx) => {
    // التحقق من عدم وجود فروع مسبقاً
    const existingBranches = await ctx.db.query("branches").collect();

    if (existingBranches.length > 0) {
      throw new ConvexError({
        message: "الفروع موجودة مسبقاً في قاعدة البيانات",
        code: "ALREADY_SEEDED",
      });
    }

    // قراءة emails المشرفين من environment variables
    const supervisor1Email = process.env.SUPERVISOR_EMAIL_1010 || process.env.DEFAULT_SUPERVISOR_EMAIL || "admin@company.com";
    const supervisor2Email = process.env.SUPERVISOR_EMAIL_2020 || process.env.DEFAULT_SUPERVISOR_EMAIL || "admin@company.com";

    // إضافة فرع لبن (1010)
    await ctx.db.insert("branches", {
      branchId: "1010",
      branchName: "لبن",
      supervisorEmail: supervisor1Email,
      isActive: true,
      createdAt: Date.now(),
    });

    // إضافة فرع طويق (2020)
    await ctx.db.insert("branches", {
      branchId: "2020",
      branchName: "طويق",
      supervisorEmail: supervisor2Email,
      isActive: true,
      createdAt: Date.now(),
    });

    return {
      success: true,
      message: "تم إضافة الفروع بنجاح",
      branches: [
        { branchId: "1010", branchName: "لبن" },
        { branchId: "2020", branchName: "طويق" },
      ],
    };
  },
});

/**
 * الحصول على جميع الفروع
 */
export const getAllBranches = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("branches").collect();
  },
});

/**
 * الحصول على فرع معين بواسطة branchId
 */
export const getBranchById = query({
  args: { branchId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("branches")
      .withIndex("by_branch_id", (q) => q.eq("branchId", args.branchId))
      .unique();
  },
});

/**
 * الحصول على الفروع النشطة فقط
 */
export const getActiveBranches = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("branches")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

/**
 * تحديث إيميل المشرف لفرع معين
 * (مسموح للأدمن فقط)
 */
export const updateSupervisorEmail = mutation({
  args: {
    branchId: v.string(),
    supervisorEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // التحقق من المصادقة
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "غير مصرح لك بالوصول",
        code: "UNAUTHORIZED",
      });
    }

    // التحقق من صلاحيات الأدمن
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "⚠️ غير مصرح لك بتحديث معلومات الفروع - صلاحيات أدمن فقط",
        code: "FORBIDDEN",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.supervisorEmail)) {
      throw new ConvexError({
        message: "البريد الإلكتروني غير صحيح",
        code: "INVALID_EMAIL",
      });
    }

    // البحث عن الفرع
    const branch = await ctx.db
      .query("branches")
      .withIndex("by_branch_id", (q) => q.eq("branchId", args.branchId))
      .unique();

    if (!branch) {
      throw new ConvexError({
        message: "الفرع غير موجود",
        code: "BRANCH_NOT_FOUND",
      });
    }

    // تحديث الإيميل
    await ctx.db.patch(branch._id, {
      supervisorEmail: args.supervisorEmail,
    });

    return {
      success: true,
      message: `تم تحديث إيميل المشرف لفرع ${branch.branchName}`,
    };
  },
});

/**
 * تفعيل أو إيقاف فرع
 * (مسموح للأدمن فقط)
 */
export const toggleBranchStatus = mutation({
  args: {
    branchId: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // التحقق من المصادقة
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "غير مصرح لك بالوصول",
        code: "UNAUTHORIZED",
      });
    }

    // التحقق من صلاحيات الأدمن
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "⚠️ غير مصرح لك بتحديث حالة الفروع - صلاحيات أدمن فقط",
        code: "FORBIDDEN",
      });
    }

    // البحث عن الفرع
    const branch = await ctx.db
      .query("branches")
      .withIndex("by_branch_id", (q) => q.eq("branchId", args.branchId))
      .unique();

    if (!branch) {
      throw new ConvexError({
        message: "الفرع غير موجود",
        code: "BRANCH_NOT_FOUND",
      });
    }

    // تحديث الحالة
    await ctx.db.patch(branch._id, {
      isActive: args.isActive,
    });

    return {
      success: true,
      message: `تم ${args.isActive ? 'تفعيل' : 'إيقاف'} فرع ${branch.branchName}`,
    };
  },
});
