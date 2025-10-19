import { ConvexError } from "convex/values";
import { query } from "./_generated/server";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    // Get current month dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();

    // Get previous month dates
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getTime();

    // Get all revenues and expenses
    const allRevenues = await ctx.db.query("revenues").collect();
    const allExpenses = await ctx.db.query("expenses").collect();

    // Current month revenues and expenses
    const currentMonthRevenues = allRevenues.filter(
      (r) => r.date >= startOfMonth && r.date <= endOfMonth,
    );
    const currentMonthExpenses = allExpenses.filter(
      (e) => e.date >= startOfMonth && e.date <= endOfMonth,
    );

    // Previous month revenues and expenses
    const lastMonthRevenues = allRevenues.filter(
      (r) => r.date >= startOfLastMonth && r.date <= endOfLastMonth,
    );
    const lastMonthExpenses = allExpenses.filter(
      (e) => e.date >= startOfLastMonth && e.date <= endOfLastMonth,
    );

    // Calculate totals
    const totalRevenue = currentMonthRevenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    const lastMonthTotalRevenue = lastMonthRevenues.reduce((sum, r) => sum + r.amount, 0);
    const lastMonthTotalExpenses = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthNetIncome = lastMonthTotalRevenue - lastMonthTotalExpenses;

    // Calculate growth percentages
    const revenueGrowth = lastMonthTotalRevenue > 0
      ? ((totalRevenue - lastMonthTotalRevenue) / lastMonthTotalRevenue) * 100
      : 0;
    const expenseGrowth = lastMonthTotalExpenses > 0
      ? ((totalExpenses - lastMonthTotalExpenses) / lastMonthTotalExpenses) * 100
      : 0;
    const netIncomeGrowth = lastMonthNetIncome > 0
      ? ((netIncome - lastMonthNetIncome) / lastMonthNetIncome) * 100
      : 0;

    // Get pending orders
    const pendingProductOrders = await ctx.db
      .query("productOrders")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const pendingEmployeeOrders = await ctx.db
      .query("employeeOrders")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      revenueGrowth,
      expenseGrowth,
      netIncomeGrowth,
      pendingProductOrdersCount: pendingProductOrders.length,
      pendingEmployeeOrdersCount: pendingEmployeeOrders.length,
      currentMonth: {
        revenues: currentMonthRevenues.length,
        expenses: currentMonthExpenses.length,
      },
      lastMonth: {
        totalRevenue: lastMonthTotalRevenue,
        totalExpenses: lastMonthTotalExpenses,
        netIncome: lastMonthNetIncome,
      },
    };
  },
});

export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const recentRevenues = await ctx.db
      .query("revenues")
      .order("desc")
      .take(5);

    const recentExpenses = await ctx.db
      .query("expenses")
      .order("desc")
      .take(5);

    return {
      recentRevenues,
      recentExpenses,
    };
  },
});

export const getChartData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    // Get last 6 months data
    const now = new Date();
    const monthsData = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = monthDate.getTime();
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getTime();

      const revenues = await ctx.db
        .query("revenues")
        .withIndex("by_date", (q) => q.gte("date", startOfMonth).lte("date", endOfMonth))
        .collect();

      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_date", (q) => q.gte("date", startOfMonth).lte("date", endOfMonth))
        .collect();

      const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
      const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

      monthsData.push({
        month: monthDate.toLocaleDateString("ar-SA", { month: "short" }),
        revenue: totalRevenue,
        expense: totalExpense,
        net: totalRevenue - totalExpense,
      });
    }

    return monthsData;
  },
});
