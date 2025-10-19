"use node";

import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

// ============================================================================
// Multi-Agent System Architecture
// ============================================================================

/**
 * Master Orchestrator: Claude Multi-Agent Controller
 * Uses reasoning chains and tool calling for intelligent decision making
 */

// ============================================================================
// Agent 1: Data Validator Agent
// ============================================================================

export const validateRevenueData = action({
  args: {
    revenue: v.object({
      date: v.number(),
      cash: v.number(),
      network: v.number(),
      budget: v.number(),
      total: v.number(),
      calculatedTotal: v.number(),
      isMatched: v.boolean(),
      employees: v.optional(v.array(v.object({
        name: v.string(),
        revenue: v.number(),
      }))),
    }),
    branchId: v.string(),
    branchName: v.string(),
    historicalData: v.array(v.object({
      date: v.number(),
      total: v.number(),
      isMatched: v.boolean(),
    })),
  },
  handler: async (ctx, { revenue, branchId, branchName, historicalData }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const anthropic = new Anthropic({ apiKey });

    // Calculate statistics
    const avgRevenue = historicalData.length > 0
      ? historicalData.reduce((sum, r) => sum + r.total, 0) / historicalData.length
      : 0;
    
    const deviationPercent = avgRevenue > 0 
      ? ((revenue.total - avgRevenue) / avgRevenue) * 100 
      : 0;

    const recentMismatches = historicalData
      .slice(-7)
      .filter(r => !r.isMatched).length;

    // Build reasoning prompt
    const prompt = `أنت Data Validator Agent متخصص في التحقق من صحة البيانات المالية.

قم بتحليل إيراد ${branchName} التالي وكتابة reasoning chain منطقي:

📊 **البيانات الجديدة:**
- التاريخ: ${new Date(revenue.date).toLocaleDateString("ar-EG")}
- الكاش: ${revenue.cash.toLocaleString()} ر.س
- الشبكة: ${revenue.network.toLocaleString()} ر.س
- الموازنة: ${revenue.budget.toLocaleString()} ر.س
- المجموع المسجل: ${revenue.total.toLocaleString()} ر.س
- المجموع المحسوب: ${revenue.calculatedTotal.toLocaleString()} ر.س
- الحالة: ${revenue.isMatched ? "✅ مطابق" : "❌ غير مطابق"}
${revenue.employees && revenue.employees.length > 0 ? `- الموظفون: ${revenue.employees.map(e => `${e.name} (${e.revenue.toLocaleString()} ر.س)`).join(", ")}` : ""}

📈 **السياق التاريخي:**
- متوسط الإيرادات (آخر ${historicalData.length} يوم): ${avgRevenue.toLocaleString()} ر.س
- الانحراف: ${deviationPercent.toFixed(1)}%
- عدم المطابقة الأخير (آخر 7 أيام): ${recentMismatches} مرة

---

**المطلوب منك:**

1. **تحليل منطقي (Reasoning Chain):**
   - هل البيانات منطقية؟
   - هل هناك أنماط غريبة؟
   - هل الانحراف عن المتوسط مقبول؟
   - هل هناك تلاعب محتمل؟

2. **تقييم المخاطر:**
   - المستوى: منخفض / متوسط / عالي / حرج
   - احتمالية الخطأ: نسبة مئوية

3. **التوصيات:**
   - هل يجب إرسال تنبيه؟
   - هل يجب طلب تحقق إضافي؟
   - هل يجب إشعار المدير؟

4. **إشعار مقترح:**
   - عنوان واضح ومباشر
   - رسالة تفصيلية باللغة العربية
   - مستوى الأهمية

أعطني ردك بتنسيق JSON صارم:
{
  "isValid": true/false,
  "reasoning": "سلسلة التفكير المنطقي...",
  "riskLevel": "low/medium/high/critical",
  "confidence": 0.XX,
  "issues": ["قائمة المشاكل"],
  "recommendations": ["قائمة التوصيات"],
  "notification": {
    "shouldCreate": true/false,
    "severity": "low/medium/high/critical",
    "title": "عنوان",
    "message": "رسالة تفصيلية",
    "actionRequired": true/false
  }
}`;

    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: "أنت Data Validator Agent خبير في التحقق من صحة البيانات المالية. ردودك دائماً بصيغة JSON صارمة.",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const textContent = message.content.find((block) => block.type === "text");
      const responseText = textContent?.type === "text" ? textContent.text : "{}";
      
      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        isValid: true,
        reasoning: "تحليل غير متاح",
        riskLevel: "low",
        confidence: 0.5,
        issues: [],
        recommendations: [],
        notification: { shouldCreate: false },
      };

      // Create notification if needed
      if (analysisResult.notification?.shouldCreate) {
        await ctx.runMutation(internal.ai.createNotification, {
          branchId,
          branchName,
          type: analysisResult.riskLevel === "critical" ? "error" : "warning",
          severity: analysisResult.notification.severity || analysisResult.riskLevel,
          title: analysisResult.notification.title,
          message: analysisResult.notification.message,
          reasoning: analysisResult.reasoning,
          aiGenerated: true,
          actionRequired: analysisResult.notification.actionRequired || false,
          relatedEntity: {
            type: "revenue",
            id: revenue.date.toString(),
          },
        });
      }

      return {
        ...analysisResult,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error("Data Validator Agent error:", error);
      return {
        isValid: true,
        reasoning: "فشل التحليل الآلي",
        riskLevel: "low",
        confidence: 0,
        issues: ["فشل في تشغيل AI Agent"],
        recommendations: ["يرجى المراجعة اليدوية"],
        notification: { shouldCreate: false },
      };
    }
  },
});

