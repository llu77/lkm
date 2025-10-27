import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";

/**
 * الحصول على جميع webhooks
 */
export const getWebhooks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("zapierWebhooks").order("desc").collect();
  },
});

/**
 * الحصول على webhooks نشطة لنوع event معين
 */
export const getActiveWebhooks = internalQuery({
  args: { eventType: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("zapierWebhooks")
      .withIndex("by_event", (q) =>
        q.eq("eventType", args.eventType).eq("isActive", true)
      )
      .collect();
  },
});

/**
 * إضافة webhook جديد
 */
export const createWebhook = mutation({
  args: {
    name: v.string(),
    webhookUrl: v.string(),
    eventType: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("zapierWebhooks", {
      name: args.name,
      webhookUrl: args.webhookUrl,
      eventType: args.eventType,
      isActive: true,
      description: args.description,
      triggerCount: 0,
    });
  },
});

/**
 * تحديث webhook
 */
export const updateWebhook = mutation({
  args: {
    webhookId: v.id("zapierWebhooks"),
    name: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
    eventType: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { webhookId, ...updates } = args;
    await ctx.db.patch(webhookId, updates);
  },
});

/**
 * حذف webhook
 */
export const deleteWebhook = mutation({
  args: { webhookId: v.id("zapierWebhooks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.webhookId);
  },
});

/**
 * تحديث إحصائيات webhook
 */
export const updateWebhookStats = internalMutation({
  args: { webhookId: v.id("zapierWebhooks") },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) return;

    await ctx.db.patch(args.webhookId, {
      lastTriggered: Date.now(),
      triggerCount: webhook.triggerCount + 1,
    });
  },
});

/**
 * تسجيل trigger في السجل
 */
export const logWebhookTrigger = internalMutation({
  args: {
    webhookId: v.id("zapierWebhooks"),
    eventType: v.string(),
    payload: v.string(),
    status: v.string(),
    responseCode: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("zapierLogs", args);
  },
});

/**
 * الحصول على سجل webhooks
 */
export const getWebhookLogs = query({
  args: { webhookId: v.optional(v.id("zapierWebhooks")) },
  handler: async (ctx, args) => {
    if (args.webhookId) {
      return await ctx.db
        .query("zapierLogs")
        .withIndex("by_webhook", (q) => q.eq("webhookId", args.webhookId!))
        .order("desc")
        .take(50);
    }
    return await ctx.db.query("zapierLogs").order("desc").take(50);
  },
});

/**
 * الحصول على إحصائيات webhooks
 */
export const getWebhookStats = query({
  args: {},
  handler: async (ctx) => {
    const webhooks = await ctx.db.query("zapierWebhooks").collect();
    const logs = await ctx.db.query("zapierLogs").collect();

    const totalWebhooks = webhooks.length;
    const activeWebhooks = webhooks.filter((w) => w.isActive).length;
    const totalTriggers = logs.length;
    const successfulTriggers = logs.filter((l) => l.status === "sent").length;
    const failedTriggers = logs.filter((l) => l.status === "failed").length;

    return {
      totalWebhooks,
      activeWebhooks,
      totalTriggers,
      successfulTriggers,
      failedTriggers,
      successRate:
        totalTriggers > 0
          ? ((successfulTriggers / totalTriggers) * 100).toFixed(1) + "%"
          : "0%",
    };
  },
});
