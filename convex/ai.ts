"use node";

import { v } from "convex/values";
import { action, internalMutation, internalAction, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

// Type definitions for better type safety
interface RevenueData {
  date: number;
  cash: number;
  network: number;
  budget: number;
  total: number;
  calculatedTotal: number;
  isMatched: boolean;
  employees?: Array<{
    name: string;
    revenue: number;
  }>;
}

interface HistoricalData {
  date: number;
  total: number;
  isMatched: boolean;
}

interface ValidationResult {
  isValid: boolean;
  reasoning: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  confidence: number;
  issues: string[];
  recommendations: string[];
  anomalyScore?: number;
  notification?: {
    shouldCreate: boolean;
    severity: string;
    title: string;
    message: string;
    actionRequired: boolean;
    priority?: string;
  };
}

interface ContentContext {
  branchName: string;
  data: string;
  purpose: string;
  metadata?: {
    priority?: string;
    audience?: string;
    deadline?: string;
  };
}

interface EmailOptions {
  priority?: string;
  template?: string;
  attachments?: string[];
}

interface PatternAnalysisOptions {
  daysBack?: number;
  sensitivity?: string;
  includePredictions?: boolean;
}

interface StatisticsResult {
  count: number;
  average: number;
  median: number;
  standardDeviation: number;
  coefficientOfVariation: number;
  min: number;
  max: number;
  outliers: number;
  trend: "up" | "down" | "stable";
  trendStrength: number;
}

interface PatternAnalysisResult {
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
    impact: "low" | "medium" | "high" | "critical";
    evidence?: string;
  }>;
  anomalies: Array<{
    date: string;
    value: number;
    expected: number;
    deviation: number;
    severity: "low" | "medium" | "high";
  }>;
  predictions?: {
    nextWeek: {
      expected: number;
      confidence: number;
      range: string;
    };
  };
  recommendations: string[];
  insights: string;
  riskAssessment: {
    overall: "low" | "medium" | "high";
    factors: string[];
  };
}

// ============================================================================
// Enhanced AI Agent System with Advanced Error Handling and Rate Limiting
// ============================================================================

/**
 * Configuration constants for AI agents
 */
const AI_CONFIG = {
  MAX_TOKENS: 4096,
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  RATE_LIMIT_PER_MINUTE: 10,
  FALLBACK_MODEL: "claude-3-5-sonnet-20241022",
  PREMIUM_MODEL: "claude-3-5-sonnet-20241022"
} as const;

/**
 * Rate limiting utility with sliding window
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(maxRequests: number = AI_CONFIG.RATE_LIMIT_PER_MINUTE, windowMinutes: number = 1) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter(time => time > windowStart);

    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getRemainingTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}

/**
 * Enhanced Anthropic client with retry logic and error handling
 */
class EnhancedAnthropicClient {
  private client: Anthropic;
  private apiKey: string;
  private rateLimiter: RateLimiter;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Anthropic({ apiKey });
    this.rateLimiter = new RateLimiter();
  }

  async createMessage(request: any, retryCount = 0): Promise<any> {
    // Check rate limit
    if (!this.rateLimiter.canMakeRequest()) {
      const waitTime = this.rateLimiter.getRemainingTime();
      throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    try {
      this.rateLimiter.recordRequest();

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), AI_CONFIG.TIMEOUT);
      });

      // Make the API call
      const response = await Promise.race([
        this.client.messages.create(request),
        timeoutPromise
      ]);

      return response;
    } catch (error: any) {
      // Check if error is retryable
      if (retryCount < AI_CONFIG.MAX_RETRIES && this.isRetryableError(error)) {
        const delay = AI_CONFIG.RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
        await this.delay(delay);
        return this.createMessage(request, retryCount + 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on rate limits, server errors, and timeouts
    return (
      error?.status === 429 || // Rate limit
      error?.status >= 500 || // Server errors
      error?.message?.includes('timeout') ||
      error?.message?.includes('network')
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Enhanced logging utility with structured logging
 */
const logger = {
  info: (message: string, data?: any, duration?: number) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      data: data || {},
      duration
    };
    console.log(JSON.stringify(logEntry));
  },
  error: (message: string, error?: any, duration?: number) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error?.message || error,
      stack: error?.stack,
      duration
    };
    console.error(JSON.stringify(logEntry));
  },
  warn: (message: string, data?: any, duration?: number) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      data: data || {},
      duration
    };
    console.warn(JSON.stringify(logEntry));
  }
};

/**
 * Input validation utilities
 */