// ============================================================================
// Agent 2: Content Writer Agent
// ============================================================================

export const generateSmartContent = action({
  args: {
    contentType: v.string(), // "notification", "email", "report", "summary"
    context: v.object({
      branchName: v.string(),
      data: v.string(), // JSON string of relevant data
      purpose: v.string(),
    }),
  },
  handler: async (ctx, { contentType, context }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const anthropic = new Anthropic({ apiKey });

    const prompts: Record<string, string> = {
      notification: `أنت Content Writer Agent متخصص في كتابة إشعارات واضحة ومباشرة.

اكتب إشعار لفرع ${context.branchName}:

**الغرض:** ${context.purpose}
**البيانات:** ${context.data}

**المتطلبات:**
- عنوان قصير وجذاب (5-8 كلمات)
- رسالة واضحة ومباشرة (2-3 جمل)
- لغة عربية فصحى مبسطة
- تركيز على Action Items

أعطني JSON:
{
  "title": "العنوان",
  "message": "الرسالة الكاملة"
}`,
      email: `أنت Email Writer Agent متخصص في كتابة إيميلات احترافية.

اكتب إيميل لفرع ${context.branchName}:

**الغرض:** ${context.purpose}
**البيانات:** ${context.data}

**المتطلبات:**
- موضوع جذاب
- تحية مهنية
- محتوى منظم (مقدمة، جسم، خاتمة)
- لغة رسمية لكن ودودة
- دعوة لاتخاذ إجراء

أعطني JSON:
{
  "subject": "الموضوع",
  "body": "محتوى HTML"
}`,
      report: `أنت Report Writer Agent متخصص في كتابة تقارير مفصلة.

اكتب تقرير لفرع ${context.branchName}:

**الغرض:** ${context.purpose}
**البيانات:** ${context.data}

**المتطلبات:**
- ملخص تنفيذي
- تحليل مفصل
- إحصائيات ورسوم بيانية
- توصيات عملية
- خاتمة

أعطني JSON:
{
  "title": "عنوان التقرير",
  "content": "محتوى HTML كامل"
}`,
    };

    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: "أنت Content Writer Agent خبير. ردودك دائماً بصيغة JSON.",
        messages: [
          {
            role: "user",
            content: prompts[contentType] || prompts.notification,
          },
        ],
      });

      const textContent = message.content.find((block) => block.type === "text");
      const responseText = textContent?.type === "text" ? textContent.text : "{}";
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const content = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        content,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error("Content Writer Agent error:", error);
      throw new Error("فشل في توليد المحتوى");
    }
  },
});

// ============================================================================
// Agent 3: Email Agent
// ============================================================================

