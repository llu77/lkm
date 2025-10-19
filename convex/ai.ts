"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Generate text using Claude
 */
export const generateText = action({
  args: { 
    prompt: v.string(),
    systemPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { prompt, systemPrompt }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured in environment variables");
    }

    const anthropic = new Anthropic({
      apiKey,
    });

    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: systemPrompt || "You are a helpful AI assistant that responds in Arabic when appropriate.",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const textContent = message.content.find((block) => block.type === "text");
      
      return {
        text: textContent?.type === "text" ? textContent.text : "",
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error("Claude API error:", error);
      throw new Error(
        error instanceof Error 
          ? `Claude API error: ${error.message}` 
          : "Failed to generate text with Claude"
      );
    }
  },
});

/**
 * Analyze revenue data using Claude
 */
export const analyzeRevenues = action({
  args: {
    revenuesData: v.array(v.object({
      date: v.number(),
      cash: v.number(),
      network: v.number(),
      budget: v.number(),
      total: v.number(),
      isMatched: v.boolean(),
    })),
    branchName: v.string(),
  },
  handler: async (ctx, { revenuesData, branchName }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const anthropic = new Anthropic({ apiKey });

    const dataText = revenuesData
      .map((r) => {
        const date = new Date(r.date).toLocaleDateString("ar-EG");
        return `- ${date}: كاش ${r.cash} ر.س، شبكة ${r.network} ر.س، موازنة ${r.budget} ر.س، المجموع ${r.total} ر.س (${r.isMatched ? "مطابق" : "غير مطابق"})`;
      })
      .join("\n");

    const prompt = `قم بتحليل بيانات إيرادات فرع ${branchName} التالية وقدم رؤى مفيدة:

${dataText}

يرجى تقديم:
1. ملخص عام للأداء
2. الأنماط والاتجاهات الملحوظة
3. التوصيات لتحسين الأداء
4. أي تحذيرات أو نقاط يجب الانتباه لها`;

    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: "أنت مستشار مالي خبير متخصص في تحليل البيانات المالية للشركات. قدم تحليلات دقيقة ومفيدة باللغة العربية.",
        messages: [{ role: "user", content: prompt }],
      });

      const textContent = message.content.find((block) => block.type === "text");
      
      return {
        analysis: textContent?.type === "text" ? textContent.text : "",
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error("Claude API error:", error);
      throw new Error(
        error instanceof Error
          ? `فشل التحليل: ${error.message}`
          : "فشل في تحليل البيانات"
      );
    }
  },
});

/**
 * Analyze expenses data using Claude
 */
export const analyzeExpenses = action({
  args: {
    expensesData: v.array(v.object({
      date: v.number(),
      title: v.string(),
      amount: v.number(),
      category: v.string(),
    })),
    branchName: v.string(),
  },
  handler: async (ctx, { expensesData, branchName }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const anthropic = new Anthropic({ apiKey });

    const dataText = expensesData
      .map((e) => {
        const date = new Date(e.date).toLocaleDateString("ar-EG");
        return `- ${date}: ${e.title} (${e.category}) - ${e.amount.toLocaleString()} ر.س`;
      })
      .join("\n");

    const totalExpenses = expensesData.reduce((sum, e) => sum + e.amount, 0);

    const prompt = `قم بتحليل بيانات مصروفات فرع ${branchName} التالية:

إجمالي المصروفات: ${totalExpenses.toLocaleString()} ر.س
عدد العمليات: ${expensesData.length}

التفاصيل:
${dataText}

يرجى تقديم:
1. تحليل توزيع المصروفات حسب الفئات
2. الأنماط الملحوظة في الإنفاق
3. مقارنة مع أفضل الممارسات
4. توصيات لتحسين إدارة المصروفات وتقليل التكاليف`;

    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: "أنت مستشار مالي متخصص في تحليل المصروفات وتحسين الكفاءة المالية. قدم تحليلات عملية باللغة العربية.",
        messages: [{ role: "user", content: prompt }],
      });

      const textContent = message.content.find((block) => block.type === "text");
      
      return {
        analysis: textContent?.type === "text" ? textContent.text : "",
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error("Claude API error:", error);
      throw new Error(
        error instanceof Error
          ? `فشل التحليل: ${error.message}`
          : "فشل في تحليل البيانات"
      );
    }
  },
});

/**
 * Chat with Claude (streaming not directly supported in Convex actions)
 */
export const chatWithClaude = action({
  args: {
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    })),
    systemPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { messages, systemPrompt }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const anthropic = new Anthropic({ apiKey });

    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: systemPrompt || "You are a helpful AI assistant for a financial management system. Respond in Arabic when appropriate.",
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const textContent = message.content.find((block) => block.type === "text");
      
      return {
        text: textContent?.type === "text" ? textContent.text : "",
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error("Claude API error:", error);
      throw new Error(
        error instanceof Error
          ? `Chat error: ${error.message}`
          : "Failed to chat with Claude"
      );
    }
  },
});
