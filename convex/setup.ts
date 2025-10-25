/**
 * 🗑️ Database Reset & Setup Script
 *
 * هذا السكريبت يقوم بـ:
 * 1. مسح جميع البيانات من قاعدة البيانات
 * 2. إنشاء بيانات تجريبية (اختياري)
 *
 * ⚠️ تحذير: هذا السكريبت سيحذف جميع البيانات!
 * استخدمه فقط في بيئة Development أو عند إعادة التهيئة الكاملة
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * مسح جميع البيانات من جدول معين
 */
async function clearTable(ctx: any, tableName: string) {
  const records = await ctx.db.query(tableName).collect();
  let deletedCount = 0;

  for (const record of records) {
    await ctx.db.delete(record._id);
    deletedCount++;
  }

  return deletedCount;
}

/**
 * مسح قاعدة البيانات بالكامل
 * ⚠️ هذا سيحذف جميع البيانات من جميع الجداول!
 */
export const clearAllData = mutation({
  args: {
    confirmationText: v.string(), // يجب أن يكون "CLEAR_ALL_DATA" للتأكيد
  },
  handler: async (ctx, args) => {
    // التأكد من أن المستخدم يريد فعلاً المسح
    if (args.confirmationText !== "CLEAR_ALL_DATA") {
      throw new Error(
        '⚠️ للتأكيد، يجب إدخال النص: "CLEAR_ALL_DATA"'
      );
    }

    console.log("🗑️ بدء مسح قاعدة البيانات...");

    const results: Record<string, number> = {};

    // قائمة جميع الجداول في النظام
    const tables = [
      "notifications",
      "backups",
      "users",
      "revenues",
      "expenses",
      "productOrders",
      "employeeOrders",
      "bonusRecords",
      "employeeRequests",
      "emailLogs",
      "zapierWebhooks",
      "zapierLogs",
      "emailSettings",
      "branches",
      "employees",
      "advances",
      "deductions",
      "payrollRecords",
    ];

    // مسح كل جدول
    for (const tableName of tables) {
      try {
        const count = await clearTable(ctx, tableName);
        results[tableName] = count;
        console.log(`✅ ${tableName}: تم حذف ${count} سجل`);
      } catch (error) {
        console.error(`❌ خطأ في مسح ${tableName}:`, error);
        results[tableName] = -1; // -1 تعني فشل
      }
    }

    console.log("✅ اكتمل مسح قاعدة البيانات");

    return {
      success: true,
      message: "تم مسح جميع البيانات بنجاح",
      results,
      totalDeleted: Object.values(results).reduce((a, b) => a + Math.max(0, b), 0),
    };
  },
});

/**
 * مسح بيانات جدول واحد فقط
 */
export const clearTableData = mutation({
  args: {
    tableName: v.string(),
    confirmationText: v.string(), // يجب أن يكون "CLEAR_TABLE" للتأكيد
  },
  handler: async (ctx, args) => {
    if (args.confirmationText !== "CLEAR_TABLE") {
      throw new Error(
        '⚠️ للتأكيد، يجب إدخال النص: "CLEAR_TABLE"'
      );
    }

    console.log(`🗑️ بدء مسح جدول: ${args.tableName}`);

    const count = await clearTable(ctx, args.tableName);

    console.log(`✅ تم حذف ${count} سجل من ${args.tableName}`);

    return {
      success: true,
      message: `تم مسح ${count} سجل من ${args.tableName}`,
      tableName: args.tableName,
      deletedCount: count,
    };
  },
});

/**
 * إنشاء بيانات أساسية للنظام (الفروع والمستخدمين)
 */
export const setupInitialData = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🚀 بدء إنشاء البيانات الأساسية...");

    // 1. إنشاء الفروع
    const branches = [
      {
        branchId: "1010",
        branchName: "لبن",
        supervisorEmail: "labn@example.com",
        isActive: true,
        createdAt: Date.now(),
      },
      {
        branchId: "2020",
        branchName: "طويق",
        supervisorEmail: "tuwaiq@example.com",
        isActive: true,
        createdAt: Date.now(),
      },
    ];

    const createdBranches = [];
    for (const branch of branches) {
      const id = await ctx.db.insert("branches", branch);
      createdBranches.push({ ...branch, _id: id });
      console.log(`✅ تم إنشاء فرع: ${branch.branchName}`);
    }

    console.log("✅ اكتمل إنشاء البيانات الأساسية");

    return {
      success: true,
      message: "تم إنشاء البيانات الأساسية بنجاح",
      created: {
        branches: createdBranches.length,
      },
    };
  },
});

/**
 * إعادة تهيئة كاملة: مسح + إنشاء بيانات أساسية
 */
export const resetDatabase = mutation({
  args: {
    confirmationText: v.string(), // يجب أن يكون "RESET_DATABASE" للتأكيد
  },
  handler: async (ctx, args) => {
    if (args.confirmationText !== "RESET_DATABASE") {
      throw new Error(
        '⚠️ للتأكيد، يجب إدخال النص: "RESET_DATABASE"'
      );
    }

    console.log("🔄 بدء إعادة تهيئة قاعدة البيانات...");

    // 1. مسح جميع البيانات
    const clearResult = await clearAllData(ctx, {
      confirmationText: "CLEAR_ALL_DATA",
    });

    // 2. إنشاء البيانات الأساسية
    const setupResult = await setupInitialData(ctx, {});

    console.log("✅ اكتملت إعادة التهيئة بنجاح");

    return {
      success: true,
      message: "تم إعادة تهيئة قاعدة البيانات بنجاح",
      cleared: clearResult,
      setup: setupResult,
    };
  },
});
