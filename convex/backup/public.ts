import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";

// إنشاء نسخة احتياطية يدوية (متاح للمستخدمين)
export const createBackup = mutation({
  args: { 
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول",
        code: "UNAUTHENTICATED",
      });
    }
    
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
    
    // إنشاء نسخة احتياطية
    await ctx.scheduler.runAfter(
      0,
      internal.backup.index.createManualBackup,
      { reason: args.reason || "نسخة احتياطية يدوية" }
    );
    
    return { success: true, message: "تم بدء عملية النسخ الاحتياطي" };
  },
});

// الحصول على قائمة النسخ الاحتياطية
export const getBackups = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    
    const backups = await ctx.db
      .query("backups")
      .order("desc")
      .take(30);
    
    return backups.map(b => ({
      _id: b._id,
      date: new Date(b.date).toISOString(),
      backupDate: b.backupDate,
      type: b.type === "daily-automatic" ? "تلقائية يومية" : "يدوية",
      reason: b.reason,
      dataSnapshot: b.dataSnapshot,
      status: b.status === "completed" ? "مكتملة" : "فشلت",
    }));
  },
});

// إحصائيات النسخ الاحتياطية
export const getBackupStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    const allBackups = await ctx.db.query("backups").collect();
    
    const lastBackup = await ctx.db
      .query("backups")
      .order("desc")
      .first();
    
    return {
      totalBackups: allBackups.length,
      lastBackupDate: lastBackup?.backupDate || null,
      lastBackupSnapshot: lastBackup?.dataSnapshot || null,
      automaticBackups: allBackups.filter(b => b.type === "daily-automatic").length,
      manualBackups: allBackups.filter(b => b.type === "manual").length,
    };
  },
});

// استعادة البيانات من نسخة احتياطية
export const restoreBackup = mutation({
  args: { 
    backupId: v.id("backups"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "يجب تسجيل الدخول",
        code: "UNAUTHENTICATED",
      });
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "فقط المشرفون يمكنهم استعادة البيانات",
        code: "FORBIDDEN",
      });
    }
    
    // استعادة البيانات
    await ctx.scheduler.runAfter(
      0,
      internal.backup.index.restoreFromBackup,
      { 
        backupId: args.backupId,
        confirmRestore: true,
      }
    );
    
    return { success: true, message: "تم بدء عملية استعادة البيانات" };
  },
});
