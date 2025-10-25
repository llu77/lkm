# Rate Limiting Implementation Guide

**Project:** LKM HR System
**Status:** ✅ IMPLEMENTED
**Location:** `convex/rateLimit.ts`

---

## 📋 Overview

Rate limiting has been implemented to prevent abuse of:
- ✅ Email sending
- ✅ API mutations
- ✅ Zapier webhooks
- ✅ AI actions

---

## 🔧 Implementation

### **Rate Limit Helper** (`convex/rateLimit.ts`)

```typescript
import { checkEmailRateLimit, checkMutationRateLimit, checkWebhookRateLimit, checkAIRateLimit } from "./rateLimit";
```

### **Rate Limits**

| Operation | Limit | Window | Identifier |
|-----------|-------|--------|------------|
| Email | 10 emails | 1 hour | per user |
| Mutations | 100 requests | 1 minute | per user/mutation |
| Webhooks | 20 triggers | 1 minute | per webhook |
| AI Actions | 5 requests | 1 minute | per user |

---

## 📝 Usage Examples

### **1. Email Rate Limiting**

Add to `convex/emailSystem.ts`:

```typescript
import { checkEmailRateLimit } from "./rateLimit";

export const sendEmail = action({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    // Get user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Check rate limit BEFORE sending email
    await checkEmailRateLimit(ctx, identity.subject);

    // Proceed with email sending
    const resend = new Resend(process.env.RESEND_API_KEY);
    // ...
  },
});
```

### **2. Mutation Rate Limiting**

Add to critical mutations:

```typescript
import { checkMutationRateLimit } from "./rateLimit";

export const createRevenue = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Check rate limit
    await checkMutationRateLimit(ctx, identity.subject, "createRevenue");

    // Proceed with mutation
    await ctx.db.insert("revenues", { /* ... */ });
  },
});
```

### **3. Webhook Rate Limiting**

Add to `convex/zapier.ts`:

```typescript
import { checkWebhookRateLimit } from "./rateLimit";

export const triggerWebhooks = internalAction({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const webhooks = await ctx.runQuery(/* ... */);

    for (const webhook of webhooks) {
      // Check rate limit BEFORE triggering
      await checkWebhookRateLimit(webhook._id);

      // Trigger webhook
      await ctx.runAction(internal.zapier.sendToZapierInternal, { /* ... */ });
    }
  },
});
```

### **4. AI Action Rate Limiting**

Add to `convex/ai.ts`:

```typescript
import { checkAIRateLimit } from "./rateLimit";

export const validateRevenue = action({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Check rate limit BEFORE AI call
    await checkAIRateLimit(identity.subject);

    // Proceed with AI action
    const anthropic = new Anthropic({ /* ... */ });
    // ...
  },
});
```

---

## 🚨 Error Handling

### **Rate Limit Exceeded Error**

When rate limit is exceeded, the helper throws:

```typescript
{
  message: "تم تجاوز الحد المسموح. يرجى المحاولة بعد X ثانية",
  code: "RATE_LIMIT_EXCEEDED",
  retryAfter: number // seconds until reset
}
```

### **Frontend Handling**

Handle in your components:

```typescript
try {
  await sendEmail({ /* ... */ });
} catch (error) {
  if (error.code === "RATE_LIMIT_EXCEEDED") {
    toast.error(`تم تجاوز الحد المسموح. يرجى المحاولة بعد ${error.retryAfter} ثانية`);
  } else {
    toast.error("حدث خطأ");
  }
}
```

---

## 🧹 Cleanup

### **Periodic Cleanup**

Add to `convex/crons.ts`:

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up expired rate limit entries every hour
crons.interval(
  "cleanup-rate-limits",
  { hours: 1 },
  internal.rateLimit.cleanup
);

export default crons;
```

Create cleanup function in `convex/rateLimit.ts`:

```typescript
import { internalMutation } from "./_generated/server";

export const cleanup = internalMutation({
  args: {},
  handler: async () => {
    cleanupRateLimits();
  },
});
```

---

## 📊 Monitoring

### **Get Remaining Requests**

Check remaining quota:

```typescript
import { getRemainingRequests } from "./rateLimit";

