import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel.d.ts";

/**
 * Get active notifications for a branch
 */
export const getActiveBranch = query({
  args: { branchId: v.string() },
  handler: async (ctx, { branchId }) => {
    const now = Date.now();
    
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_branch", (q) => q.eq("branchId", branchId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isDismissed"), false),
          q.or(
            q.eq(q.field("expiresAt"), undefined),
            q.gt(q.field("expiresAt"), now)
          )
        )
      )
      .order("desc")
      .take(20);

    return notifications;
  },
});

/**
 * Get unread notifications count
 */
export const getUnreadCount = query({
  args: { branchId: v.string() },
  handler: async (ctx, { branchId }) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_branch_and_read", (q) =>
        q.eq("branchId", branchId).eq("isRead", false)
      )
      .filter((q) => q.eq(q.field("isDismissed"), false))
      .collect();

    return notifications.length;
  },
});

/**
 * Get critical notifications
 */
export const getCritical = query({
  args: { branchId: v.string() },
  handler: async (ctx, { branchId }) => {
    const now = Date.now();
    
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_severity", (q) => q.eq("severity", "critical"))
      .filter((q) =>
        q.and(
          q.eq(q.field("branchId"), branchId),
          q.eq(q.field("isDismissed"), false),
          q.or(
            q.eq(q.field("expiresAt"), undefined),
            q.gt(q.field("expiresAt"), now)
          )
        )
      )
      .order("desc")
      .collect();

    return notifications;
  },
});

/**
 * Mark notification as read
 */
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    await ctx.db.patch(notificationId, {
      isRead: true,
    });
  },
});

/**
 * Dismiss notification
 */
export const dismiss = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    await ctx.db.patch(notificationId, {
      isDismissed: true,
      isRead: true,
    });
  },
});

/**
 * Dismiss all notifications for a branch
 */
export const dismissAll = mutation({
  args: { branchId: v.string() },
  handler: async (ctx, { branchId }) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_branch", (q) => q.eq("branchId", branchId))
      .filter((q) => q.eq(q.field("isDismissed"), false))
      .collect();

    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        isDismissed: true,
        isRead: true,
      });
    }

    return { dismissed: notifications.length };
  },
});

/**
 * Create manual notification (for testing or manual alerts)
 */
export const create = mutation({
  args: {
    branchId: v.string(),
    branchName: v.string(),
    type: v.string(),
    severity: v.string(),
    title: v.string(),
    message: v.string(),
    actionRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      branchId: args.branchId,
      branchName: args.branchName,
      type: args.type,
      severity: args.severity,
      title: args.title,
      message: args.message,
      reasoning: undefined,
      aiGenerated: false,
      actionRequired: args.actionRequired || false,
      relatedEntity: undefined,
      isRead: false,
      isDismissed: false,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return notificationId;
  },
});

/**
 * Create AI-generated notification (called from AI agents)
 */
export const createAINotification = internalMutation({
  args: {
    branchId: v.string(),
    branchName: v.string(),
    type: v.string(),
    severity: v.string(),
    title: v.string(),
    message: v.string(),
    reasoning: v.string(),
    aiGenerated: v.boolean(),
    actionRequired: v.boolean(),
    relatedEntity: v.object({
      type: v.string(),
      id: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      branchId: args.branchId,
      branchName: args.branchName,
      type: args.type,
      severity: args.severity,
      title: args.title,
      message: args.message,
      reasoning: args.reasoning,
      aiGenerated: args.aiGenerated,
      actionRequired: args.actionRequired,
      relatedEntity: args.relatedEntity,
      isRead: false,
      isDismissed: false,
      expiresAt: args.severity === "critical" 
        ? undefined 
        : Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return notificationId;
  },
});

/**
 * Get recent revenues (called from AI agents)
 */
export const getRecentRevenues = internalMutation({
  args: {
    branchId: v.string(),
    sinceDate: v.number(),
  },
  handler: async (ctx, { branchId, sinceDate }) => {
    const revenues = await ctx.db
      .query("revenues")
      .withIndex("by_branch", (q) => q.eq("branchId", branchId))
      .filter((q) => q.gte(q.field("date"), sinceDate))
      .collect();

    return revenues.map(r => ({
      date: r.date,
      total: r.total || 0,
      isMatched: r.isMatched || false,
      cash: r.cash || 0,
      network: r.network || 0,
      budget: r.budget || 0,
    }));
  },
});
