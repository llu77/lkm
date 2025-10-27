"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * إرسال event إلى Zapier webhook (internal)
 */
export const sendToZapierInternal = internalAction({
  args: {
    webhookUrl: v.string(),
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (_ctx, args) => {
    try {
      const response = await fetch(args.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: args.eventType,
          timestamp: new Date().toISOString(),
          data: args.payload,
        }),
      });

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      console.error("Zapier webhook error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * إرسال event إلى Zapier webhook (public للاختبار)
 */
export const sendToZapier = action({
  args: {
    eventType: v.string(),
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; status?: number; statusText?: string; error?: string }> => {
    // Get Zapier webhook URL from environment variable
    const webhookUrl = process.env.ZAPIER_WEBHOOK_URL || process.env.DEFAULT_ZAPIER_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error(
        "ZAPIER_WEBHOOK_URL not configured. Please set ZAPIER_WEBHOOK_URL in Convex environment variables."
      );
    }

    return await ctx.runAction(internal.zapier.sendToZapierInternal, {
      webhookUrl,
      eventType: args.eventType,
      payload: args.payload,
    });
  },
});

/**
 * إطلاق event لجميع webhooks المسجلة
 */
export const triggerWebhooks = internalAction({
  args: {
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args): Promise<{ triggered: number; successful: number; failed: number }> => {
    // Get active webhooks for this event type
    const webhooks = await ctx.runQuery(internal.zapierQueries.getActiveWebhooks, {
      eventType: args.eventType,
    });

    if (webhooks.length === 0) {
      return { triggered: 0, successful: 0, failed: 0 };
    }

    let successful = 0;
    let failed = 0;

    // Send to all webhooks
    for (const webhook of webhooks) {
      const result = await ctx.runAction(internal.zapier.sendToZapierInternal, {
        webhookUrl: webhook.webhookUrl,
        eventType: args.eventType,
        payload: args.payload,
      });

      // Log the result
      await ctx.runMutation(internal.zapierQueries.logWebhookTrigger, {
        webhookId: webhook._id,
        eventType: args.eventType,
        payload: JSON.stringify(args.payload),
        status: result.success ? "sent" : "failed",
        responseCode: result.status,
        error: result.error,
      });

      // Update webhook stats
      await ctx.runMutation(internal.zapierQueries.updateWebhookStats, {
        webhookId: webhook._id,
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    return {
      triggered: webhooks.length,
      successful,
      failed,
    };
  },
});

/**
 * إرسال email webhook إلى Zapier (internal)
 * يسمح لـ Zapier بإرسال الإيميل عبر Gmail أو أي خدمة بريد أخرى
 */
export const triggerEmailWebhook = internalAction({
  args: {
    to: v.array(v.string()),
    subject: v.string(),
    html: v.string(),
    from: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args): Promise<{ triggered: number; successful: number; failed: number }> => {
    const payload = {
      type: "email_request",
      to: args.to,
      subject: args.subject,
      html: args.html,
      from: args.from || "Symbol AI <noreply@symbolai.com>",
      timestamp: new Date(args.timestamp).toISOString(),
      source: "Email System",
    };

    // إرسال إلى جميع webhooks المسجلة لـ email_request
    return await ctx.runAction(internal.zapier.triggerWebhooks, {
      eventType: "email_request",
      payload,
    });
  },
});

/**
 * إرسال test event إلى Zapier
 */
export const testWebhook = action({
  args: {
    webhookUrl: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const testPayload = {
        test: true,
        message: "Test webhook from System Support",
        timestamp: new Date().toISOString(),
        source: "Hercules App",
      };

      const response = await fetch(args.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      });

      const responseText = await response.text();

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response: responseText,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Test webhook error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});
