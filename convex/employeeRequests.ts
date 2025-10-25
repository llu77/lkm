import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import { triggerEmployeeRequestCreated } from "./zapierHelper";

// قائمة الموظفين حسب الفرع
export const BRANCH_EMPLOYEES = {
  "1010": ["عبدالحي جلال", "محمود عمارة", "علاء ناصر", "السيد محمد", "عمرو"],
  "2020": ["محمد إسماعيل", "محمد ناصر", "فارس محمد"],
};

// قائمة المشرفين حسب الفرع
export const BRANCH_SUPERVISORS = {
  "1010": "عبدالحي جلال",
  "2020": "محمد إسماعيل",
};

// إنشاء طلب جديد
export const create = mutation({
  args: {
    branchId: v.string(),
    branchName: v.string(),
    employeeName: v.string(),
    requestType: v.string(),
    
    // اختياري حسب نوع الطلب
    advanceAmount: v.optional(v.number()),
    vacationDate: v.optional(v.number()),
    duesAmount: v.optional(v.number()),
    permissionDate: v.optional(v.number()),
    permissionStartTime: v.optional(v.string()),
    permissionEndTime: v.optional(v.string()),
    permissionHours: v.optional(v.number()),
    violationDate: v.optional(v.number()),
    objectionReason: v.optional(v.string()),
    objectionDetails: v.optional(v.string()),
    nationalId: v.optional(v.string()),
    resignationText: v.optional(v.string()),
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

    const requestId = await ctx.db.insert("employeeRequests", {
      branchId: args.branchId,
      branchName: args.branchName,
      employeeName: args.employeeName,
      requestType: args.requestType,
      status: "تحت الإجراء",
      requestDate: Date.now(),
      userId: user._id,

      advanceAmount: args.advanceAmount,
      vacationDate: args.vacationDate,
      duesAmount: args.duesAmount,
      permissionDate: args.permissionDate,
      permissionStartTime: args.permissionStartTime,
      permissionEndTime: args.permissionEndTime,
      permissionHours: args.permissionHours,
      violationDate: args.violationDate,
      objectionReason: args.objectionReason,
      objectionDetails: args.objectionDetails,
      nationalId: args.nationalId,
      resignationText: args.resignationText,
    });

    // Trigger Zapier webhook for employee request creation
    const request = await ctx.db.get(requestId);
    if (request) {
      await triggerEmployeeRequestCreated(ctx, {
        _id: request._id,
        employeeName: request.employeeName,
        requestType: request.requestType,
        status: request.status,
        branchId: request.branchId,
        branchName: request.branchName,
      });
    }

    return requestId;
  },
});

// الحصول على طلبات موظف معين
export const getMyRequests = query({
  args: { branchId: v.string(), employeeName: v.string() },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("employeeRequests")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
      .filter((q) => q.eq(q.field("employeeName"), args.employeeName))
      .order("desc")
      .collect();

    return requests;
  },
});

// الحصول على جميع الطلبات من كل الفروع (للأدمن)
export const getAllRequests = query({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db
      .query("employeeRequests")
      .order("desc")
      .collect();

    return requests;
  },
});

// تحديث حالة الطلب (قبول/رفض)
export const updateStatus = mutation({
  args: {
    requestId: v.id("employeeRequests"),
    status: v.string(), // "مقبول" أو "مرفوض"
    adminResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول أولاً",
        code: "UNAUTHENTICATED",
      });
    }

    // التحقق من صلاحيات المستخدم (admin only)
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "المستخدم غير موجود",
        code: "NOT_FOUND",
      });
    }

    if (user.role !== "admin") {
      throw new ConvexError({
        message: "⚠️ غير مصرح لك بإدارة الطلبات - صلاحيات أدمن فقط",
        code: "FORBIDDEN",
      });
    }

    // الحصول على تفاصيل الطلب
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new ConvexError({
        message: "الطلب غير موجود",
        code: "NOT_FOUND",
      });
    }

    // تحديث حالة الطلب
    await ctx.db.patch(args.requestId, {
      status: args.status,
      ...(args.adminResponse ? { adminResponse: args.adminResponse } : {}),
      responseDate: Date.now(),
    });

    // ✅ المزامنة التلقائية: إنشاء سجل سلفة أو خصم عند القبول
    if (args.status === "مقبول") {
      // الحصول على معرف الموظف من جدول الموظفين
      const employee = await ctx.db
        .query("employees")
        .withIndex("by_branch", (q) => q.eq("branchId", request.branchId))
        .filter((q) => q.eq(q.field("employeeName"), request.employeeName))
        .first();

      if (!employee) {
        console.warn(`⚠️ لم يتم العثور على الموظف: ${request.employeeName} في الفرع: ${request.branchId}`);
        // لا نرمي خطأ - فقط تحذير في السجل
        return { success: true };
      }

      // الحصول على الشهر والسنة الحاليين
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();

      // إنشاء سلفة تلقائياً عند قبول طلب سلفة
      if (request.requestType === "سلفة" && request.advanceAmount) {
        await ctx.db.insert("advances", {
          branchId: request.branchId,
          branchName: request.branchName,
          employeeId: employee._id,
          employeeName: request.employeeName,
          amount: request.advanceAmount,
          month: currentMonth,
          year: currentYear,
          description: `سلفة تم قبولها تلقائياً من طلب رقم: ${args.requestId}`,
          recordedBy: user._id,
        });
        console.log(`✅ تم إنشاء سجل سلفة تلقائياً للموظف: ${request.employeeName}`);
      }

      // إنشاء خصم تلقائياً عند قبول طلب صرف متأخرات
      if (request.requestType === "صرف متأخرات" && request.duesAmount) {
        await ctx.db.insert("deductions", {
          branchId: request.branchId,
          branchName: request.branchName,
          employeeId: employee._id,
          employeeName: request.employeeName,
          amount: request.duesAmount,
          month: currentMonth,
          year: currentYear,
          reason: "صرف متأخرات",
          description: `خصم تم قبوله تلقائياً من طلب رقم: ${args.requestId}`,
          recordedBy: user._id,
        });
        console.log(`✅ تم إنشاء سجل خصم تلقائياً للموظف: ${request.employeeName}`);
      }
    }

    return { success: true };
  },
});

// الحصول على إحصائيات الطلبات
export const getStats = query({
  args: { branchId: v.string() },
  handler: async (ctx, args) => {
    const allRequests = await ctx.db
      .query("employeeRequests")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
      .collect();

    const pending = allRequests.filter((r) => r.status === "تحت الإجراء").length;
    const approved = allRequests.filter((r) => r.status === "مقبول").length;
    const rejected = allRequests.filter((r) => r.status === "مرفوض").length;

    return {
      total: allRequests.length,
      pending,
      approved,
      rejected,
    };
  },
});

// ✅ التحقق من كلمة مرور إدارة الطلبات (مخفية في backend)
export const verifyManageRequestsPassword = mutation({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    // كلمة المرور مخزنة في Convex environment variables (ليست VITE_)
    // يمكن تعيينها عبر: npx convex env set MANAGE_REQUESTS_PASSWORD "your-password"
    const correctPassword = process.env.MANAGE_REQUESTS_PASSWORD;

    if (!correctPassword) {
      throw new ConvexError({
        message: "خطأ في التكوين: كلمة المرور غير معرّفة في البيئة",
        code: "CONFIG_ERROR",
      });
    }

    // التحقق من كلمة المرور
    const isValid = args.password === correctPassword;

    return {
      isValid,
      message: isValid ? "تم التحقق بنجاح" : "كلمة مرور خاطئة",
    };
  },
});
