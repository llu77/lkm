# نظام الأسابيع الشامل - Universal Week System Design
## Week Segmentation System for All Month Lengths (28-31 days)

**التاريخ / Date:** 2025-10-25
**الهدف / Goal:** تصميم نظام أسابيع عادل يعمل مع جميع أطوال الأشهر الميلادية

---

## 🔴 المشكلة الحالية / Current Problem

### النظام القديم:
```
Week 1: أيام 1-7   (7 days) ✅
Week 2: أيام 8-14  (7 days) ✅
Week 3: أيام 15-22 (8 days) ❌ خطأ!
Week 4: أيام 23-29 (7 days) ✅
Week 5: أيام 30-31 (1-3 days)
```

### أيام الموافقة القديمة:
- يوم 8 (بداية الأسبوع 2)
- يوم 15 (بداية الأسبوع 3)
- يوم 23 (بداية الأسبوع 4)
- يوم 30 (بداية الأسبوع 5)

### المشاكل:
1. ❌ **الأسبوع 3 يحتوي على 8 أيام** - ميزة غير عادلة
2. ❌ **لا يعمل مع فبراير (28 يوم)** - يوم 30 غير موجود
3. ❌ **غير متسق** - يوم 29 في فبراير كبيس لا يوجد له أسبوع

---

## ✅ النظام الجديد / New System Design

### تقسيم الأسابيع الجديد:
```
Week 1: أيام 1-7   (7 days) ✅ عادل
Week 2: أيام 8-14  (7 days) ✅ عادل
Week 3: أيام 15-21 (7 days) ✅ تم التصحيح!
Week 4: أيام 22-28 (7 days) ✅ تم التصحيح!
Week 5: أيام 29-31 (1-3 days) ✅ أيام متبقية
```

### أيام الموافقة الجديدة:
- يوم **8** (بداية الأسبوع 2)
- يوم **15** (بداية الأسبوع 3)
- يوم **22** (بداية الأسبوع 4) ← تغيير من 23
- يوم **29** (بداية الأسبوع 5) ← تغيير من 30

---

## 📅 اختبار على جميع أطوال الأشهر

### 1. فبراير - 28 يوم (سنة عادية)
```
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│   Mon   │   Tue   │   Wed   │   Thu   │   Fri   │   Sat   │   Sun   │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│    1    │    2    │    3    │    4    │    5    │    6    │    7    │ Week 1
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│  [8]    │    9    │   10    │   11    │   12    │   13    │   14    │ Week 2
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│  [15]   │   16    │   17    │   18    │   19    │   20    │   21    │ Week 3
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│  [22]   │   23    │   24    │   25    │   26    │   27    │   28    │ Week 4
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

Week 1: 1-7   (7 days) ✅
Week 2: 8-14  (7 days) ✅
Week 3: 15-21 (7 days) ✅
Week 4: 22-28 (7 days) ✅
Week 5: (لا يوجد)

أيام الموافقة: 8, 15, 22
الإجمالي: 3 أسابيع قابلة للاعتماد
```

### 2. فبراير - 29 يوم (سنة كبيسة)
```
Week 1: 1-7   (7 days) ✅
Week 2: 8-14  (7 days) ✅
Week 3: 15-21 (7 days) ✅
Week 4: 22-28 (7 days) ✅
Week 5: 29    (1 day)  ✅

أيام الموافقة: 8, 15, 22, 29
الإجمالي: 4 أسابيع قابلة للاعتماد
```

### 3. أشهر 30 يوم (أبريل، يونيو، سبتمبر، نوفمبر)
```
Week 1: 1-7   (7 days) ✅
Week 2: 8-14  (7 days) ✅
Week 3: 15-21 (7 days) ✅
Week 4: 22-28 (7 days) ✅
Week 5: 29-30 (2 days) ✅

أيام الموافقة: 8, 15, 22, 29
الإجمالي: 4 أسابيع قابلة للاعتماد
```

### 4. أشهر 31 يوم (يناير، مارس، مايو، يوليو، أغسطس، أكتوبر، ديسمبر)
```
Week 1: 1-7   (7 days) ✅
Week 2: 8-14  (7 days) ✅
Week 3: 15-21 (7 days) ✅
Week 4: 22-28 (7 days) ✅
Week 5: 29-31 (3 days) ✅

أيام الموافقة: 8, 15, 22, 29
الإجمالي: 4 أسابيع قابلة للاعتماد
```

---

## 💡 الفوائد / Benefits

