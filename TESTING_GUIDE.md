# 🧪 دليل الاختبار - Testing Guide

## 🎯 Overview

هذا الدليل يشرح كيفية اختبار Convex functions بأمان باستخدام patterns من `convex-helpers`.

---

## 🛠️ Testing Utilities

### الملفات:
- `convex/testingHelpers.ts` - Test-only functions
- `convex/customFunctions.ts` - Authenticated wrappers

---

## 🔐 Environment-Based Protection

### Environment Variables:

```bash
# Development
IS_TEST=true

# Production  
IS_PROD=true
```

### Pattern: Environment Guards

```typescript
if (process.env.IS_TEST === undefined) {
  throw new Error("Test-only function called in wrong environment");
}
```

**لماذا مهم**:
- ✅ يمنع تنفيذ dangerous functions في production
- ✅ Clear error messages
- ✅ Fail-fast behavior

---

## 🧹 Database Cleanup

### clearAll Function

**الاستخدام**:
```bash
# تنظيف database (DEV ONLY!)
npx convex env set IS_TEST true
npx convex run testingHelpers:clearAll
```

**ما يحذف**:
1. ✅ جميع documents من جميع tables
2. ✅ Scheduled functions (`_scheduled_functions`)
3. ✅ Stored files (`_storage`)

**⚠️ تحذير**: 
- **خطير جداً** - يحذف كل شيء!
- محمي بـ `IS_TEST` check
- **لا تستخدم** في production

---

## 🌱 Seeding Test Data

### seedTestData Function

**الاستخدام**:
```bash
npx convex run testingHelpers:seedTestData
```

**ما ينشئ**:
- ✅ Test branch
- ✅ Test user (admin)
- ✅ Ready for testing

**Pattern لإضافة المزيد**:
```typescript
export const seedMoreData = testingMutation({
  devOnly: true,
  handler: async (ctx) => {
    // إضافة revenues
    await ctx.db.insert("revenues", {
      date: Date.now(),
      cash: 1000,
      network: 500,
      total: 1500,
      branchId: "test-branch",
      userId: testUserId,
    });
    
    // إضافة expenses
    await ctx.db.insert("expenses", {
      title: "مصروف اختبار",
      amount: 200,
      category: "متنوع",
      date: Date.now(),
      branchId: "test-branch",
      userId: testUserId,
    });
  },
});
```

---

## 🧪 Testing Patterns

### Pattern 1: Isolated Tests

```typescript
import { convexTest } from "convex-test";
import schema from "./schema";

test("revenue calculation", async () => {
  const t = convexTest(schema);
  
  // Setup
  await t.run(async (ctx) => {
    await ctx.db.insert("revenues", {
      cash: 100,
      network: 50,
      total: 150,
    });
  });
  
  // Test
  const result = await t.query(api.revenues.getTotal, {});
  expect(result).toBe(150);
  
  // Cleanup automatic!
});
```

### Pattern 2: E2E Tests

```typescript
test("full payroll flow", async () => {
  const t = convexTest(schema);
  
  // 1. Seed data
  await t.mutation(internal.testingHelpers.seedTestData, {});
  
  // 2. Create payroll
  const payrollId = await t.mutation(api.payroll.create, {
    branchId: "test-branch",
    month: 10,
    year: 2025,
  });
  
  // 3. Verify
  const payroll = await t.query(api.payroll.get, { payrollId });
  expect(payroll).toBeDefined();
  expect(payroll.totalNetSalary).toBeGreaterThan(0);
  
  // 4. Cleanup
  await t.mutation(internal.testingHelpers.clearAll, {});
});
```

---

## 🔍 Debugging Tests

### Enable Verbose Logging

في `.env.local`:
```bash
IS_TEST=true
CONVEX_VERBOSE=true
```

في code:
```typescript
export const myTest = testingMutation({
  handler: async (ctx) => {
    console.log("Test started");
    // ... test logic
    console.log("Test completed");
  },
});
```

### Check Convex Logs

1. https://dashboard.convex.dev/d/careful-clownfish-771
2. Logs tab
3. Filter by function name

---

## 📋 Testing Checklist

### قبل Production:
- [ ] جميع critical functions مُختبرة
- [ ] Auth validation مُختبرة
- [ ] Race conditions محمية
- [ ] Error handling مُختبر
- [ ] Edge cases covered

### Test Environment Setup:
- [ ] `IS_TEST=true` في dev deployment
- [ ] Test data seed functions جاهزة
- [ ] Cleanup functions آمنة
- [ ] CI/CD configured (optional)

---

## 🚀 Running Tests

### Local:
```bash
# Setup
npx convex env set IS_TEST true

# Run tests
npm test

# Cleanup
npx convex run testingHelpers:clearAll
```

### CI/CD:
```yaml
# في GitHub Actions
- name: Test Convex
  env:
    CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
    IS_TEST: true
  run: |
    npx convex deploy --cmd 'npm test'
```

---

## 📚 المراجع

- [convex-test](https://labs.convex.dev/convex-test)
- [Testing Functions](https://docs.convex.dev/production/testing)
- [convex-helpers Testing](https://github.com/get-convex/convex-helpers#testing)

---

**الملفات المُنشأة**:
- `convex/testingHelpers.ts` - Test utilities ✅
- `TESTING_GUIDE.md` - هذا الدليل ✅

