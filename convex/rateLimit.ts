/**
 * Rate Limiting Helper for Convex
 *
 * Provides simple rate limiting to prevent abuse of email sending,
 * API mutations, and webhook triggers.
 */

import { QueryCtx, MutationCtx } from "./_generated/server";
import { ConvexError } from "convex/values";

// Rate limit storage (in-memory for Convex)
// Key: userId or identifier, Value: { count, resetAt }
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string;
}

/**
 * Check if request is within rate limit
 * @returns true if allowed, throws error if rate limited
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<boolean> {
  const now = Date.now();
  const key = config.identifier;

  // Get current rate limit data
  const existing = rateLimitStore.get(key);

  // Reset if window expired
  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return true;
  }

  // Check if limit exceeded
  if (existing.count >= config.maxRequests) {
    const resetIn = Math.ceil((existing.resetAt - now) / 1000);
    throw new ConvexError({
      message: `تم تجاوز الحد المسموح. يرجى المحاولة بعد ${resetIn} ثانية`,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: resetIn,
    });
  }

  // Increment counter
  existing.count += 1;
  rateLimitStore.set(key, existing);

  return true;
}

/**
 * Email Rate Limiter
 * Limits: 10 emails per hour per user
 */
export async function checkEmailRateLimit(
  ctx: QueryCtx | MutationCtx,
  userId: string
): Promise<void> {
  await checkRateLimit({
    identifier: `email:${userId}`,
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Mutation Rate Limiter
 * Limits: 100 mutations per minute per user
 */
export async function checkMutationRateLimit(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  mutationName: string
): Promise<void> {
  await checkRateLimit({
    identifier: `mutation:${userId}:${mutationName}`,
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  });
}

/**
 * Webhook Rate Limiter
 * Limits: 20 webhook triggers per minute
 */
export async function checkWebhookRateLimit(
  webhookId: string
): Promise<void> {
  await checkRateLimit({
    identifier: `webhook:${webhookId}`,
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  });
}

/**
 * AI Action Rate Limiter
 * Limits: 5 AI requests per minute per user
 */
export async function checkAIRateLimit(
  userId: string
): Promise<void> {
  await checkRateLimit({
    identifier: `ai:${userId}`,
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  });
}

/**
 * Cleanup expired rate limit entries
 * Should be called periodically (e.g., in a cron job)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get remaining requests for a user
 */
export function getRemainingRequests(
  identifier: string,
  maxRequests: number
): number {
  const existing = rateLimitStore.get(identifier);
  if (!existing || Date.now() > existing.resetAt) {
    return maxRequests;
  }
  return Math.max(0, maxRequests - existing.count);
}