export const sendSmartEmail = action({
  args: {
    to: v.array(v.string()),
    branchName: v.string(),
    emailType: v.string(), // "alert", "report", "summary"
    data: v.string(), // JSON data
  },
  handler: async (ctx, { to, branchName, emailType, data }) => {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Generate email content using Content Writer Agent
    const emailContent = await ctx.runAction(internal.ai.generateSmartContent, {
      contentType: "email",
      context: {
        branchName,
        data,
        purpose: `إرسال ${emailType === "alert" ? "تنبيه" : emailType === "report" ? "تقرير" : "ملخص"}`,
      },
    });

    const resend = new Resend(resendKey);

    try {
      const result = await resend.emails.send({
        from: "نظام الإدارة المالية <onboarding@resend.dev>",
        to,
        subject: emailContent.content.subject || `تنبيه من ${branchName}`,
        html: emailContent.content.body || "<p>لا يوجد محتوى</p>",
      });

      return {
        success: true,
        emailId: result.data?.id,
        to,
      };
    } catch (error) {
      console.error("Email Agent error:", error);
      throw new Error("فشل في إرسال الإيميل");
    }
  },
});

// ============================================================================
// Agent 4: Notification Agent
// ============================================================================

export const createNotification = internalMutation({
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
    // Create notification
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

// ============================================================================
// Agent 5: Pattern Detection Agent (Autonomous Background Worker)
// ============================================================================

export const analyzeRevenuePatterns = action({
  args: {
    branchId: v.string(),
    branchName: v.string(),
  },
  handler: async (ctx, { branchId, branchName }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const anthropic = new Anthropic({ apiKey });

    // Get recent revenues (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const revenues = await ctx.runQuery(internal.ai.getRecentRevenues, {
      branchId,
      sinceDate: thirtyDaysAgo,
    });

    if (!revenues || revenues.length === 0) {
      return {
        patterns: [],
        insights: "لا توجد بيانات كافية للتحليل",
      };
    }

    // Prepare data summary
    const dataSummary = revenues.map((r: { date: number; total: number; isMatched: boolean; cash: number; network: number }) => ({
      date: new Date(r.date).toLocaleDateString("ar-EG"),
      total: r.total,
      isMatched: r.isMatched,
      dayOfWeek: new Date(r.date).toLocaleDateString("ar-EG", { weekday: "long" }),
    }));

    const prompt = `أنت Pattern Detection Agent متخصص في اكتشاف الأنماط في البيانات المالية.

قم بتحليل إيرادات فرع ${branchName} (آخر 30 يوم):

${JSON.stringify(dataSummary, null, 2)}

**المطلوب:**
1. اكتشف الأنماط الزمنية (أيام الأسبوع، الاتجاهات)
2. اكتشف الشذوذات (Anomalies)
3. تحليل عدم المطابقة
4. تنبؤات قصيرة المدى
5. توصيات للتحسين

أعطني JSON:
{
  "patterns": [
    {
      "type": "نوع النمط",
      "description": "وصف",
      "confidence": 0.XX,
      "impact": "low/medium/high"
    }
  ],
  "anomalies": ["قائمة الشذوذات"],
  "predictions": {
    "nextWeek": "تنبؤ",
    "confidence": 0.XX
  },
  "recommendations": ["توصيات"],
  "insights": "ملخص الرؤى"
}`;

    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: "أنت Pattern Detection Agent خبير. ردودك بصيغة JSON.",
        messages: [{ role: "user", content: prompt }],
      });

      const textContent = message.content.find((block) => block.type === "text");
      const responseText = textContent?.type === "text" ? textContent.text : "{}";
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      // Create notification if high-impact patterns found
      const highImpactPatterns = analysis.patterns?.filter(
        (p: { impact: string }) => p.impact === "high"
      ) || [];

      if (highImpactPatterns.length > 0) {
        await ctx.runMutation(internal.ai.createNotification, {
          branchId,
          branchName,
          type: "info",
          severity: "medium",
          title: "اكتشاف أنماط مهمة",
          message: `تم اكتشاف ${highImpactPatterns.length} نمط مهم في البيانات. ${analysis.insights}`,
          reasoning: JSON.stringify(analysis.patterns),
          aiGenerated: true,
          actionRequired: false,
          relatedEntity: {
            type: "revenue",
            id: "pattern-analysis",
          },
        });
      }

      return analysis;
    } catch (error) {
      console.error("Pattern Detection Agent error:", error);
      return {
        patterns: [],
        insights: "فشل التحليل",
      };
    }
  },
});

// ============================================================================
// Helper Queries for Agents
// ============================================================================

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
    }));
  },
});

// Export internal namespace for type safety
export { internal } from "./_generated/api";
