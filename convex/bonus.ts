import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

// دالة لتحديد الأسبوع من التاريخ
// ✅ النظام الجديد العادل: كل أسبوع عمل = 7 أيام بالضبط
// الأسابيع: 1-7, 8-14, 15-21, 22-28, 29-31 (أيام متبقية)
// يعمل مع جميع الأشهر: 28، 29، 30، 31 يوم
function getWeekInfo(date: Date) {
  const day = date.getDate();

  if (day >= 1 && day <= 7) {
    return { weekNumber: 1, weekLabel: "الأسبوع الأول (1-7)" };
  } else if (day >= 8 && day <= 14) {
    return { weekNumber: 2, weekLabel: "الأسبوع الثاني (8-14)" };
  } else if (day >= 15 && day <= 21) {
    // ✅ تم التصحيح: 7 أيام بدلاً من 8
    return { weekNumber: 3, weekLabel: "الأسبوع الثالث (15-21)" };
  } else if (day >= 22 && day <= 28) {
    // ✅ تم التصحيح: بداية من 22 بدلاً من 23
    return { weekNumber: 4, weekLabel: "الأسبوع الرابع (22-28)" };
  } else {
    // أيام 29-31 (حسب طول الشهر)
    // فبراير 28: لا يوجد أسبوع 5
    // فبراير 29: يوم 29 فقط
    // أشهر 30: أيام 29-30
    // أشهر 31: أيام 29-31
    return { weekNumber: 5, weekLabel: "أيام متبقية (29-31)" };
  }
}

// دالة لحساب البونص بناءً على الإيراد
function calculateBonus(totalRevenue: number): { amount: number; isEligible: boolean } {
  if (totalRevenue >= 2900) {
    return { amount: 240, isEligible: true };
  } else if (totalRevenue >= 2400) {
    return { amount: 175, isEligible: true };
  } else if (totalRevenue >= 1800) {
    return { amount: 100, isEligible: true };
  } else if (totalRevenue >= 1300) {
    return { amount: 50, isEligible: true };
  } else {
    return { amount: 0, isEligible: false };
  }
}

// دالة لحساب تاريخ بداية ونهاية الأسبوع
// ✅ النظام الجديد: 1-7, 8-14, 15-21, 22-28, 29-31
function getWeekDateRange(year: number, month: number, weekNumber: number) {
  let startDay: number;
  let endDay: number;

  if (weekNumber === 1) {
    startDay = 1;
    endDay = 7;
  } else if (weekNumber === 2) {
    startDay = 8;
    endDay = 14;
  } else if (weekNumber === 3) {
    startDay = 15;
    endDay = 21; // ✅ تم التصحيح: 21 بدلاً من 22
  } else if (weekNumber === 4) {
    startDay = 22; // ✅ تم التصحيح: 22 بدلاً من 23
    endDay = 28; // ✅ تم التصحيح: 28 بدلاً من 29
  } else {
    // أيام 29-31 (حسب طول الشهر)
    startDay = 29; // ✅ تم التصحيح: 29 بدلاً من 30
    // آخر يوم في الشهر (28, 29, 30, or 31)
    const lastDay = new Date(year, month, 0).getDate();
    endDay = lastDay;
  }

  const startDate = new Date(year, month - 1, startDay).getTime();
  const endDate = new Date(year, month - 1, endDay, 23, 59, 59, 999).getTime();

  return { startDate, endDate, startDay, endDay };
}

// جلب إيرادات الموظفين للأسبوع الحالي
export const getCurrentWeekRevenues = query({
  args: { branchId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "يجب تسجيل الدخول" });
    }

    const now = new Date();
    const { weekNumber, weekLabel } = getWeekInfo(now);
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const { startDate, endDate, startDay, endDay } = getWeekDateRange(year, month, weekNumber);

    // جلب جميع الإيرادات للفرع في هذا الأسبوع
    const revenues = await ctx.db
      .query("revenues")
      .filter((q) => 
        q.and(
          q.eq(q.field("branchId"), args.branchId),
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        )
      )
      .collect();

    // حساب إيرادات كل موظف
    const employeeRevenues = new Map<string, number>();

    for (const revenue of revenues) {
      if (revenue.employees) {
        for (const emp of revenue.employees) {
          const current = employeeRevenues.get(emp.name) || 0;
          employeeRevenues.set(emp.name, current + emp.revenue);
        }
      }
    }

    // حساب البونص لكل موظف
    const employeeBonuses = Array.from(employeeRevenues.entries()).map(([name, totalRevenue]) => {
      const { amount, isEligible } = calculateBonus(totalRevenue);
      return {
        employeeName: name,
        totalRevenue,
        bonusAmount: amount,
        isEligible,
      };
    });

    // التحقق من وجود اعتماد سابق لهذا الأسبوع
    const existingRecord = await ctx.db
      .query("bonusRecords")
      .withIndex("by_branch_and_date", (q) =>
        q.eq("branchId", args.branchId).eq("year", year).eq("month", month).eq("weekNumber", weekNumber)
      )
      .first();

    // ✅ تحديد هل يمكن الاعتماد (في أيام 8, 15, 22, 29)
    // الاعتماد يتم في أول يوم من الأسبوع الجديد
    const today = now.getDate();
    const approvalDays = [8, 15, 22, 29]; // ✅ تم التصحيح: 22, 29 بدلاً من 23, 30
    const canApproveToday = approvalDays.includes(today);
    const isAlreadyApproved = !!existingRecord;

    return {
      weekNumber,
      weekLabel,
      startDay,
      endDay,
      month,
      year,
      employeeBonuses,
      totalBonusPaid: employeeBonuses.reduce((sum, emp) => sum + emp.bonusAmount, 0),
      canApprove: canApproveToday && !isAlreadyApproved,
      isAlreadyApproved,
      approvalDate: existingRecord?.approvedAt,
    };
  },
});