const ValidationUtils = {
  validateRevenueData: (revenue: any): void => {
    if (!revenue || typeof revenue !== 'object') {
      throw new Error("Invalid revenue data: must be an object");
    }
    if (typeof revenue.total !== 'number' || isNaN(revenue.total)) {
      throw new Error("Invalid revenue data: total must be a valid number");
    }
    if (revenue.total < 0) {
      throw new Error("Invalid revenue data: total cannot be negative");
    }
  },

  validateBranchInfo: (branchId: string, branchName: string): void => {
    if (!branchId || typeof branchId !== 'string' || branchId.trim().length === 0) {
      throw new Error("Invalid branch ID");
    }
    if (!branchName || typeof branchName !== 'string' || branchName.trim().length === 0) {
      throw new Error("Invalid branch name");
    }
  },

  validateHistoricalData: (data: any[]): void => {
    if (!Array.isArray(data)) {
      throw new Error("Historical data must be an array");
    }
    if (data.length > 1000) {
      throw new Error("Historical data array too large (max 1000 items)");
    }
  }
};

// ============================================================================
// Agent 1: Enhanced Data Validator Agent with Advanced Analytics
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
    const startTime = Date.now();

    try {
      // Validate inputs
      ValidationUtils.validateRevenueData(revenue);
      ValidationUtils.validateBranchInfo(branchId, branchName);
      ValidationUtils.validateHistoricalData(historicalData);

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY not configured");
      }

      const anthropic = new EnhancedAnthropicClient(apiKey);

      // Enhanced statistical analysis
      const stats = calculateRevenueStatistics(revenue, historicalData);

      // Build comprehensive reasoning prompt
      const prompt = buildValidationPrompt(revenue, branchId, branchName, stats);

      const message = await anthropic.createMessage({
        model: AI_CONFIG.PREMIUM_MODEL,
        max_tokens: AI_CONFIG.MAX_TOKENS,
        system: "أنت Data Validator Agent خبير في التحقق من صحة البيانات المالية. لديك خبرة واسعة في الكشف عن الأخطاء والتلاعب في البيانات المالية. ردودك دائماً بصيغة JSON صارمة مع تحليل منطقي مفصل.",
        messages: [{ role: "user", content: prompt }],
      });

      const textContent = message.content.find((block: any) => block.type === "text");
      const responseText = textContent?.text || "{}";

      // Enhanced JSON parsing with better error handling
      const analysisResult = parseAIResponse(responseText, 'validation');

      // Create notification if needed with enhanced error handling
      if (analysisResult.notification?.shouldCreate) {
        try {
          await ctx.runMutation(internal.notifications.createAINotification, {
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
            }
          });
        } catch (notificationError) {
          logger.error('Failed to create notification', notificationError);
          // Don't fail the whole operation if notification creation fails
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`Data validation completed successfully`, {
        branchId,
        isValid: analysisResult.isValid,
        riskLevel: analysisResult.riskLevel,
        confidence: analysisResult.confidence
      }, duration);

      return {
        ...analysisResult,
        usage: {
          inputTokens: message.usage?.input_tokens || 0,
          outputTokens: message.usage?.output_tokens || 0,
        },
        processingTime: duration,
        statistics: stats
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Data validation failed', error, duration);

      // Return safe fallback response
      return {
        isValid: true,
        reasoning: "فشل التحليل الآلي - يرجى المراجعة اليدوية",
        riskLevel: "low",
        confidence: 0,
        issues: ["فشل في تشغيل AI Agent", error.message],
        recommendations: ["يرجى المراجعة اليدوية للبيانات"],
        notification: { shouldCreate: false },
        error: error.message,
        processingTime: duration,
      };
    }
  },
});

/**
 * Calculate comprehensive revenue statistics
 */
function calculateRevenueStatistics(revenue: any, historicalData: any[]) {
  const validHistoricalData = historicalData.filter(r => typeof r.total === 'number' && !isNaN(r.total));

  const avgRevenue = validHistoricalData.length > 0
    ? validHistoricalData.reduce((sum, r) => sum + r.total, 0) / validHistoricalData.length
    : 0;

  const deviationPercent = avgRevenue > 0
    ? ((revenue.total - avgRevenue) / avgRevenue) * 100
    : 0;

  const recentMismatches = validHistoricalData
    .slice(-7)
    .filter(r => !r.isMatched).length;

  // Calculate standard deviation
  const variance = validHistoricalData.length > 0
    ? validHistoricalData.reduce((sum, r) => sum + Math.pow(r.total - avgRevenue, 2), 0) / validHistoricalData.length
    : 0;
  const standardDeviation = Math.sqrt(variance);

  // Calculate z-score
  const zScore = standardDeviation > 0
    ? (revenue.total - avgRevenue) / standardDeviation
    : 0;

  // Detect anomalies (z-score > 2 or < -2)
  const isAnomalous = Math.abs(zScore) > 2;

  // Calculate trend
  const recentTrend = calculateTrend(validHistoricalData.slice(-14)); // Last 2 weeks

  return {
    avgRevenue,
    deviationPercent,
    recentMismatches,
    standardDeviation,
    zScore,
    isAnomalous,
    trend: recentTrend,
    dataPoints: validHistoricalData.length
  };
}

