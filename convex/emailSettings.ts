import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * الحصول على إعداد معين
 */
export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("emailSettings")
      .withIndex("by_key", (q) => q.eq("settingKey", args.key))
      .first();

    return setting?.settingValue;
  },
});

/**
 * الحصول على جميع الإعدادات
 */
export const getAllSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("emailSettings").collect();
    
    const settingsMap: Record<string, unknown> = {};
    settings.forEach((setting) => {
      settingsMap[setting.settingKey] = setting.settingValue;
    });

    // Default values if not set
    return {
      senderName: settingsMap.sender_name || "نظام الإدارة المالية",
      senderEmail: settingsMap.sender_email || "onboarding@resend.dev",
      defaultRecipients: settingsMap.default_recipients || [],
      dailySchedule: settingsMap.daily_schedule || {
        enabled: false,
        time: "03:00",
        templateId: "report",
        customContent: "",
        recipients: [],
      },
      monthlySchedule: settingsMap.monthly_schedule || {
        enabled: false,
        day: 1,
        time: "12:00",
        templateId: "report",
        customContent: "",
        recipients: [],
      },
    };
  },
});

/**
 * تحديث إعداد معين
 */
export const updateSetting = mutation({
  args: {
    key: v.string(),
    value: v.union(
      v.string(),
      v.object({
        enabled: v.boolean(),
        time: v.optional(v.string()),
        day: v.optional(v.number()),
        templateId: v.optional(v.string()),
        customContent: v.optional(v.string()),
        recipients: v.optional(v.array(v.string())),
      }),
      v.array(v.string()),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailSettings")
      .withIndex("by_key", (q) => q.eq("settingKey", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        settingValue: args.value,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("emailSettings", {
        settingKey: args.key,
        settingValue: args.value,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * تحديث إعدادات المرسل
 */
export const updateSenderSettings = mutation({
  args: {
    senderName: v.string(),
    senderEmail: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db
      .query("emailSettings")
      .withIndex("by_key", (q) => q.eq("settingKey", "sender_name"))
      .first()
      .then(async (existing) => {
        if (existing) {
          await ctx.db.patch(existing._id, {
            settingValue: args.senderName,
            updatedAt: Date.now(),
          });
        } else {
          await ctx.db.insert("emailSettings", {
            settingKey: "sender_name",
            settingValue: args.senderName,
            updatedAt: Date.now(),
          });
        }
      });

    await ctx.db
      .query("emailSettings")
      .withIndex("by_key", (q) => q.eq("settingKey", "sender_email"))
      .first()
      .then(async (existing) => {
        if (existing) {
          await ctx.db.patch(existing._id, {
            settingValue: args.senderEmail,
            updatedAt: Date.now(),
          });
        } else {
          await ctx.db.insert("emailSettings", {
            settingKey: "sender_email",
            settingValue: args.senderEmail,
            updatedAt: Date.now(),
          });
        }
      });

    return { success: true };
  },
});

/**
 * تحديث المستلمين الافتراضيين
 */
export const updateDefaultRecipients = mutation({
  args: {
    recipients: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailSettings")
      .withIndex("by_key", (q) => q.eq("settingKey", "default_recipients"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        settingValue: args.recipients,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("emailSettings", {
        settingKey: "default_recipients",
        settingValue: args.recipients,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * تحديث الجدولة اليومية
 */
export const updateDailySchedule = mutation({
  args: {
    enabled: v.boolean(),
    time: v.string(),
    templateId: v.optional(v.string()),
    customContent: v.optional(v.string()),
    recipients: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const scheduleValue = {
      enabled: args.enabled,
      time: args.time,
      templateId: args.templateId,
      customContent: args.customContent,
      recipients: args.recipients,
    };

    const existing = await ctx.db
      .query("emailSettings")
      .withIndex("by_key", (q) => q.eq("settingKey", "daily_schedule"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        settingValue: scheduleValue,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("emailSettings", {
        settingKey: "daily_schedule",
        settingValue: scheduleValue,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * تحديث الجدولة الشهرية
 */
export const updateMonthlySchedule = mutation({
  args: {
    enabled: v.boolean(),
    day: v.number(),
    time: v.string(),
    templateId: v.optional(v.string()),
    customContent: v.optional(v.string()),
    recipients: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const scheduleValue = {
      enabled: args.enabled,
      day: args.day,
      time: args.time,
      templateId: args.templateId,
      customContent: args.customContent,
      recipients: args.recipients,
    };

    const existing = await ctx.db
      .query("emailSettings")
      .withIndex("by_key", (q) => q.eq("settingKey", "monthly_schedule"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        settingValue: scheduleValue,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("emailSettings", {
        settingKey: "monthly_schedule",
        settingValue: scheduleValue,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
