"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * إرسال event إلى Zapier webhook
 */
export const sendToZapier = internalAction({
  args: {
    webhookUrl: v.string(),
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
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
 * إطلاق event لجميع webhooks المسجلة
 */
export const triggerWebhooks = internalAction({
  args: {
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args): Promise<{ triggered: number; successful: number; failed: number }> => {
    // Get active webhooks for this event type
    const webhooks: Array<{_id: any; webhookUrl: string}> = await ctx.runQuery(internal.zapierQueries.getActiveWebhooks, {
      eventType: args.eventType,
    });

    if (webhooks.length === 0) {
      return { triggered: 0, successful: 0, failed: 0 };
    }

    let successful = 0;
    let failed = 0;

    // Send to all webhooks
    for (const webhook of webhooks) {
      const result = await ctx.runAction(internal.zapier.sendToZapier, {
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
