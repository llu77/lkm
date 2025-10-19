# 🐛 مرجع تشخيص المشاكل | Debugging Guide

## ⚠️ المشكلة الرئيسية: عدم الحفظ في قاعدة البيانات

### السبب الجذري (Root Cause)

**❌ المشكلة:** Error Handling السيء كان يُخفي الأخطاء الحقيقية

```typescript
// ❌ WRONG - يخفي الخطأ!
catch (error) {
  toast.error("فشل الحفظ");  // رسالة عامة فقط
}
```

**النتيجة:**
- المستخدم يرى "فشل الحفظ" لكن لا يعرف السبب
- البيانات لا تُحفظ لكن لا توجد تفاصيل
- Debugging مستحيل

---

## ✅ الحل المطبق

### 1. Error Handling محسّن في كل الصفحات

```typescript
// ✅ CORRECT - يعرض الخطأ الحقيقي!
catch (error) {
  const errorMessage = error instanceof Error 
    ? error.message 
    : "فشل الحفظ";
  toast.error(errorMessage, { duration: 6000 });
  console.error("Operation error:", error);
}
```

**الفوائد:**
- المستخدم يرى الخطأ الحقيقي
- console.error للـ debugging
- duration: 6000 لإعطاء وقت كافٍ للقراءة

---

### 2. الصفحات المصلحة

✅ **Product Orders** (`src/pages/product-orders/page.tsx`)
- Save draft error handling
- Send order error handling
- Delete draft error handling

✅ **Revenues** (`src/pages/revenues/page.tsx`)
- Already had good error handling! ✨
- Create revenue error handling
- Delete revenue error handling

✅ **Expenses** (`src/pages/expenses/page.tsx`)
- Create expense error handling
- Delete expense error handling

✅ **Employee Requests** (`src/pages/employee-requests/page.tsx`)
- Create request error handling

✅ **Manage Requests** (`src/pages/manage-requests/page.tsx`)
- Update status error handling

✅ **Bonus** (`src/pages/bonus/page.tsx`)
- Approve bonus error handling

---

### 3. أدوات مساعدة جديدة

#### **useConvexMutation Hook** (`src/hooks/use-convex-mutation.ts`)

Hook مخصص للتعامل مع mutations بشكل أفضل:

```typescript
import { useConvexMutation } from "@/hooks/use-convex-mutation";

// استخدام
const createRevenue = useConvexMutation(api.revenues.create);

// Automatic error handling!
await createRevenue({ ... });
```

**الميزات:**
- Error handling تلقائي
- Toast messages واضحة
- Console logging شامل
- Type-safe

---

## 🔍 كيف تفحص إذا كانت البيانات تُحفظ؟

### 1. افتح Console (F12)

```bash
# في Chrome/Edge:
F12 → Console tab

# في Firefox:
F12 → Console
```

### 2. جرب العملية

مثال: أضف إيراد جديد

### 3. راقب الرسائل

```javascript
// ✅ نجاح
"تم إضافة الإيراد بنجاح"

// ❌ خطأ - سترى التفاصيل الآن!
"Operation error: { message: '...', code: '...' }"
```

---

## 🛡️ حماية البيانات المدمجة

### في Revenues (`convex/revenues.ts`)

✅ **منع تكرار التاريخ** (line 111-134)
```typescript
// لا يمكن إضافة أكثر من إيراد واحد لنفس التاريخ
if (existingRevenue) {
  throw new ConvexError({
    message: "⚠️ لا يمكن إضافة أكثر من إيراد واحد لنفس التاريخ",
    code: "CONFLICT",
  });
}
```

✅ **التحقق من مجموع الموظفين** (line 157-167)
```typescript
// يجب أن يكون مجموع إيرادات الموظفين = المجموع الكلي
if (employeesTotal !== total) {
  throw new ConvexError({
    message: "⚠️ خطأ: مجموع إيرادات الموظفين لا يساوي المجموع الإجمالي",
    code: "BAD_REQUEST",
  });
}
```

✅ **منع حذف إيرادات معتمدة** (line 217-222)
```typescript
// لا يمكن حذف إيراد معتمد في البونص
if (revenue.isApprovedForBonus) {
  throw new ConvexError({
    message: "⚠️ لا يمكن حذف إيراد معتمد في البونص",
    code: "FORBIDDEN",
  });
}
```

---

## 📊 أخطاء شائعة وحلولها

### خطأ: "User not logged in"

**السبب:** Auth token منتهي أو غير موجود

**الحل:**
1. Sign out
2. Sign in مرة أخرى
3. Refresh الصفحة

---

### خطأ: "لا يمكن إضافة أكثر من إيراد واحد لنفس التاريخ"

**السبب:** يوجد إيراد مسجل بالفعل لهذا اليوم

**الحل:**
1. تحقق من القائمة
2. احذف الإيراد القديم (إذا كان خطأ)
3. أو اختر تاريخ مختلف

---

### خطأ: "مجموع إيرادات الموظفين لا يساوي المجموع الإجمالي"

**السبب:** الأرقام غير متطابقة

**الحل:**
1. تحقق من مجموع إيرادات الموظفين
2. يجب أن يساوي (كاش + شبكة)
3. صحح الأرقام وأعد المحاولة

---

## 🎯 Best Practices للمستقبل

### ✅ Do's (افعل)

1. **استخدم try-catch دائماً**
2. **عرض error.message للمستخدم**
3. **Log الخطأ الكامل في console**
4. **استخدم toast.error مع duration كافية**
5. **اختبر error cases**

### ❌ Don'ts (لا تفعل)

1. **لا تخفي الأخطاء**
2. **لا تستخدم رسائل عامة فقط**
3. **لا تنسى console.error**
4. **لا تتجاهل error types**
5. **لا تفترض أن العملية نجحت**

---

## 🔧 أدوات Debugging إضافية

### 1. Convex Dashboard

```
https://dashboard.convex.dev
```

- راقب جميع mutations في real-time
- شاهد الأخطاء والـ logs
- راجع database queries

### 2. Browser DevTools

```bash
F12 → Network → Filter: WS
```

- راقب WebSocket connections
- شاهد real-time updates
- تحقق من query responses

### 3. Console Logs

```typescript
console.log("Mutation args:", args);
console.error("Error details:", error);
console.table(data); // للبيانات الجدولية
```

---

## 📞 الدعم

إذا استمرت المشكلة:

1. ✅ تحقق من console errors
2. ✅ راجع هذا الدليل
3. ✅ جرب في incognito mode
4. ✅ Clear cache وrefresh
5. 📧 تواصل مع الدعم الفني

---

**آخر تحديث:** v66
**التاريخ:** 2025
