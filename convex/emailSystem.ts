"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";

// ================== Email Templates ==================

const EMAIL_TEMPLATES = {
  welcome: {
    name: "رسالة ترحيب",
    subject: "مرحباً بك في نظام الإدارة المالية",
    html: `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">مرحباً بك {{name}}</h1>
        </div>
        <div style="padding: 40px; background: #f8f9fa;">
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            نحن سعداء بانضمامك إلى نظام الإدارة المالية.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            يمكنك الآن البدء في استخدام جميع ميزات النظام.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              الذهاب للوحة التحكم
            </a>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>© 2025 نظام الإدارة المالية. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    `,
  },
  notification: {
    name: "إشعار عام",
    subject: "إشعار من نظام الإدارة المالية",
    html: `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; border: 2px solid #e0e0e0; border-radius: 10px;">
        <div style="background: #f59e0b; padding: 30px; text-align: center;">
          <h2 style="color: white; margin: 0;">🔔 إشعار جديد</h2>
        </div>
        <div style="padding: 40px;">
          <h3 style="color: #333;">{{title}}</h3>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            {{message}}
          </p>
          {{#if actionUrl}}
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{actionUrl}}" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              {{actionText}}
            </a>
          </div>
          {{/if}}
        </div>
      </div>
    `,
  },
  alert: {
    name: "تنبيه هام",
    subject: "⚠️ تنبيه: {{alertType}}",
    html: `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; border: 3px solid #ef4444;">
        <div style="background: #ef4444; padding: 30px; text-align: center;">
          <h2 style="color: white; margin: 0;">⚠️ تنبيه هام</h2>
        </div>
        <div style="padding: 40px; background: #fef2f2;">
          <h3 style="color: #dc2626;">{{alertType}}</h3>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            {{description}}
          </p>
          <div style="background: white; padding: 20px; border-right: 4px solid #ef4444; margin: 20px 0;">
            <strong>التفاصيل:</strong>
            <p style="margin: 10px 0;">{{details}}</p>
          </div>
          {{#if actionRequired}}
          <div style="background: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>⚡ إجراء مطلوب:</strong>
            <p style="margin: 10px 0;">{{actionRequired}}</p>
          </div>
          {{/if}}
        </div>
      </div>
    `,
  },
  report: {
    name: "تقرير دوري",
    subject: "📊 تقرير {{reportType}} - {{period}}",
    html: `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">📊 {{reportType}}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0;">{{period}}</p>
        </div>
        <div style="padding: 40px; background: #f8f9fa;">
          <h3 style="color: #333;">ملخص التقرير</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #e5e7eb;">
              <th style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">البند</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">القيمة</th>
            </tr>
            {{#each metrics}}
            <tr>
              <td style="padding: 12px; border: 1px solid #d1d5db;">{{this.label}}</td>
              <td style="padding: 12px; border: 1px solid #d1d5db; text-align: left; font-weight: bold;">{{this.value}}</td>
            </tr>
            {{/each}}
          </table>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{reportUrl}}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              عرض التقرير الكامل
            </a>
          </div>
        </div>
      </div>
    `,
  },
};

// ================== Template Rendering ==================

function renderTemplate(templateId: string, variables: Record<string, unknown>): { subject: string; html: string } {
  const template = EMAIL_TEMPLATES[templateId as keyof typeof EMAIL_TEMPLATES];
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  let subject = template.subject;
  let html = template.html;

  // Simple variable replacement
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    subject = subject.replace(regex, String(value));
    html = html.replace(regex, String(value));
  });

  // Handle conditionals (basic implementation)
  html = html.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (_, key, content) => {
    return variables[key] ? content : "";
  });

  // Handle loops (basic implementation)
  html = html.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (_, key, content) => {
    const items = variables[key];
    if (!Array.isArray(items)) return "";
    return items.map(item => {
      let itemHtml = content;
      Object.entries(item).forEach(([itemKey, itemValue]) => {
        itemHtml = itemHtml.replace(new RegExp(`{{this\\.${itemKey}}}`, "g"), String(itemValue));
      });
      return itemHtml;
    }).join("");
  });

  return { subject, html };
}

// ================== Email Sending Actions ==================

type SendEmailResult = {
  emailId: string;
  success: boolean;
};

export const sendEmail = action({
  args: {
    to: v.array(v.string()),
    subject: v.string(),
    html: v.string(),
    from: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<SendEmailResult> => {
    // إرسال webhook إلى Zapier أولاً (non-blocking)
    try {
      await ctx.runAction(internal.zapier.triggerEmailWebhook, {
        to: args.to,
        subject: args.subject,
        html: args.html,
        from: args.from,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Zapier webhook error (non-blocking):", error);
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);

    try {
      const result = await resend.emails.send({
        from: args.from || "نظام الإدارة المالية <onboarding@resend.dev>",
        to: args.to,
        subject: args.subject,
        html: args.html,
      });

      // Log the email
      await ctx.runMutation(internal.emailLogs.logEmail, {
        to: args.to,
        subject: args.subject,
        status: "sent",
        emailId: result.data?.id || "unknown",
      });

      if (!result.data?.id) {
        return { success: true, emailId: "unknown" };
      }

      return { success: true, emailId: result.data.id };
    } catch (error) {
      // Log failed email
      await ctx.runMutation(internal.emailLogs.logEmail, {
        to: args.to,
        subject: args.subject,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

export const sendTemplateEmail = action({
  args: {
    to: v.array(v.string()),
    templateId: v.string(),
    variables: v.any(),
    from: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; emailId?: string }> => {
    const { subject, html } = renderTemplate(args.templateId, args.variables);

    // إرسال webhook إلى Zapier (non-blocking)
    try {
      await ctx.runAction(internal.zapier.triggerEmailWebhook, {
        to: args.to,
        subject,
        html,
        from: args.from,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Zapier webhook error (non-blocking):", error);
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);

    try {
      const result = await resend.emails.send({
        from: args.from || "نظام الإدارة المالية <onboarding@resend.dev>",
        to: args.to,
        subject,
        html,
      });

      await ctx.runMutation(internal.emailLogs.logEmail, {
        to: args.to,
        subject,
        status: "sent",
        emailId: result.data?.id || "unknown",
      });

      if (!result.data?.id) {
        return { success: true, emailId: "unknown" };
      }

      return { success: true, emailId: result.data.id };
    } catch (error) {
      await ctx.runMutation(internal.emailLogs.logEmail, {
        to: args.to,
        subject,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

export const testEmail = action({
  args: {
    to: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; emailId?: string }> => {
    const { subject, html } = renderTemplate("welcome", {
      name: "مختبر النظام",
      dashboardUrl: "https://your-app.com/dashboard",
    });

    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);

    try {
      const result = await resend.emails.send({
        from: "نظام الإدارة المالية <onboarding@resend.dev>",
        to: [args.to],
        subject,
        html,
      });

      await ctx.runMutation(internal.emailLogs.logEmail, {
        to: [args.to],
        subject,
        status: "sent",
        emailId: result.data?.id || "unknown",
      });

      return { success: true, emailId: result.data?.id };
    } catch (error) {
      await ctx.runMutation(internal.emailLogs.logEmail, {
        to: [args.to],
        subject,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

export const getTemplates = action({
  args: {},
  handler: async () => {
    return Object.entries(EMAIL_TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
      subject: template.subject,
    }));
  },
});

export const getTemplatePreview = action({
  args: {
    templateId: v.string(),
    variables: v.any(),
  },
  handler: async (ctx, args) => {
    return renderTemplate(args.templateId, args.variables);
  },
});