// اعتماد البونص
export const approveBonus = mutation({
  args: {
    branchId: v.string(),
    branchName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "يجب تسجيل الدخول" });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({ code: "NOT_FOUND", message: "المستخدم غير موجود" });
    }

    const now = new Date();
    const { weekNumber, weekLabel } = getWeekInfo(now);
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const { startDate, endDate, startDay } = getWeekDateRange(year, month, weekNumber);

    // التحقق من أن اليوم هو اليوم الأول من الأسبوع
    const today = now.getDate();
    if (today !== startDay) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "يمكن اعتماد البونص فقط في اليوم الأول من الأسبوع",
      });
    }

    // التحقق من عدم وجود اعتماد سابق
    const existingRecord = await ctx.db
      .query("bonusRecords")
      .withIndex("by_branch_and_date", (q) =>
        q.eq("branchId", args.branchId).eq("year", year).eq("month", month).eq("weekNumber", weekNumber)
      )
      .first();

    if (existingRecord) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "تم اعتماد البونص لهذا الأسبوع مسبقاً",
      });
    }

    // جلب جميع الإيرادات للفرع في هذا الأسبوع
    const revenues = await ctx.db
      .query("revenues")
      .filter((q) =>
        q.and(
          q.eq(q.field("branchId"), args.branchId),
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        )
      )
      .collect();

    // حساب إيرادات كل موظف
    const employeeRevenues = new Map<string, number>();
    const revenueSnapshot: Array<{ date: number; employeeName: string; revenue: number }> = [];

    for (const revenue of revenues) {
      if (revenue.employees) {
        for (const emp of revenue.employees) {
          const current = employeeRevenues.get(emp.name) || 0;
          employeeRevenues.set(emp.name, current + emp.revenue);
          
          revenueSnapshot.push({
            date: revenue.date,
            employeeName: emp.name,
            revenue: emp.revenue,
          });
        }
      }
    }

    // حساب البونص لكل موظف
    const employeeBonuses = Array.from(employeeRevenues.entries()).map(([name, totalRevenue]) => {
      const { amount, isEligible } = calculateBonus(totalRevenue);
      return {
        employeeName: name,
        totalRevenue,
        bonusAmount: amount,
        isEligible,
      };
    });

    const totalBonusPaid = employeeBonuses.reduce((sum, emp) => sum + emp.bonusAmount, 0);

    // حفظ سجل البونص
    await ctx.db.insert("bonusRecords", {
      branchId: args.branchId,
      branchName: args.branchName,
      weekNumber,
      weekLabel,
      startDate,
      endDate,
      month,
      year,
      employeeBonuses,
      totalBonusPaid,
      approvedBy: user._id,
      approvedAt: Date.now(),
      revenueSnapshot,
    });

    // تحديث الإيرادات لتحديد أنها معتمدة في البونص
    for (const revenue of revenues) {
      await ctx.db.patch(revenue._id, {
        isApprovedForBonus: true,
      });
    }

    return {
      success: true,
      message: "تم اعتماد البونص بنجاح",
      totalBonusPaid,
    };
  },
});

// جلب سجلات البونص المعتمدة
export const getBonusRecords = query({
  args: { branchId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "يجب تسجيل الدخول" });
    }

    const records = await ctx.db
      .query("bonusRecords")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
      .order("desc")
      .collect();

    return records;
  },
});

// التحقق من صحة البيانات (مقارنة البونص مع الإيرادات)
export const verifyBonusData = query({
  args: { recordId: v.id("bonusRecords") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "يجب تسجيل الدخول" });
    }

    const record = await ctx.db.get(args.recordId);
    if (!record) {
      throw new ConvexError({ code: "NOT_FOUND", message: "السجل غير موجود" });
    }

    // جلب الإيرادات الفعلية من قاعدة البيانات
    const revenues = await ctx.db
      .query("revenues")
      .filter((q) =>
        q.and(
          q.eq(q.field("branchId"), record.branchId),
          q.gte(q.field("date"), record.startDate),
          q.lte(q.field("date"), record.endDate)
        )
      )
      .collect();

    // حساب إيرادات كل موظف من البيانات الحالية
    const currentEmployeeRevenues = new Map<string, number>();
    for (const revenue of revenues) {
      if (revenue.employees) {
        for (const emp of revenue.employees) {
          const current = currentEmployeeRevenues.get(emp.name) || 0;
          currentEmployeeRevenues.set(emp.name, current + emp.revenue);
        }
      }
    }

    // مقارنة مع البيانات المحفوظة
    const discrepancies: Array<{ employeeName: string; saved: number; current: number }> = [];

    for (const bonus of record.employeeBonuses) {
      const currentRevenue = currentEmployeeRevenues.get(bonus.employeeName) || 0;
      if (currentRevenue !== bonus.totalRevenue) {
        discrepancies.push({
          employeeName: bonus.employeeName,
          saved: bonus.totalRevenue,
          current: currentRevenue,
        });
      }
    }

    return {
      isValid: discrepancies.length === 0,
      discrepancies,
      message: discrepancies.length === 0 
        ? "البيانات متطابقة" 
        : "تم اكتشاف تناقضات في البيانات",
    };
  },
});