### 1. العدالة ✅
- **كل أسبوع عمل = 7 أيام بالضبط** (الأسابيع 1-4)
- لا توجد ميزة غير عادلة لأي موظف
- فرص متساوية للوصول إلى حد البونص

### 2. الشمولية ✅
- **يعمل مع جميع الأشهر:**
  - فبراير 28 يوم ✅
  - فبراير 29 يوم (كبيس) ✅
  - أشهر 30 يوم ✅
  - أشهر 31 يوم ✅

### 3. الوضوح ✅
- أيام الموافقة ثابتة: **8، 15، 22، 29**
- سهل التذكر: كل 7 أيام من بداية الشهر
- الأسبوع 5 دائماً للأيام المتبقية (29-31)

### 4. الدقة ✅
- **لا أخطاء في الحسابات**
- لا تجميع 8 أيام بدلاً من 7
- مطابق للواقع: "أسبوع" = 7 أيام

---

## 🔧 التغييرات المطلوبة / Required Changes

### ملف: `convex/bonus.ts`

#### 1. تعديل دالة `getWeekInfo()`:
```typescript
// ❌ القديم
function getWeekInfo(date: Date) {
  const day = date.getDate();

  if (day >= 1 && day <= 7) {
    return { weekNumber: 1, weekLabel: "الأسبوع الأول (1-7)" };
  } else if (day >= 8 && day <= 14) {
    return { weekNumber: 2, weekLabel: "الأسبوع الثاني (8-14)" };
  } else if (day >= 15 && day <= 22) { // ❌ 8 أيام!
    return { weekNumber: 3, weekLabel: "الأسبوع الثالث (15-22)" };
  } else if (day >= 23 && day <= 29) {
    return { weekNumber: 4, weekLabel: "الأسبوع الرابع (23-29)" };
  } else {
    return { weekNumber: 5, weekLabel: "أيام متبقية" };
  }
}

// ✅ الجديد
function getWeekInfo(date: Date) {
  const day = date.getDate();

  if (day >= 1 && day <= 7) {
    return { weekNumber: 1, weekLabel: "الأسبوع الأول (1-7)" };
  } else if (day >= 8 && day <= 14) {
    return { weekNumber: 2, weekLabel: "الأسبوع الثاني (8-14)" };
  } else if (day >= 15 && day <= 21) { // ✅ 7 أيام!
    return { weekNumber: 3, weekLabel: "الأسبوع الثالث (15-21)" };
  } else if (day >= 22 && day <= 28) { // ✅ 7 أيام!
    return { weekNumber: 4, weekLabel: "الأسبوع الرابع (22-28)" };
  } else {
    // أيام 29-31 (حسب طول الشهر)
    return { weekNumber: 5, weekLabel: "أيام متبقية (29-31)" };
  }
}
```

#### 2. تعديل دالة `getWeekDateRange()`:
```typescript
// ❌ القديم
function getWeekDateRange(year: number, month: number, weekNumber: number) {
  let startDay: number;
  let endDay: number;

  if (weekNumber === 1) {
    startDay = 1;
    endDay = 7;
  } else if (weekNumber === 2) {
    startDay = 8;
    endDay = 14;
  } else if (weekNumber === 3) {
    startDay = 15;
    endDay = 22; // ❌ 8 أيام!
  } else if (weekNumber === 4) {
    startDay = 23;
    endDay = 29;
  } else {
    startDay = 30;
    const daysInMonth = new Date(year, month, 0).getDate();
    endDay = daysInMonth;
  }
  // ...
}

// ✅ الجديد
function getWeekDateRange(year: number, month: number, weekNumber: number) {
  let startDay: number;
  let endDay: number;

  if (weekNumber === 1) {
    startDay = 1;
    endDay = 7;
  } else if (weekNumber === 2) {
    startDay = 8;
    endDay = 14;
  } else if (weekNumber === 3) {
    startDay = 15;
    endDay = 21; // ✅ 7 أيام!
  } else if (weekNumber === 4) {
    startDay = 22; // ✅ تغيير من 23
    endDay = 28; // ✅ تغيير من 29
  } else {
    startDay = 29; // ✅ تغيير من 30
    const daysInMonth = new Date(year, month, 0).getDate();
    endDay = daysInMonth; // 29, 30, or 31
  }
  // ...
}
```

#### 3. تعديل أيام الموافقة:
```typescript
// ❌ القديم
const canApprove = [8, 15, 23, 30].includes(today);

// ✅ الجديد
const canApprove = [8, 15, 22, 29].includes(today);
```

---

## 📊 جداول الإحصائيات / Stats Tables