/**
 * Calculate trend direction and strength
 */
function calculateTrend(data: any[]): { direction: 'up' | 'down' | 'stable'; strength: number } {
  if (data.length < 2) return { direction: 'stable', strength: 0 };

  let totalChange = 0;
  for (let i = 1; i < data.length; i++) {
    totalChange += data[i].total - data[i-1].total;
  }

  const avgChange = totalChange / (data.length - 1);
  const strength = Math.abs(avgChange);

  if (avgChange > strength * 0.1) return { direction: 'up', strength };
  if (avgChange < -strength * 0.1) return { direction: 'down', strength };
  return { direction: 'stable', strength: 0 };
}

/**
 * Build comprehensive validation prompt
 */
function buildValidationPrompt(revenue: any, branchId: string, branchName: string, stats: any): string {
  return `أنت Data Validator Agent متخصص في التحقق من صحة البيانات المالية ولديك خبرة متقدمة في الكشف عن الأخطاء والتلاعب.

قم بتحليل إيراد ${branchName} التالي وكتابة reasoning chain منطقي ومفصل:

📊 **البيانات الجديدة:**
- التاريخ: ${new Date(revenue.date).toLocaleDateString("ar-EG")}
- الكاش: ${revenue.cash.toLocaleString()} ر.س
- الشبكة: ${revenue.network.toLocaleString()} ر.س
- الموازنة: ${revenue.budget.toLocaleString()} ر.س
- المجموع المسجل: ${revenue.total.toLocaleString()} ر.س
- المجموع المحسوب: ${revenue.calculatedTotal.toLocaleString()} ر.س
- الفرق: ${(revenue.total - revenue.calculatedTotal).toLocaleString()} ر.س
- الحالة: ${revenue.isMatched ? "✅ مطابق" : "❌ غير مطابق"}
${revenue.employees && revenue.employees.length > 0 ? `- الموظفون: ${revenue.employees.map((e: any) => `${e.name} (${e.revenue.toLocaleString()} ر.س)`).join(", ")}` : ""}

📈 **التحليل الإحصائي:**
- متوسط الإيرادات (آخر ${stats.dataPoints} يوم): ${stats.avgRevenue.toLocaleString()} ر.س
- الانحراف: ${stats.deviationPercent.toFixed(1)}%
- الانحراف المعياري: ${stats.standardDeviation.toFixed(2)} ر.س
- Z-Score: ${stats.zScore.toFixed(2)}
- الحالة الشاذة: ${stats.isAnomalous ? "✅ نعم" : "❌ لا"}
- اتجاه الأداء: ${stats.trend.direction === 'up' ? '📈 صاعد' : stats.trend.direction === 'down' ? '📉 هابط' : '➡️ مستقر'} (${stats.trend.strength.toFixed(2)})
- عدم المطابقة الأخير (آخر 7 أيام): ${stats.recentMismatches} مرة

---

**المطلوب منك:**

1. **تحليل منطقي شامل (Reasoning Chain):**
   - هل البيانات منطقية رياضياً؟
   - هل هناك أخطاء حسابية واضحة؟
   - هل الفرق بين المجموع المسجل والمحسوب مقبول؟
   - هل هناك أنماط غريبة في بيانات الموظفين؟
   - هل الانحراف عن المتوسط طبيعي أم مشبوه؟
   - هل هناك تلاعب محتمل في الأرقام؟

2. **تحليل الشذوذ (Anomaly Detection):**
   - هل البيانات تندرج تحت الشذوذ الإحصائي؟
   - هل هناك تغيرات مفاجئة غير مبررة؟
   - هل الأرقام تتوافق مع الاتجاهات التاريخية؟

3. **تقييم المخاطر المتقدم:**
   - المستوى: منخفض / متوسط / عالي / حرج
   - احتمالية الخطأ: نسبة مئوية
   - تأثير محتمل على القرارات المالية
   - الحاجة لتدقيق إضافي

4. **التوصيات الذكية:**
   - هل يجب إرسال تنبيه فوري؟
   - هل يجب طلب تحقق إضافي من الفرع؟
   - هل يجب إشعار المدير أو الإدارة العليا؟
   - هل يجب مراجعة الإجراءات المحاسبية؟

5. **إشعار مقترح:**
   - عنوان واضح ومباشر
   - رسالة تفصيلية باللغة العربية
   - مستوى الأهمية والإلحاح
   - الإجراءات المطلوبة

أعطني ردك بتنسيق JSON صارم:
{
  "isValid": true/false,
  "reasoning": "سلسلة التفكير المنطقي المفصلة مع التحليل الإحصائي...",
  "riskLevel": "low/medium/high/critical",
  "confidence": 0.XX,
  "issues": ["قائمة المشاكل المحددة"],
  "recommendations": ["قائمة التوصيات المحددة"],
  "anomalyScore": 0.XX,
  "notification": {
    "shouldCreate": true/false,
    "severity": "low/medium/high/critical",
    "title": "عنوان واضح ومباشر",
    "message": "رسالة تفصيلية تشرح المشكلة والإجراءات المطلوبة",
    "actionRequired": true/false,
    "priority": "low/medium/high/urgent"
  }
}`;
}

