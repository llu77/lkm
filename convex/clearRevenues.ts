/**
 * Scheduled Jobs System for Revenue Management
 * 
 * Convex doesn't support traditional cron jobs, but we can use:
 * 1. Scheduled functions with scheduler API
 * 2. Zapier Schedule (recommended for complex schedules)
 * 
 * الجداول المطلوبة:
 * - كل يوم الساعة 3 صباحاً
 * - كل شهر تاريخ 1 الساعة 12:00
 */

"use node";

import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Daily Task: Runs at 3:00 AM
 * Purpose: Clear old notifications, backup data, send daily reports
 */
export const dailyTask3AM = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("🕒 Running dailyTask3AM...");
    
    try {
      // 1. Clear expired notifications
      await ctx.runMutation(internal.clearRevenues.clearExpiredNotifications);
      
      // 2. Log completion (Zapier Schedule recommended for daily tasks)
      console.log("✅ Daily cleanup completed. Use Zapier Schedule for automated reporting.");
      
      // 3. Log completion
      console.log("✅ Daily task 3 AM completed successfully");
      
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error("❌ Daily task 3 AM failed:", error);
      throw error;
    }
  },
});

/**
 * Monthly Task: Runs on 1st of month at 12:00 PM
 * Purpose: Generate monthly reports, calculate bonuses, archive data
 */
export const monthlyTask1st = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("📅 Running monthlyTask1st...");
    
    try {
      const now = new Date();
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      
      // 1. Create monthly backup
      await ctx.runMutation(internal.backup.index.createManualBackup, {
        reason: `Monthly automatic backup - ${now.toLocaleDateString("ar-EG")}`,
      });
      
      // 2. Log completion (Zapier Schedule recommended for monthly tasks)
      console.log("✅ Monthly backup completed. Use Zapier Schedule for automated reporting.");
      
      // 3. Log completion
      console.log("✅ Monthly task 1st completed successfully");
      
      return { 
        success: true, 
        timestamp: new Date().toISOString(),
        month: lastMonth + 1,
        year: lastMonthYear,
      };
    } catch (error) {
      console.error("❌ Monthly task 1st failed:", error);
      throw error;
    }
  },
});

/**
 * Clear expired notifications
 */
export const clearExpiredNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const notifications = await ctx.db.query("notifications").collect();
    
    let deleted = 0;
    for (const notification of notifications) {
      if (notification.expiresAt && notification.expiresAt < now) {
        await ctx.db.delete(notification._id);
        deleted++;
      }
    }
    
    console.log(`🗑️  Cleared ${deleted} expired notifications`);
    return { deleted };
  },
});

/**
 * Helper to schedule next daily run
 * Call this after each run to schedule the next one
 */
export const scheduleNextDailyRun = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Calculate next 3 AM
    const now = new Date();
    const next3AM = new Date(now);
    next3AM.setHours(3, 0, 0, 0);
    
    // If it's past 3 AM today, schedule for tomorrow
    if (now.getHours() >= 3) {
      next3AM.setDate(next3AM.getDate() + 1);
    }
    
    const msUntilNext3AM = next3AM.getTime() - now.getTime();
    
    await ctx.scheduler.runAfter(
      msUntilNext3AM,
      internal.clearRevenues.dailyTask3AM
    );
    
    console.log(`⏰ Next daily task scheduled for: ${next3AM.toISOString()}`);
    return { scheduledFor: next3AM.toISOString() };
  },
});

/**
 * Helper to schedule next monthly run
 */
export const scheduleNextMonthlyRun = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Calculate next 1st of month at 12:00 PM
    const now = new Date();
    const next1st = new Date(now.getFullYear(), now.getMonth() + 1, 1, 12, 0, 0, 0);
    
    const msUntilNext1st = next1st.getTime() - now.getTime();
    
    await ctx.scheduler.runAfter(
      msUntilNext1st,
      internal.clearRevenues.monthlyTask1st
    );
    
    console.log(`📅 Next monthly task scheduled for: ${next1st.toISOString()}`);
    return { scheduledFor: next1st.toISOString() };
  },
});

/**
 * Initialize scheduling system
 * Call this once to start the recurring schedules
 */
export const initializeScheduling = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("🚀 Initializing scheduling system...");
    
    // Schedule next daily run
    await ctx.scheduler.runAfter(0, internal.clearRevenues.scheduleNextDailyRun);
    
    // Schedule next monthly run
    await ctx.scheduler.runAfter(0, internal.clearRevenues.scheduleNextMonthlyRun);
    
    console.log("✅ Scheduling system initialized");
    return { success: true };
  },
});