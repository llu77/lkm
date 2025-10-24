"use node";

import { internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ================== إيميل يومي - 3:00 صباحاً ==================

/**
 * إرسال تقرير مالي يومي لجميع الفروع
 * يتضمن: إيرادات، مصروفات، إحصائيات متقدمة، validation
 */
export const sendDailyFinancialReport = internalAction({
  args: {},
  handler: async (ctx) => {
    // الحصول على تاريخ اليوم
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999)).getTime();

    // الحصول على جميع الفروع
    const branches = await ctx.runQuery(internal.scheduledEmails.getAllBranches);

    if (!branches || branches.length === 0) {
      console.log("No branches found for daily report");
      return { success: false, message: "No branches found" };
    }

    // إرسال تقرير لكل فرع
    for (const branch of branches) {
      try {
        // الحصول على البيانات المالية لليوم
        const financialData = await ctx.runQuery(internal.scheduledEmails.getDailyFinancialData, {
          branchId: branch.id,
          startDate: startOfDay,
          endDate: endOfDay,
        });

        if (!financialData) continue;

        // إنشاء HTML للإيميل
        const emailHtml = generateDailyReportHTML(financialData, branch.name, yesterday);

        // إرسال الإيميل
        if (branch.supervisorEmail) {
          await ctx.runAction(internal.emailSystem.sendEmailInternal, {
            to: [branch.supervisorEmail],
            subject: `📊 التقرير المالي اليومي - ${branch.name} - ${formatArabicDate(yesterday)}`,
            html: emailHtml,
            from: "نظام الإدارة المالية <reports@resend.dev>",
          });
        }
      } catch (error) {
        console.error(`Error sending daily report for branch ${branch.id}:`, error);
      }
    }

    return { success: true, message: `Daily reports sent to ${branches.length} branches` };
  },
});

// ================== إيميل شهري - يوم 1 الساعة 6:00 صباحاً ==================

/**
 * إرسال تقرير مالي شهري مفصل (من 1 إلى 30)
 */
export const sendMonthlyFinancialReport = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;

    // أول يوم من الشهر الماضي
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0).getTime();
    // يوم 30 من الشهر الماضي
    const endOfMonth = new Date(year, month - 1, 30, 23, 59, 59, 999).getTime();

    // الحصول على جميع الفروع
    const branches = await ctx.runQuery(internal.scheduledEmails.getAllBranches);

    if (!branches || branches.length === 0) {
      console.log("No branches found for monthly report");
      return { success: false, message: "No branches found" };
    }

    // إرسال تقرير لكل فرع
    for (const branch of branches) {
      try {
        // الحصول على البيانات المالية للشهر
        const financialData = await ctx.runQuery(internal.scheduledEmails.getMonthlyFinancialData, {
          branchId: branch.id,
          startDate: startOfMonth,
          endDate: endOfMonth,
          year,
          month,
        });

        if (!financialData) continue;

        // إنشاء HTML للإيميل
        const emailHtml = generateMonthlyReportHTML(financialData, branch.name, year, month);

        // إرسال الإيميل
        if (branch.supervisorEmail) {
          await ctx.runAction(internal.emailSystem.sendEmailInternal, {
            to: [branch.supervisorEmail],
            subject: `📈 التقرير المالي الشهري - ${branch.name} - ${getArabicMonth(month)} ${year}`,
            html: emailHtml,
            from: "نظام الإدارة المالية <reports@resend.dev>",
          });
        }
      } catch (error) {
        console.error(`Error sending monthly report for branch ${branch.id}:`, error);
      }
    }

    return { success: true, message: `Monthly reports sent to ${branches.length} branches` };
  },
});

// ================== إيميلات البونص الأسبوعي ==================

/**
 * إرسال إيميلات البونص للموظفين المستحقين
 * يتم إرسالها في أيام 8، 15، 23، 30
 */