### مقارنة النظام القديم vs الجديد

| الشهر | طول الشهر | النظام القديم | النظام الجديد |
|-------|-----------|---------------|----------------|
| فبراير (عادي) | 28 يوم | ❌ يوم 30 غير موجود | ✅ 4 أسابيع (8,15,22) |
| فبراير (كبيس) | 29 يوم | ❌ الأسبوع 3 = 8 أيام | ✅ 4 أسابيع (8,15,22,29) |
| أبريل، يونيو، سبتمبر، نوفمبر | 30 يوم | ❌ الأسبوع 3 = 8 أيام | ✅ 4 أسابيع (8,15,22,29) |
| باقي الأشهر | 31 يوم | ❌ الأسبوع 3 = 8 أيام | ✅ 4 أسابيع (8,15,22,29) |

### توزيع الأيام لكل أسبوع

| الأسبوع | النظام القديم | النظام الجديد | التحسين |
|---------|---------------|----------------|---------|
| Week 1 | 7 أيام | 7 أيام | ✅ بدون تغيير |
| Week 2 | 7 أيام | 7 أيام | ✅ بدون تغيير |
| Week 3 | **8 أيام** ❌ | **7 أيام** ✅ | ✅ تم التصحيح! |
| Week 4 | 7 أيام | 7 أيام | ✅ بدون تغيير |
| Week 5 | 1-2 أيام | 1-3 أيام | ✅ يشمل يوم 29 |

---

## 🧪 حالات الاختبار / Test Cases

### Test Case 1: فبراير 2024 (كبيس - 29 يوم)
```javascript
const feb2024 = new Date(2024, 1, 15); // February 15, 2024
const weekInfo = getWeekInfo(feb2024);

// Expected:
weekInfo.weekNumber === 3 ✅
weekInfo.weekLabel === "الأسبوع الثالث (15-21)" ✅

const dateRange = getWeekDateRange(2024, 2, 3);
// Expected:
dateRange.startDay === 15 ✅
dateRange.endDay === 21 ✅ (NOT 22!)
```

### Test Case 2: فبراير 2025 (عادي - 28 يوم)
```javascript
const feb2025 = new Date(2025, 1, 29); // February 29, 2025 - doesn't exist!
// Should only have approval days: 8, 15, 22
```

### Test Case 3: يناير 2025 (31 يوم)
```javascript
const jan2025_week5 = new Date(2025, 0, 31); // January 31, 2025
const weekInfo = getWeekInfo(jan2025_week5);

// Expected:
weekInfo.weekNumber === 5 ✅
weekInfo.weekLabel === "أيام متبقية (29-31)" ✅
```

### Test Case 4: أبريل 2025 (30 يوم)
```javascript
const apr2025 = new Date(2025, 3, 29); // April 29, 2025
const canApprove = [8, 15, 22, 29].includes(29);

// Expected:
canApprove === true ✅
```

---

## ✅ قائمة التحقق / Checklist

- [ ] تعديل `getWeekInfo()` - تصحيح الأسبوع 3 (15-21) والأسبوع 4 (22-28)
- [ ] تعديل `getWeekDateRange()` - مطابقة التواريخ
- [ ] تعديل أيام الموافقة - (8, 15, 22, 29)
- [ ] اختبار فبراير 28 يوم
- [ ] اختبار فبراير 29 يوم (كبيس)
- [ ] اختبار أشهر 30 يوم
- [ ] اختبار أشهر 31 يوم
- [ ] التحقق من حسابات البونص
- [ ] التحقق من UI في صفحة البونص

---

## 📝 ملاحظات إضافية / Additional Notes

### معالجة الحالات الحدية:
1. **اليوم 29 في فبراير عادي** - لا يوجد، لن يكون هناك أسبوع 5
2. **اليوم 30 في فبراير** - لا يوجد، لن يكون هناك أسبوع 5
3. **اليوم 31 في أشهر 30 يوم** - لا يوجد، الأسبوع 5 ينتهي عند 30

### التوافق مع البيانات القديمة:
- البيانات المعتمدة سابقاً تبقى كما هي (محفوظة في `bonusRecords`)
- النظام الجديد ينطبق فقط على الموافقات الجديدة
- لا حاجة لـ migration للبيانات القديمة

---

**المرجع / Reference:** FINANCIAL_SYSTEM_AUDIT_REPORT.md (Issue #2)
**الحالة / Status:** تصميم معتمد - جاهز للتطبيق
**التقييم / Assessment:** ✅ نظام عادل وشامل ودقيق
