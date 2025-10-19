import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

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

    await ctx.db.patch(args.requestId, {
      status: args.status,
      ...(args.adminResponse ? { adminResponse: args.adminResponse } : {}),
      responseDate: Date.now(),
    });

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
