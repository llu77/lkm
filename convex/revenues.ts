import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getStats = query({
  args: { branchId: v.string() },
  handler: async (ctx, args) => {
    const revenues = await ctx.db
      .query("revenues")
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .collect();

    const totalRevenue = revenues.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalCash = revenues.reduce((sum, r) => sum + (r.cash || 0), 0);
    const totalNetwork = revenues.reduce((sum, r) => sum + (r.network || 0), 0);
    const totalBudget = revenues.reduce((sum, r) => sum + (r.budget || 0), 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    const currentMonthRevenues = revenues.filter(
      (r) => r.date >= startOfMonth && r.date <= endOfMonth,
    );
    const currentMonthTotal = currentMonthRevenues.reduce(
      (sum, r) => sum + (r.total || 0),
      0,
    );

    return {
      totalRevenue,
      totalCash,
      totalNetwork,
      totalBudget,
      currentMonthTotal,
      count: revenues.length,
    };
  },
});

export const list = query({
  args: { 
    branchId: v.string(),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const targetMonth = args.month ?? now.getMonth();
    const targetYear = args.year ?? now.getFullYear();
    
    const startOfMonth = new Date(targetYear, targetMonth, 1).getTime();
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59).getTime();

    const revenues = await ctx.db
      .query("revenues")
      .filter((q) => 
        q.and(
          q.eq(q.field("branchId"), args.branchId),
          q.gte(q.field("date"), startOfMonth),
          q.lte(q.field("date"), endOfMonth)
        )
      )
      .order("desc")
      .collect();

    return revenues;
  },
});

export const create = mutation({
  args: {
    date: v.number(),
    cash: v.number(),
    network: v.number(),
    budget: v.number(),
    branchId: v.string(),
    branchName: v.string(),
    employees: v.optional(
      v.array(
        v.object({
          name: v.string(),
          revenue: v.number(),
        }),
      ),
    ),
    mismatchReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
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
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    // ⚠️ حماية: منع إدخال أكثر من إيراد واحد لنفس التاريخ في نفس الفرع
    const startOfDay = new Date(args.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(args.date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingRevenue = await ctx.db
      .query("revenues")
      .filter((q) =>
        q.and(
          q.eq(q.field("branchId"), args.branchId),
          q.gte(q.field("date"), startOfDay.getTime()),
          q.lte(q.field("date"), endOfDay.getTime())
        )
      )
      .first();

    if (existingRevenue) {
      const dateStr = new Date(args.date).toLocaleDateString('ar-SA');
      throw new ConvexError({
        message: `⚠️ لا يمكن إضافة أكثر من إيراد واحد لنفس التاريخ (${dateStr}). يوجد إيراد مسجل بالفعل لهذا اليوم.`,
        code: "CONFLICT",
      });
    }

    // المجموع = كاش + شبكة فقط (بدون موازنة)
    const total = args.cash + args.network;
    const calculatedTotal = args.cash + args.network;
    
    // شروط المطابقة المنفصلة:
    // الشرط الأول: المجموع = كاش + شبكة (هذا دائماً صحيح لأننا نحسبه كذلك)
    const condition1 = true;
    // الشرط الثاني: الموازنة = الشبكة
    const condition2 = args.budget === args.network;
    
    // يجب تحقق الشرطين معاً
    const isMatched = condition1 && condition2;

    if (!isMatched && !args.mismatchReason) {
      throw new ConvexError({
        message: "Mismatch reason is required when revenues don't match",
        code: "BAD_REQUEST",
      });
    }

    // ⚠️ حماية من التلاعب: التحقق من مجموع إيرادات الموظفين
    if (args.employees && args.employees.length > 0) {
      const employeesTotal = args.employees.reduce((sum, emp) => sum + emp.revenue, 0);
      
      // يجب أن يكون مجموع إيرادات الموظفين = المجموع (كاش + شبكة)
      if (employeesTotal !== total) {
        throw new ConvexError({
          message: `⚠️ خطأ: مجموع إيرادات الموظفين (${employeesTotal} ر.س) لا يساوي المجموع الإجمالي (${total} ر.س = كاش ${args.cash} + شبكة ${args.network}). يُرجى التحقق من الأرقام المدخلة.`,
          code: "BAD_REQUEST",
        });
      }
    }

    await ctx.db.insert("revenues", {
      date: args.date,
      cash: args.cash,
      network: args.network,
      budget: args.budget,
      total,
      calculatedTotal,
      isMatched,
      mismatchReason: args.mismatchReason,
      userId: user._id,
      branchId: args.branchId,
      branchName: args.branchName,
      employees: args.employees,
    });
  },
});

export const remove = mutation({
  args: { 
    id: v.id("revenues"),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    // التحقق من كلمة المرور
    if (args.password !== "Omar101010#") {
      throw new ConvexError({
        message: "كلمة المرور غير صحيحة",
        code: "FORBIDDEN",
      });
    }

    // التحقق من أن الإيراد غير معتمد في البونص (حماية من التلاعب)
    const revenue = await ctx.db.get(args.id);
    if (!revenue) {
      throw new ConvexError({
        message: "الإيراد غير موجود",
        code: "NOT_FOUND",
      });
    }

    if (revenue.isApprovedForBonus) {
      throw new ConvexError({
        message: "⚠️ لا يمكن حذف إيراد معتمد في البونص - للحماية من التلاعب بالبيانات المالية",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.id);
  },
});