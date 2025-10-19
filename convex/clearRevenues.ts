/**
 * Scheduled Jobs System for Revenue Management
 * 
 * NOTE: Convex doesn't support traditional cron jobs.
 * Use Zapier Schedule (recommended) for complex schedules.
 * See ZAPIER_SCHEDULER_SETUP.md for setup instructions.
 * 
 * الجداول المطلوبة:
 * - كل يوم الساعة 3 صباحاً: Clear expired notifications
 * - كل شهر تاريخ 1 الساعه 12:00: Generate backups, monthly reports
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Clear expired notifications
 * Call this from Zapier Schedule (Daily at 3:00 AM)
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
    
    console.log(`🧹 Deleted ${deleted} expired notifications`);
    return { deleted, timestamp: new Date().toISOString() };
  },
});

/**
 * Clear old dismissed notifications (older than 30 days)
 * Call this from Zapier Schedule (Weekly)
 */
export const clearOldDismissedNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const notifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("isDismissed"), true))
      .collect();
    
    let deleted = 0;
    for (const notification of notifications) {
      if (notification._creationTime < thirtyDaysAgo) {
        await ctx.db.delete(notification._id);
        deleted++;
      }
    }
    
    console.log(`🗑️ Deleted ${deleted} old dismissed notifications`);
    return { deleted, timestamp: new Date().toISOString() };
  },
});