export const sendWeeklyBonusEmails = internalAction({
  args: {
    weekNumber: v.number(), // 1, 2, 3, أو 4
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // الحصول على جميع الفروع
    const branches = await ctx.runQuery(internal.scheduledEmails.getAllBranches);

    if (!branches || branches.length === 0) {
      console.log("No branches found for bonus emails");
      return { success: false, message: "No branches found" };
    }

    // إرسال إيميلات لكل فرع
    for (const branch of branches) {
      try {
        // الحصول على بيانات البونص للأسبوع السابق
        const bonusData = await ctx.runQuery(internal.scheduledEmails.getWeeklyBonusData, {
          branchId: branch.id,
          year,
          month,
          weekNumber: args.weekNumber,
        });

        if (!bonusData || bonusData.employees.length === 0) continue;

        // إرسال إيميل للمشرف
        if (branch.supervisorEmail) {
          const supervisorEmailHtml = generateWeeklyBonusSupervisorHTML(
            bonusData,
            branch.name,
            year,
            month
          );

          await ctx.runAction(internal.emailSystem.sendEmailInternal, {
            to: [branch.supervisorEmail],
            subject: `🎁 تقرير البونص الأسبوعي - ${branch.name} - ${bonusData.weekLabel}`,
            html: supervisorEmailHtml,
            from: "نظام الإدارة المالية <bonus@resend.dev>",
          });
        }

        // إرسال إيميل لكل موظف مستحق
        for (const employee of bonusData.employees) {
          if (employee.isEligible && employee.email) {
            const employeeEmailHtml = generateEmployeeBonusHTML(
              employee,
              branch.name,
              bonusData.weekLabel,
              year,
              month
            );

            await ctx.runAction(internal.emailSystem.sendEmailInternal, {
              to: [employee.email],
              subject: `🎉 تهانينا! لقد حصلت على بونص ${employee.bonusAmount} ريال`,
              html: employeeEmailHtml,
              from: "نظام الإدارة المالية <bonus@resend.dev>",
            });
          }
        }
      } catch (error) {
        console.error(`Error sending bonus emails for branch ${branch.id}:`, error);
      }
    }

    return { success: true, message: `Bonus emails sent to ${branches.length} branches` };
  },
});

// ================== Internal Queries للبيانات ==================

/**
 * الحصول على جميع الفروع مع معلومات الاتصال
 */
export const getAllBranches = internalQuery({
  args: {},
  handler: async (ctx) => {
    // استخراج الفروع من جدول revenues
    const revenues = await ctx.db.query("revenues").collect();

    // تجميع الفروع الفريدة
    const branchesMap = new Map<string, { id: string; name: string }>();

    for (const revenue of revenues) {
      if (revenue.branchId && revenue.branchName) {
        if (!branchesMap.has(revenue.branchId)) {
          branchesMap.set(revenue.branchId, {
            id: revenue.branchId,
            name: revenue.branchName,
          });
        }
      }
    }

    // تحويل إلى array مع إضافة supervisor emails
    // TODO: يجب إضافة supervisorEmail من جدول منفصل أو من employees
    const branches = Array.from(branchesMap.values()).map((branch) => ({
      ...branch,
      supervisorEmail: getSupervisorEmail(branch.id), // دالة مساعدة
    }));

    return branches;
  },
});

/**
 * دالة مساعدة للحصول على email المشرف حسب الفرع
 * TODO: استبدال بجدول branches أو employees
 */
function getSupervisorEmail(branchId: string): string {
  const supervisorEmails: Record<string, string> = {
    "1010": "supervisor.labn@example.com",
    "2020": "supervisor.tuwaiq@example.com",
  };
  return supervisorEmails[branchId] || "admin@example.com";
}

/**
 * الحصول على البيانات المالية اليومية
 */