// ============================================================================
// Agent 2: Enhanced Content Writer Agent
// ============================================================================

export const generateSmartContent = action({
  args: {
    contentType: v.string(), // "notification", "email", "report", "summary"
    context: v.object({
      branchName: v.string(),
      data: v.string(), // JSON string of relevant data
      purpose: v.string(),
      metadata: v.optional(v.object({
        priority: v.optional(v.string()),
        audience: v.optional(v.string()),
        deadline: v.optional(v.string())
      }))
    }),
  },
  handler: async (ctx, { contentType, context }) => {
    const startTime = Date.now();

    try {
      // Validate inputs
      if (!context.branchName || !context.data || !context.purpose) {
        throw new Error("Missing required context fields");
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY not configured");
      }

      const anthropic = new EnhancedAnthropicClient(apiKey);

      // Build context-aware prompt
      const prompt = buildContentPrompt(contentType, context);

      const message = await anthropic.createMessage({
        model: AI_CONFIG.PREMIUM_MODEL,
        max_tokens: AI_CONFIG.MAX_TOKENS,
        system: "أنت Content Writer Agent خبير في كتابة المحتوى الاحترافي. لديك خبرة في الكتابة الاقتصادية والفعالة مع الحفاظ على الوضوح والاحترافية.",
        messages: [{ role: "user", content: prompt }],
      });

      const textContent = message.content.find((block: any) => block.type === "text");
      const responseText = textContent?.text || "{}";

      const content = parseAIResponse(responseText, 'content');

      const duration = Date.now() - startTime;
      logger.info(`Content generation completed`, {
        contentType,
        branchName: context.branchName,
        duration
      });

      return {
        content,
        usage: {
          inputTokens: message.usage?.input_tokens || 0,
          outputTokens: message.usage?.output_tokens || 0,
        },
        processingTime: duration,
        metadata: {
          model: AI_CONFIG.PREMIUM_MODEL,
          contentType,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Content generation failed', error, duration);

      // Return fallback content based on type
      const fallbackContent = getFallbackContent(contentType, context);

      return {
        content: fallbackContent,
        usage: { inputTokens: 0, outputTokens: 0 },
        processingTime: duration,
        error: error.message,
        fallback: true
      };
    }
  },
});

/**
 * Build context-aware content prompt
 */
function buildContentPrompt(contentType: string, context: any): string {
  const basePrompts: Record<string, string> = {
    notification: `أنت Content Writer Agent متخصص في كتابة إشعارات واضحة ومباشرة.

اكتب إشعار لفرع ${context.branchName}:

**الغرض:** ${context.purpose}
**البيانات:** ${context.data}
${context.metadata ? `**الأولوية:** ${context.metadata.priority || 'عادية'}` : ''}

**المتطلبات:**
- عنوان قصير وجذاب (5-8 كلمات)
- رسالة واضحة ومباشرة (2-3 جمل)
- لغة عربية فصحى مبسطة
- تركيز على Action Items والإجراءات المطلوبة
- تناسب مع المستوى المطلوب من الإلحاح

أعطني JSON:
{
  "title": "العنوان الجذاب",
  "message": "الرسالة الواضحة والمباشرة",
  "actionRequired": true/false,
  "priority": "low/medium/high/urgent"
}`,

    email: `أنت Email Writer Agent متخصص في كتابة إيميلات احترافية وفعالة.

اكتب إيميل لفرع ${context.branchName}:

**الغرض:** ${context.purpose}
**البيانات:** ${context.data}
${context.metadata ? `**الأولوية:** ${context.metadata.priority || 'عادية'}` : ''}

**المتطلبات:**
- موضوع جذاب وواضح
- تحية مهنية مناسبة
- محتوى منظم (مقدمة، جسم، خاتمة)
- لغة رسمية لكن ودودة
- دعوة واضحة لاتخاذ إجراء
- طول مناسب (لا يتجاوز 300 كلمة)

أعطني JSON:
{
  "subject": "الموضوع الجذاب",
  "greeting": "التحية المناسبة",
  "body": "محتوى HTML منظم وواضح",
  "callToAction": "الإجراء المطلوب",
  "closing": "الختام المهني"
}`,

    report: `أنت Report Writer Agent متخصص في كتابة تقارير مفصلة ومنظمة.

اكتب تقرير لفرع ${context.branchName}:

**الغرض:** ${context.purpose}
**البيانات:** ${context.data}
${context.metadata ? `**الأولوية:** ${context.metadata.priority || 'عادية'}` : ''}

**المتطلبات:**
- ملخص تنفيذي موجز
- تحليل مفصل للبيانات
- إحصائيات واضحة
- توصيات عملية قابلة للتنفيذ
- خاتمة تلخص النتائج
- طول مناسب (800-1500 كلمة)

أعطني JSON:
{
  "title": "عنوان التقرير الواضح",
  "executiveSummary": "ملخص تنفيذي موجز",
  "content": "محتوى HTML كامل ومنظم",
  "findings": ["النتائج الرئيسية"],
  "recommendations": ["التوصيات العملية"],
  "conclusion": "الخاتمة"
}`
  };

  return basePrompts[contentType] || basePrompts.notification;
}

/**
 * Get fallback content when AI generation fails
 */
function getFallbackContent(contentType: string, context: any): any {
  const timestamp = new Date().toLocaleDateString('ar-EG');

  switch (contentType) {
    case 'notification':
      return {
        title: "تنبيه من النظام",
        message: "يرجى مراجعة البيانات المالية للفترة المحددة",
        actionRequired: true,
        priority: "medium"
      };
    case 'email':
      return {
        subject: `تنبيه من ${context.branchName}`,
        greeting: "عزيزي الفريق،",
        body: "<p>نأمل أن يجدكم هذا الإيميل بخير.</p><p>يرجى مراجعة المعلومات المرفقة والتواصل معنا عند الحاجة.</p>",
        callToAction: "يرجى مراجعة البيانات والرد علينا",
        closing: "مع خالص التحية،"
      };
    case 'report':
      return {
        title: `تقرير ${context.branchName} - ${timestamp}`,
        executiveSummary: "ملخص التقرير المؤقت",
        content: "<p>هذا تقرير مؤقت تم إنشاؤه تلقائياً.</p>",
        findings: ["البيانات قيد المراجعة"],
        recommendations: ["يرجى مراجعة البيانات يدوياً"],
        conclusion: "شكراً لتعاونكم"
      };
    default:
      return { message: "محتوى مؤقت" };
  }
}

// ============================================================================
// Agent 3: Enhanced Email Agent with Advanced Features
// ============================================================================

export const sendSmartEmail = action({
  args: {
    to: v.array(v.string()),
    branchName: v.string(),
    emailType: v.string(), // "alert", "report", "summary"
    data: v.string(), // JSON data
    options: v.optional(v.object({
      priority: v.optional(v.string()),
      template: v.optional(v.string()),
      attachments: v.optional(v.array(v.string()))
    }))
  },
  handler: async (ctx, { to, branchName, emailType, data, options }) => {
    const startTime = Date.now();

    try {
      // Validate inputs
      if (!to || to.length === 0) {
        throw new Error("Email recipients list cannot be empty");
      }

      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) {
        throw new Error("RESEND_API_KEY not configured");
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY not configured");
      }

      const anthropic = new EnhancedAnthropicClient(apiKey);

      // Generate email content with context
      const emailPrompt = `أنت Email Writer Agent متخصص في كتابة إيميلات احترافية وفعالة.

اكتب إيميل لفرع ${branchName}:

**النوع:** ${emailType === "alert" ? "تنبيه" : emailType === "report" ? "تقرير" : "ملخص"}
**البيانات:** ${data}
**الأولوية:** ${options?.priority || 'عادية'}

**المتطلبات:**
- موضوع جذاب وواضح يعكس المحتوى
- تحية مهنية مناسبة للفرع
- محتوى منظم ومفيد
- لغة رسمية لكن ودودة
- دعوة واضحة لاتخاذ إجراء
- تناسب مع مستوى الأولوية

أعطني JSON:
{
  "subject": "الموضوع الجذاب والواضح",
  "greeting": "التحية المناسبة",
  "body": "محتوى HTML احترافي ومنظم",
  "callToAction": "الإجراء المطلوب بوضوح",
  "closing": "الختام المهني"
}`;

      const message = await anthropic.createMessage({
        model: AI_CONFIG.PREMIUM_MODEL,
        max_tokens: 2048,
        messages: [{ role: "user", content: emailPrompt }],
      });

      const textContent = message.content.find((b: any) => b.type === "text");
      const responseText = textContent?.text || "{}";
      const emailContent = parseAIResponse(responseText, 'email');

      const resend = new Resend(resendKey);

      // Prepare email data
      const emailData: any = {
        from: "نظام الإدارة المالية <onboarding@resend.dev>",
        to,
        subject: emailContent.subject || `تنبيه من ${branchName}`,
        html: emailContent.body || "<p>لا يوجد محتوى</p>",
      };

      // Add priority headers if specified
      if (options?.priority === 'high') {
        emailData.headers = {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High'
        };
      }

      const result = await resend.emails.send(emailData);

      const duration = Date.now() - startTime;
      logger.info(`Email sent successfully`, {
        to: to.length,
        branchName,
        emailType,
        emailId: result.data?.id,
        duration
      });

      return {
        success: true,
        emailId: result.data?.id,
        to,
        subject: emailContent.subject,
        processingTime: duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Email sending failed', error, duration);
      throw new Error(`فشل في إرسال الإيميل: ${error.message}`);
    }
  },
});

// ============================================================================
// Agent 4: Enhanced Notification Agent
// ============================================================================

// Note: Notification creation moved to notifications.ts
// Use ctx.runMutation(internal.notifications.createAINotification, ...)

// ============================================================================
// Agent 5: Advanced Pattern Detection Agent with Machine Learning
// ============================================================================

export const analyzeRevenuePatterns = action({
  args: {
    branchId: v.string(),
    branchName: v.string(),
    options: v.optional(v.object({
      daysBack: v.optional(v.number()),
      sensitivity: v.optional(v.string()),
      includePredictions: v.optional(v.boolean())
    }))
  },
  handler: async (ctx, { branchId, branchName, options }) => {
    const startTime = Date.now();

    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY not configured");
      }

      const anthropic = new EnhancedAnthropicClient(apiKey);

      // Get recent revenues with enhanced filtering
      const daysBack = options?.daysBack || 30;
      const sinceDate = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

      const revenues: Array<{
        date: number;
        total: number;
        isMatched: boolean;
        cash: number;
        network: number;
        budget: number;
      }> = await ctx.runMutation(internal.notifications.getRecentRevenues, {
        branchId,
        sinceDate,
      });

      if (!revenues || revenues.length === 0) {
        return {
          patterns: [],
          insights: "لا توجد بيانات كافية للتحليل",
          dataPoints: 0,
          analysisDate: new Date().toISOString()
        };
      }

      // Enhanced data analysis
      const analysis = performAdvancedAnalysis(revenues, options);

      // Build comprehensive analysis prompt
      const prompt = buildPatternAnalysisPrompt(branchName, analysis, options);

      const message = await anthropic.createMessage({
        model: AI_CONFIG.PREMIUM_MODEL,
        max_tokens: AI_CONFIG.MAX_TOKENS,
        system: "أنت Pattern Detection Agent متخصص في اكتشاف الأنماط والشذوذات في البيانات المالية. لديك خبرة متقدمة في التحليل الإحصائي والتنبؤ.",
        messages: [{ role: "user", content: prompt }],
      });

      const textContent = message.content.find((block: any) => block.type === "text");
      const responseText = textContent?.text || "{}";

      const aiAnalysis = parseAIResponse(responseText, 'pattern_analysis');

      // Create notification if high-impact patterns found
      const highImpactPatterns = aiAnalysis.patterns?.filter(
        (p: any) => p.impact === "high" || p.impact === "critical"
      ) || [];

      if (highImpactPatterns.length > 0) {
        try {
          await ctx.runMutation(internal.notifications.createAINotification, {
            branchId,
            branchName,
            type: "info",
            severity: "medium",
            title: "اكتشاف أنماط مهمة في البيانات",
            message: `تم اكتشاف ${highImpactPatterns.length} نمط مهم في بيانات الإيرادات. ${aiAnalysis.insights}`,
            reasoning: JSON.stringify({
              patterns: highImpactPatterns,
              statistics: analysis.statistics
            }),
            aiGenerated: true,
            actionRequired: false,
            relatedEntity: {
              type: "revenue",
              id: "pattern-analysis",
            }
          });
        } catch (notificationError) {
          logger.error('Failed to create pattern notification', notificationError);
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`Pattern analysis completed`, {
        branchId,
        dataPoints: revenues.length,
        patternsFound: aiAnalysis.patterns?.length || 0,
        duration
      });

      return {
        ...aiAnalysis,
        statistics: analysis.statistics,
        dataPoints: revenues.length,
        analysisPeriod: daysBack,
        processingTime: duration,
        analysisDate: new Date().toISOString()
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Pattern analysis failed', error, duration);

      return {
        patterns: [],
        insights: "فشل التحليل - يرجى مراجعة البيانات يدوياً",
        statistics: {},
        dataPoints: 0,
        error: error.message,
        processingTime: duration,
        analysisDate: new Date().toISOString()
      };
    }
  },
});

/**
 * Perform advanced statistical analysis on revenue data
 */
function performAdvancedAnalysis(revenues: any[], options: any) {
  const validRevenues = revenues.filter(r =>
    typeof r.total === 'number' &&
    !isNaN(r.total) &&
    r.total >= 0
  );

  if (validRevenues.length === 0) {
    return { statistics: {}, patterns: [] };
  }

  // Basic statistics
  const totals = validRevenues.map(r => r.total);
  const avgRevenue = totals.reduce((sum, val) => sum + val, 0) / totals.length;

  // Calculate standard deviation
  const variance = totals.reduce((sum, val) => sum + Math.pow(val - avgRevenue, 2), 0) / totals.length;
  const standardDeviation = Math.sqrt(variance);

  // Calculate coefficient of variation
  const coefficientOfVariation = avgRevenue > 0 ? (standardDeviation / avgRevenue) * 100 : 0;

  // Detect outliers using IQR method
  const sortedTotals = [...totals].sort((a, b) => a - b);
  const q1Index = Math.floor(sortedTotals.length * 0.25);
  const q3Index = Math.floor(sortedTotals.length * 0.75);
  const q1 = sortedTotals[q1Index];
  const q3 = sortedTotals[q3Index];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = validRevenues.filter(r => r.total < lowerBound || r.total > upperBound);

  // Calculate daily averages
  const dailyAverages = calculateDailyAverages(validRevenues);

  // Calculate weekly patterns
  const weeklyPatterns = calculateWeeklyPatterns(validRevenues);

  // Calculate trend
  const trend = calculateTrend(validRevenues);

  return {
    statistics: {
      count: validRevenues.length,
      average: avgRevenue,
      median: sortedTotals[Math.floor(sortedTotals.length / 2)],
      standardDeviation,
      coefficientOfVariation,
      min: Math.min(...totals),
      max: Math.max(...totals),
      outliers: outliers.length,
      trend: trend.direction,
      trendStrength: trend.strength
    },
    patterns: {
      daily: dailyAverages,
      weekly: weeklyPatterns,
      outliers: outliers.map(o => ({ date: o.date, total: o.total, deviation: (o.total - avgRevenue) / avgRevenue }))
    }
  };
}

/**
 * Calculate daily averages and patterns
 */
function calculateDailyAverages(revenues: any[]) {
  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dailyTotals: { [key: number]: number[] } = {};

  revenues.forEach(revenue => {
    const dayOfWeek = new Date(revenue.date).getDay();
    if (!dailyTotals[dayOfWeek]) {
      dailyTotals[dayOfWeek] = [];
    }
    dailyTotals[dayOfWeek].push(revenue.total);
  });

  return Object.entries(dailyTotals).map(([day, totals]) => ({
    day: dayNames[parseInt(day)],
    average: totals.reduce((sum, val) => sum + val, 0) / totals.length,
    count: totals.length,
    min: Math.min(...totals),
    max: Math.max(...totals)
  }));
}

/**
 * Calculate weekly patterns
 */
function calculateWeeklyPatterns(revenues: any[]) {
  const weeklyTotals: { [key: string]: number[] } = {};

  revenues.forEach(revenue => {
    const weekStart = getWeekStart(revenue.date);
    if (!weeklyTotals[weekStart]) {
      weeklyTotals[weekStart] = [];
    }
    weeklyTotals[weekStart].push(revenue.total);
  });

  return Object.entries(weeklyTotals).map(([week, totals]) => ({
    week: new Date(parseInt(week)).toLocaleDateString('ar-EG'),
    average: totals.reduce((sum, val) => sum + val, 0) / totals.length,
    total: totals.reduce((sum, val) => sum + val, 0),
    count: totals.length
  })).sort((a, b) => new Date(b.week).getTime() - new Date(a.week).getTime());
}

/**
 * Get week start timestamp
 */
function getWeekStart(timestamp: number): string {
  const date = new Date(timestamp);
  const dayOfWeek = date.getDay();
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek.getTime().toString();
}

/**
 * Build comprehensive pattern analysis prompt
 */
function buildPatternAnalysisPrompt(branchName: string, analysis: any, options: any): string {
  return `أنت Pattern Detection Agent متخصص في اكتشاف الأنماط والشذوذات في البيانات المالية.

قم بتحليل إيرادات فرع ${branchName} بعناية فائقة:

**الإحصائيات العامة:**
- عدد نقاط البيانات: ${analysis.statistics.count}
- المتوسط: ${analysis.statistics.average.toFixed(2)} ر.س
- الانحراف المعياري: ${analysis.statistics.standardDeviation.toFixed(2)} ر.س
- معامل الاختلاف: ${analysis.statistics.coefficientOfVariation.toFixed(2)}%
- الاتجاه: ${analysis.statistics.trend === 'up' ? 'صاعد' : analysis.statistics.trend === 'down' ? 'هابط' : 'مستقر'}
- عدد الشذوذات: ${analysis.statistics.outliers}

**الأنماط اليومية:**
${JSON.stringify(analysis.patterns.daily, null, 2)}

**الأنماط الأسبوعية:**
${JSON.stringify(analysis.patterns.weekly, null, 2)}

**القيم الشاذة:**
${JSON.stringify(analysis.patterns.outliers, null, 2)}

**المطلوب:**

1. **تحليل الأنماط الزمنية:**
   - أيام الأسبوع الأكثر/الأقل ربحية
   - الاتجاهات الأسبوعية
   - التغيرات الموسمية

2. **كشف الشذوذات:**
   - القيم الشاذة إحصائياً
   - التغيرات المفاجئة غير المبررة
   - الأخطاء المحتملة في التسجيل

3. **تحليل عدم المطابقة:**
   - معدل عدم المطابقة
   - الأسباب المحتملة
   - التوصيات للتحسين

4. **التنبؤات:**
   - توقعات الأسبوع القادم
   - مستويات الثقة
   - عوامل الخطر

5. **التوصيات:**
   - الإجراءات المطلوبة
   - التحسينات المقترحة
   - نقاط المراقبة

أعطني JSON:
{
  "patterns": [
    {
      "type": "نوع النمط",
      "description": "وصف مفصل",
      "confidence": 0.XX,
      "impact": "low/medium/high/critical",
      "evidence": "الأدلة الإحصائية"
    }
  ],
  "anomalies": [
    {
      "date": "التاريخ",
      "value": "القيمة",
      "expected": "القيمة المتوقعة",
      "deviation": "الانحراف",
      "severity": "low/medium/high"
    }
  ],
  "predictions": {
    "nextWeek": {
      "expected": "القيمة المتوقعة",
      "confidence": 0.XX,
      "range": "النطاق المتوقع"
    }
  },
  "recommendations": [
    "توصية محددة وقابلة للتنفيذ"
  ],
  "insights": "ملخص شامل للرؤى المكتشفة",
  "riskAssessment": {
    "overall": "low/medium/high",
    "factors": ["عامل 1", "عامل 2"]
  }
}`;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse AI response with enhanced error handling
 */
function parseAIResponse(responseText: string, type: string): any {
  try {
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate response structure based on type
    return validateResponseStructure(parsed, type);
  } catch (error) {
    logger.warn(`Failed to parse ${type} response`, { error: error instanceof Error ? error.message : String(error) });

    // Return appropriate fallback
    return getFallbackResponse(type);
  }
}

/**
 * Validate response structure
 */
function validateResponseStructure(parsed: any, type: string): any {
  // Basic validation - ensure required fields exist
  const requiredFields = {
    validation: ['isValid', 'reasoning', 'riskLevel'],
    content: ['title', 'message'],
    email: ['subject', 'body'],
    pattern_analysis: ['patterns', 'insights']
  };

  const fields = requiredFields[type as keyof typeof requiredFields];
  if (!fields) return parsed;

  const missing = fields.filter(field => !(field in parsed));
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  return parsed;
}

/**
 * Get fallback response for failed parsing
 */
function getFallbackResponse(type: string): any {
  const baseResponse = {
    reasoning: "فشل في تحليل رد الذكاء الاصطناعي",
    confidence: 0.3
  };

  switch (type) {
    case 'validation':
      return {
        isValid: true,
        riskLevel: "low",
        issues: ["خطأ في تحليل الرد"],
        recommendations: ["يرجى المراجعة اليدوية"],
        notification: { shouldCreate: false },
        ...baseResponse
      };
    case 'content':
      return {
        title: "محتوى مؤقت",
        message: "فشل في توليد المحتوى الآلي"
      };
    case 'email':
      return {
        subject: "رسالة من النظام",
        body: "<p>فشل في توليد المحتوى الآلي</p>",
        greeting: "عزيزي الفريق،",
        callToAction: "يرجى التواصل معنا"
      };
    case 'pattern_analysis':
      return {
        patterns: [],
        insights: "فشل في تحليل الأنماط",
        recommendations: ["يرجى مراجعة البيانات يدوياً"]
      };
    default:
      return baseResponse;
  }
}

// ============================================================================
// Helper Functions for Agent Integration
// ============================================================================

// Note: getRecentRevenues moved to notifications.ts
// Use ctx.runMutation(internal.notifications.getRecentRevenues, ...)