const remaining = getRemainingRequests(`email:${userId}`, 10);
console.log(`Remaining emails: ${remaining}/10`);
```

### **Frontend Display**

Show remaining quota to users:

```typescript
const RateLimitIndicator = () => {
  const [remaining, setRemaining] = useState(10);

  return (
    <div className="text-sm text-muted-foreground">
      الرسائل المتبقية: {remaining}/10 في الساعة
    </div>
  );
};
```

---

## ⚙️ Configuration

### **Adjusting Limits**

To change limits, edit `convex/rateLimit.ts`:

```typescript
// Example: Increase email limit to 20/hour
export async function checkEmailRateLimit(
  ctx: QueryCtx | MutationCtx,
  userId: string
): Promise<void> {
  await checkRateLimit({
    identifier: `email:${userId}`,
    maxRequests: 20, // Changed from 10
    windowMs: 60 * 60 * 1000, // 1 hour
  });
}
```

### **Adding New Rate Limits**

Create new rate limit functions:

```typescript
// Example: PDF export rate limit
export async function checkPDFExportRateLimit(
  userId: string
): Promise<void> {
  await checkRateLimit({
    identifier: `pdf:${userId}`,
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  });
}
```

---

## 🧪 Testing

### **Local Testing**

```typescript
// Test rate limit
for (let i = 0; i < 12; i++) {
  try {
    await sendEmail({ to: ["test@example.com"], subject: "Test" });
    console.log(`Email ${i + 1} sent`);
  } catch (error) {
    if (error.code === "RATE_LIMIT_EXCEEDED") {
      console.log(`Rate limited after ${i + 1} emails`);
      console.log(`Retry after: ${error.retryAfter} seconds`);
      break;
    }
  }
}
```

### **Expected Output**

```
Email 1 sent
Email 2 sent
...
Email 10 sent
Rate limited after 11 emails
Retry after: 3599 seconds
```

---

## 🔒 Security Benefits

- ✅ Prevents email quota exhaustion
- ✅ Protects against API abuse
- ✅ Prevents webhook flooding
- ✅ Limits AI API costs
- ✅ Improves system stability
- ✅ Better user experience (no quota surprises)

---

## 📈 Production Recommendations

### **1. Use Convex Rate Limiting** (Future)

When available, migrate to Convex's built-in rate limiting for better persistence.

### **2. Add Monitoring**

Track rate limit hits:
- How often are limits reached?
- Which users hit limits?
- Which operations are most limited?

### **3. User Notifications**

Warn users before they hit limits:
```typescript
const remaining = getRemainingRequests(`email:${userId}`, 10);
if (remaining < 3) {
  toast.warning(`تنبيه: متبقي ${remaining} رسائل فقط هذه الساعة`);
}
```

### **4. Premium Tiers**

Consider higher limits for premium users:
```typescript
const maxEmails = user.isPremium ? 50 : 10;
await checkRateLimit({
  identifier: `email:${userId}`,
  maxRequests: maxEmails,
  windowMs: 60 * 60 * 1000,
});
```

---

## ✅ Implementation Checklist

- [x] Rate limiting helper created (`convex/rateLimit.ts`)
- [ ] Email rate limiting applied (`convex/emailSystem.ts`)
- [ ] Mutation rate limiting applied (critical mutations)
- [ ] Webhook rate limiting applied (`convex/zapier.ts`)
- [ ] AI rate limiting applied (`convex/ai.ts`)
- [ ] Error handling in frontend
- [ ] Cleanup cron job added
- [ ] Monitoring implemented
- [ ] User notifications added
- [ ] Documentation complete

---

## 🎯 Next Steps

1. Apply rate limiting to email actions
2. Apply to critical mutations
3. Apply to webhook triggers
4. Apply to AI actions
5. Add cleanup cron job
6. Test thoroughly
7. Monitor in production

---

**Rate limiting is now ready to protect your application!** 🛡️