export const getDailyFinancialData = internalQuery({
  args: {
    branchId: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // الإيرادات
    const revenues = await ctx.db
      .query("revenues")
      .filter((q) =>
        q.and(
          q.eq(q.field("branchId"), args.branchId),
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    // المصروفات
    const expenses = await ctx.db
      .query("expenses")
      .filter((q) =>
        q.and(
          q.eq(q.field("branchId"), args.branchId),
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    const totalRevenue = revenues.reduce((sum, r) => sum + r.total, 0);
    const totalCash = revenues.reduce((sum, r) => sum + r.cash, 0);
    const totalNetwork = revenues.reduce((sum, r) => sum + r.network, 0);
    const totalBudget = revenues.reduce((sum, r) => sum + r.budget, 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Validation: التحقق من تطابق الإيرادات
    const revenueMatches = revenues.filter(r => r.isMatched).length;
    const revenueValidationRate = revenues.length > 0 ? (revenueMatches / revenues.length) * 100 : 100;

    return {
      branchId: args.branchId,
      totalRevenue,
      totalCash,
      totalNetwork,
      totalBudget,
      totalExpenses,
      netProfit,
      profitMargin,
      revenueCount: revenues.length,
      expenseCount: expenses.length,
      revenueValidationRate,
      cashPercentage: totalRevenue > 0 ? (totalCash / totalRevenue) * 100 : 0,
      networkPercentage: totalRevenue > 0 ? (totalNetwork / totalRevenue) * 100 : 0,
      budgetPercentage: totalRevenue > 0 ? (totalBudget / totalRevenue) * 100 : 0,
      expenseCategories: groupExpensesByCategory(expenses),
    };
  },
});

/**
 * الحصول على البيانات المالية الشهرية
 */
export const getMonthlyFinancialData = internalQuery({
  args: {
    branchId: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    // الإيرادات
    const revenues = await ctx.db
      .query("revenues")
      .filter((q) =>
        q.and(
          q.eq(q.field("branchId"), args.branchId),
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    // المصروفات
    const expenses = await ctx.db
      .query("expenses")
      .filter((q) =>
        q.and(
          q.eq(q.field("branchId"), args.branchId),
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    const totalRevenue = revenues.reduce((sum, r) => sum + r.total, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // إحصائيات يومية
    const dailyStats = calculateDailyStats(revenues, expenses, args.startDate, args.endDate);

    // أفضل وأسوأ أيام
    const bestDay = dailyStats.reduce((max, day) => (day.revenue > max.revenue ? day : max), dailyStats[0]);
    const worstDay = dailyStats.reduce((min, day) => (day.revenue < min.revenue ? day : min), dailyStats[0]);

    return {
      branchId: args.branchId,
      year: args.year,
      month: args.month,
      totalRevenue,
      totalExpenses,
      netProfit,
      avgDailyRevenue: totalRevenue / 30,
      avgDailyExpenses: totalExpenses / 30,
      bestDay,
      worstDay,
      dailyStats,
      expenseCategories: groupExpensesByCategory(expenses),
    };
  },
});

/**
 * الحصول على بيانات البونص الأسبوعي
 */
export const getWeeklyBonusData = internalQuery({
  args: {
    branchId: v.string(),
    year: v.number(),
    month: v.number(),
    weekNumber: v.number(),
  },
  handler: async (ctx, args) => {
    // الحصول على سجل البونص المعتمد
    const bonusRecord = await ctx.db
      .query("bonusRecords")
      .withIndex("by_branch_and_date", (q) =>
        q.eq("branchId", args.branchId)
          .eq("year", args.year)
          .eq("month", args.month)
          .eq("weekNumber", args.weekNumber)
      )
      .first();

    if (!bonusRecord) {
      return null;
    }

    // جلب emails الموظفين من جدول employees
    const employeesWithEmails = await Promise.all(
      bonusRecord.employees.map(async (emp) => {
        // البحث عن الموظف في جدول employees
        const employeeRecord = await ctx.db
          .query("employees")
          .filter((q) =>
            q.and(
              q.eq(q.field("employeeName"), emp.employeeName),
              q.eq(q.field("branchId"), args.branchId)
            )
          )
          .first();

        return {
          ...emp,
          email: employeeRecord?.email, // إضافة email من جدول employees
        };
      })
    );

    const employees = employeesWithEmails;

    return {
      weekNumber: args.weekNumber,
      weekLabel: getWeekLabel(args.weekNumber),
      employees,
      totalBonus: bonusRecord.totalBonusPaid,
      eligibleCount: employees.filter((e) => e.isEligible).length,
    };
  },
});

// ================== Helper Functions ==================

function getWeekLabel(weekNumber: number): string {
  const labels = {
    1: "الأسبوع الأول (1-7)",
    2: "الأسبوع الثاني (8-14)",
    3: "الأسبوع الثالث (15-22)",
    4: "الأسبوع الرابع (23-29)",
  };
  return labels[weekNumber as keyof typeof labels] || "أسبوع غير معروف";
}

function getArabicMonth(month: number): string {
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];
  return months[month - 1];
}

function formatArabicDate(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function groupExpensesByCategory(expenses: any[]): Record<string, number> {
  const grouped: Record<string, number> = {};
  for (const expense of expenses) {
    grouped[expense.category] = (grouped[expense.category] || 0) + expense.amount;
  }
  return grouped;
}

function calculateDailyStats(revenues: any[], expenses: any[], startDate: number, endDate: number) {
  const stats = [];
  for (let i = 0; i < 30; i++) {
    const dayStart = startDate + i * 24 * 60 * 60 * 1000;
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;

    const dayRevenues = revenues.filter((r) => r.date >= dayStart && r.date <= dayEnd);
    const dayExpenses = expenses.filter((e) => e.date >= dayStart && e.date <= dayEnd);

    const revenue = dayRevenues.reduce((sum, r) => sum + r.total, 0);
    const expense = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

    stats.push({
      day: i + 1,
      revenue,
      expense,
      profit: revenue - expense,
    });
  }
  return stats;
}

// ================== HTML Email Generators ==================
// (ستكون طويلة جداً - سأضعها في الملف التالي)

function generateDailyReportHTML(data: any, branchName: string, date: Date): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head><meta charset="UTF-8"><title>التقرير اليومي</title></head>
    <body style="font-family: Arial; background: #f0f4f8; padding: 20px;">
      <div style="max-width: 700px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📊 التقرير المالي اليومي</h1>
          <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0;">${branchName} - ${formatArabicDate(date)}</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">

          <!-- Summary Cards -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px; text-align: center;">
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 13px;">إجمالي الإيرادات</p>
              <p style="color: white; margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">${formatNumber(data.totalRevenue)} ر.س</p>
            </div>
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 20px; border-radius: 10px; text-align: center;">
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 13px;">إجمالي المصروفات</p>
              <p style="color: white; margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">${formatNumber(data.totalExpenses)} ر.س</p>
            </div>
          </div>

          <!-- Net Profit -->
          <div style="background: ${data.netProfit >= 0 ? '#d1fae5' : '#fee2e2'}; border: 2px solid ${data.netProfit >= 0 ? '#10b981' : '#ef4444'}; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 14px; color: #374151;">صافي الربح</p>
            <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: ${data.netProfit >= 0 ? '#059669' : '#dc2626'};">
              ${formatNumber(data.netProfit)} ر.س
            </p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280;">هامش الربح: ${data.profitMargin.toFixed(1)}%</p>
          </div>

          <!-- Validation Section -->
          <div style="background: #fef3c7; border-right: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">✓ التحقق من صحة البيانات</h3>
            <p style="margin: 0; color: #78350f; line-height: 1.6;">
              معدل تطابق الإيرادات: <strong>${data.revenueValidationRate.toFixed(1)}%</strong><br>
              ${data.revenueValidationRate === 100 ? '✅ جميع الإيرادات متطابقة' : '⚠️ يوجد إيرادات غير متطابقة - يرجى المراجعة'}
            </p>
          </div>

          <!-- Distribution -->
          <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">توزيع الإيرادات</h3>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>كاش</span>
              <span style="font-weight: bold;">${formatNumber(data.totalCash)} (${data.cashPercentage.toFixed(1)}%)</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>شبكة</span>
              <span style="font-weight: bold;">${formatNumber(data.totalNetwork)} (${data.networkPercentage.toFixed(1)}%)</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>موازنة</span>
              <span style="font-weight: bold;">${formatNumber(data.totalBudget)} (${data.budgetPercentage.toFixed(1)}%)</span>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} نظام الإدارة المالية. جميع الحقوق محفوظة.</p>
        </div>

      </div>
    </body>
    </html>
  `;
}

function generateMonthlyReportHTML(data: any, branchName: string, year: number, month: number): string {
  return `<!DOCTYPE html><html dir="rtl"><body><h1>التقرير الشهري - ${branchName}</h1><p>قريباً...</p></body></html>`;
}

function generateWeeklyBonusSupervisorHTML(data: any, branchName: string, year: number, month: number): string {
  return `<!DOCTYPE html><html dir="rtl"><body><h1>تقرير البونص - ${branchName}</h1><p>قريباً...</p></body></html>`;
}

function generateEmployeeBonusHTML(employee: any, branchName: string, weekLabel: string, year: number, month: number): string {
  return `<!DOCTYPE html><html dir="rtl"><body><h1>تهانينا ${employee.employeeName}!</h1><p>قريباً...</p></body></html>`;
}
