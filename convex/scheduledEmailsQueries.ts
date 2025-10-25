// Internal queries for scheduledEmails actions
// These are separated because "use node" files can only contain actions

import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * الحصول على جميع الفروع النشطة من قاعدة البيانات
 */
export const getAllBranches = internalQuery({
  args: {},
  handler: async (ctx) => {
    // قراءة جميع الفروع النشطة من قاعدة البيانات
    const branches = await ctx.db
      .query("branches")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // تحويل الصيغة لتوافق الكود الحالي
    return branches.map((branch) => ({
      id: branch.branchId,
      name: branch.branchName,
      supervisorEmail: branch.supervisorEmail,
    }));
  },
});

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

    const totalRevenue = revenues.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalCash = revenues.reduce((sum, r) => sum + (r.cash || 0), 0);
    const totalNetwork = revenues.reduce((sum, r) => sum + (r.network || 0), 0);
    const totalBudget = revenues.reduce((sum, r) => sum + (r.budget || 0), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Validation: التحقق من تطابق الإيرادات
    const revenueMatches = revenues.filter(r => r.isMatched).length;
    const revenueValidationRate = revenues.length > 0 ? (revenueMatches / revenues.length) * 100 : 100;

    // Group expenses by category
    const expenseCategories = expenses.reduce((acc: any, exp) => {
      const category = exp.category || 'أخرى';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += exp.amount;
      return acc;
    }, {});

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
      expenseCategories,
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
    // نفس المنطق كـ getDailyFinancialData لكن لشهر كامل
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

    const totalRevenue = revenues.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      revenueCount: revenues.length,
      expenseCount: expenses.length,
    };
  },
});

/**
 * الحصول على بيانات بونص الأسبوع
 */
export const getWeeklyBonusData = internalQuery({
  args: {
    branchId: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    year: v.number(),
    month: v.number(),
    weekNumber: v.number(),
  },
  handler: async (ctx, args) => {
    // الحصول على إيرادات الأسبوع المعتمدة للبونص
    const revenues = await ctx.db
      .query("revenues")
      .filter((q) =>
        q.and(
          q.eq(q.field("branchId"), args.branchId),
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate),
          q.eq(q.field("isApprovedForBonus"), true)
        )
      )
      .collect();

    // حساب البونص لكل موظف
    const employeeBonuses: any[] = [];
    const bonusPercentage = 5; // 5% بونص

    revenues.forEach(revenue => {
      if (revenue.employees && Array.isArray(revenue.employees)) {
        revenue.employees.forEach(emp => {
          const bonusAmount = emp.revenue * (bonusPercentage / 100);
          employeeBonuses.push({
            employeeName: emp.name,
            totalRevenue: emp.revenue,
            bonusAmount,
            bonusPercentage,
          });
        });
      }
    });

    const totalRevenue = revenues.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalBonus = employeeBonuses.reduce((sum, e) => sum + e.bonusAmount, 0);

    return {
      branchId: args.branchId,
      year: args.year,
      month: args.month,
      weekNumber: args.weekNumber,
      totalRevenue,
      totalBonus,
      employees: employeeBonuses,
    };
  },
});

