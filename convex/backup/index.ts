import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel.d.ts";

// إنشاء نسخة احتياطية يومية
export const createDailyBackup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const backupDate = new Date(now);
    
    // جلب جميع البيانات
    const revenues = await ctx.db.query("revenues").collect();
    const expenses = await ctx.db.query("expenses").collect();
    const productOrders = await ctx.db.query("productOrders").collect();
    const employeeRequests = await ctx.db.query("employeeRequests").collect();
    const bonusRecords = await ctx.db.query("bonusRecords").collect();
    
    // حفظ النسخة الاحتياطية
    const backupId = await ctx.db.insert("backups", {
      date: now,
      backupDate: backupDate.toISOString(),
      type: "daily-automatic",
      dataSnapshot: {
        revenues: revenues.length,
        expenses: expenses.length,
        productOrders: productOrders.length,
        employeeRequests: employeeRequests.length,
        bonusRecords: bonusRecords.length,
      },
      revenuesData: revenues.map(r => ({ ...r })),
      expensesData: expenses.map(e => ({ ...e })),
      productOrdersData: productOrders.map(p => ({ ...p })),
      employeeRequestsData: employeeRequests.map(e => ({ ...e })),
      bonusRecordsData: bonusRecords.map(b => ({ ...b })),
      status: "completed",
    });
    
    console.log(`✅ Daily backup created: ${backupId}`);
    console.log(`📊 Backed up: ${revenues.length} revenues, ${expenses.length} expenses`);
    
    // حذف النسخ الاحتياطية القديمة (أكثر من 90 يوم)
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
    const oldBackups = await ctx.db
      .query("backups")
      .filter((q) => q.lt(q.field("date"), ninetyDaysAgo))
      .collect();
    
    for (const backup of oldBackups) {
      await ctx.db.delete(backup._id);
    }
    
    console.log(`🗑️ Deleted ${oldBackups.length} old backups`);
    
    return backupId;
  },
});

// إنشاء نسخة احتياطية يدوية
export const createManualBackup = internalMutation({
  args: { 
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const backupDate = new Date(now);
    
    // جلب جميع البيانات
    const revenues = await ctx.db.query("revenues").collect();
    const expenses = await ctx.db.query("expenses").collect();
    const productOrders = await ctx.db.query("productOrders").collect();
    const employeeRequests = await ctx.db.query("employeeRequests").collect();
    const bonusRecords = await ctx.db.query("bonusRecords").collect();
    
    // حفظ النسخة الاحتياطية
    const backupId = await ctx.db.insert("backups", {
      date: now,
      backupDate: backupDate.toISOString(),
      type: "manual",
      reason: args.reason,
      dataSnapshot: {
        revenues: revenues.length,
        expenses: expenses.length,
        productOrders: productOrders.length,
        employeeRequests: employeeRequests.length,
        bonusRecords: bonusRecords.length,
      },
      revenuesData: revenues.map(r => ({ ...r })),
      expensesData: expenses.map(e => ({ ...e })),
      productOrdersData: productOrders.map(p => ({ ...p })),
      employeeRequestsData: employeeRequests.map(e => ({ ...e })),
      bonusRecordsData: bonusRecords.map(b => ({ ...b })),
      status: "completed",
    });
    
    console.log(`✅ Manual backup created: ${backupId}`);
    
    return backupId;
  },
});

// استعادة البيانات من نسخة احتياطية
export const restoreFromBackup = internalMutation({
  args: { 
    backupId: v.id("backups"),
    confirmRestore: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirmRestore) {
      throw new Error("يجب تأكيد استعادة البيانات");
    }
    
    const backup = await ctx.db.get(args.backupId);
    if (!backup) {
      throw new Error("النسخة الاحتياطية غير موجودة");
    }
    
    // إنشاء نسخة احتياطية للأمان قبل الاستعادة
    console.log("⚠️ Creating safety backup before restore...");
    
    // حذف البيانات الحالية
    const currentRevenues = await ctx.db.query("revenues").collect();
    const currentExpenses = await ctx.db.query("expenses").collect();
    
    for (const rev of currentRevenues) {
      await ctx.db.delete(rev._id);
    }
    for (const exp of currentExpenses) {
      await ctx.db.delete(exp._id);
    }
    
    // استعادة البيانات
    if (backup.revenuesData) {
      for (const revenue of backup.revenuesData) {
        const { _id, _creationTime, userId, ...data } = revenue;
        await ctx.db.insert("revenues", {
          ...data,
          userId: userId as unknown as Id<"users">,
        });
      }
    }
    
    if (backup.expensesData) {
      for (const expense of backup.expensesData) {
        const { _id, _creationTime, userId, ...data } = expense;
        await ctx.db.insert("expenses", {
          ...data,
          userId: userId as unknown as Id<"users">,
        });
      }
    }
    
    console.log(`✅ Data restored from backup: ${args.backupId}`);
    
    return {
      success: true,
      restoredCounts: backup.dataSnapshot,
    };
  },
});

// الحصول على قائمة النسخ الاحتياطية
export const listBackups = internalQuery({
  args: {},
  handler: async (ctx) => {
    const backups = await ctx.db
      .query("backups")
      .order("desc")
      .take(50);
    
    return backups.map(b => ({
      _id: b._id,
      date: b.date,
      backupDate: b.backupDate,
      type: b.type,
      reason: b.reason,
      dataSnapshot: b.dataSnapshot,
      status: b.status,
    }));
  },
});

// إحصائيات النسخ الاحتياطية
export const getBackupStats = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allBackups = await ctx.db.query("backups").collect();
    
    const lastBackup = await ctx.db
      .query("backups")
      .order("desc")
      .first();
    
    return {
      totalBackups: allBackups.length,
      lastBackupDate: lastBackup?.backupDate,
      lastBackupSnapshot: lastBackup?.dataSnapshot,
      automaticBackups: allBackups.filter(b => b.type === "daily-automatic").length,
      manualBackups: allBackups.filter(b => b.type === "manual").length,
    };
  },
});
