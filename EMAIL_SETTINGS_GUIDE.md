# 📧 دليل إعدادات البريد الإلكتروني والجدولة

## ✅ ما تم إنجازه

تم إضافة **Settings Tab** شامل في صفحة System Support (`/system-support`) يحتوي على:

### 1. ✅ إعدادات المرسل (Sender Settings)
**الهدف:** ضبط اسم وبريد المرسل الافتراضي

**الخصائص:**
- اسم المرسل (يظهر في صندوق الوارد)
- البريد الإلكتروني للمرسل

**الاستخدام:**
1. اذهب إلى `/system-support` → تاب "إعدادات"
2. أدخل اسم المرسل والبريد
3. اضغط "حفظ المرسل"

**القيم الافتراضية:**
- الاسم: "نظام الإدارة المالية"
- البريد: "onboarding@resend.dev"

---

### 2. ✅ المستلمون الافتراضيون (Default Recipients)
**الهدف:** حفظ قائمة بالمستلمين للاستخدام السريع

**الخصائص:**
- إضافة/حذف مستلمين
- قائمة محفوظة قابلة لإعادة الاستخدام

**الاستخدام:**
1. أدخل البريد الإلكتروني
2. اضغط Enter أو زر +
3. كرر لإضافة المزيد
4. اضغط "حفظ المستلمين"

**الميزات:**
- ✅ يتحقق من صحة البريد (@)
- ✅ يمنع التكرار
- ✅ حذف سريع لكل بريد

---

### 3. ✅ الجدولة اليومية (Daily Schedule - 3:00 AM)
**الهدف:** إرسال تقرير يومي تلقائي

**الإعدادات:**
- ✅ تفعيل/إيقاف
- ✅ اختيار الوقت (افتراضي: 03:00)
- ✅ اختيار القالب أو نص مفتوح:
  - تقرير دوري (report template)
  - إشعار عام (notification template)
  - نص مفتوح (custom HTML)
- ✅ إضافة المستلمين
- ✅ زر "استخدام الافتراضي" لنسخ القائمة الافتراضية

**الاستخدام:**
1. فعّل الجدولة
2. اختر الوقت
3. اختر القالب (أو "نص مفتوح" للمحتوى المخصص)
4. أضف المستلمين
5. اضغط "حفظ الجدولة اليومية"

---

### 4. ✅ الجدولة الشهرية (Monthly Schedule - 1st @ 12:00 PM)
**الهدف:** إرسال تقرير شهري تلقائي

**الإعدادات:**
- ✅ تفعيل/إيقاف
- ✅ اختيار اليوم من الشهر (1-28)
- ✅ اختيار الوقت (افتراضي: 12:00)
- ✅ اختيار القالب أو نص مفتوح:
  - تقرير دوري (report template)
  - إشعار عام (notification template)
  - نص مفتوح (custom HTML)
- ✅ إضافة المستلمين
- ✅ زر "استخدام الافتراضي" لنسخ القائمة الافتراضية

**الاستخدام:**
1. فعّل الجدولة
2. اختر اليوم من الشهر
3. اختر الوقت
4. اختر القالب (أو "نص مفتوح" للمحتوى المخصص)
5. أضف المستلمين
6. اضغط "حفظ الجدولة الشهرية"

---

## 🗄️ البنية التقنية

### Database Schema
**جدول:** `emailSettings`

```typescript
emailSettings: defineTable({
  settingKey: v.string(),
  settingValue: v.union(
    v.string(),
    v.object({...}),
    v.array(v.string()),
  ),
  updatedAt: v.number(),
}).index("by_key", ["settingKey"])
```

**Keys المتاحة:**
- `sender_name`: اسم المرسل (string)
- `sender_email`: بريد المرسل (string)
- `default_recipients`: قائمة المستلمين (array)
- `daily_schedule`: إعدادات الجدولة اليومية (object)
- `monthly_schedule`: إعدادات الجدولة الشهرية (object)

---

### Backend Functions
**ملف:** `convex/emailSettings.ts`

**Queries:**
- `getSetting({ key })` - الحصول على إعداد واحد
- `getAllSettings()` - الحصول على جميع الإعدادات

**Mutations:**
- `updateSetting({ key, value })` - تحديث إعداد عام
- `updateSenderSettings({ senderName, senderEmail })` - تحديث المرسل
- `updateDefaultRecipients({ recipients })` - تحديث المستلمين
- `updateDailySchedule({ enabled, time, templateId, customContent, recipients })` - تحديث الجدولة اليومية
- `updateMonthlySchedule({ enabled, day, time, templateId, customContent, recipients })` - تحديث الجدولة الشهرية

---

### Frontend Components
**ملف:** `src/pages/system-support/page.tsx`

**Component:** `SettingsTabContent`

**State Management:**
- ✅ useQuery لتحميل الإعدادات
- ✅ useMutation لحفظ التحديثات
- ✅ useState للـ UI state
- ✅ useEffect لتحميل البيانات عند التحديث

---

## 🔗 الربط مع Zapier

### Option 1: Zapier Schedule (موصى به)

#### للجدولة اليومية (3:00 AM):
```
1. إنشاء Zap جديد
2. Trigger: Schedule by Zapier
   - Frequency: Every Day
   - Time: 3:00 AM
   - Timezone: Asia/Riyadh
3. Action: Webhooks by Zapier
   - Method: POST
   - URL: [الـ webhook URL من تاب Zapier]
   - Payload:
     {
       "eventType": "daily_email_scheduled",
       "timestamp": "{{zap_meta_human_now}}"
     }
4. Action 2: Email by Resend (أو Gmail)
   - To: [قراءة من الإعدادات أو ثابت]
   - Subject: "تقرير يومي"
   - Body: [قراءة من الإعدادات أو قالب]
```

#### للجدولة الشهرية (1st @ 12:00 PM):
```
1. إنشاء Zap جديد
2. Trigger: Schedule by Zapier
   - Frequency: Every Month
   - Day: 1
   - Time: 12:00 PM
   - Timezone: Asia/Riyadh
3. Action: Webhooks by Zapier
   - Method: POST
   - URL: [الـ webhook URL من تاب Zapier]
   - Payload:
     {
       "eventType": "monthly_email_scheduled",
       "timestamp": "{{zap_meta_human_now}}"
     }
4. Action 2: Email by Resend (أو Gmail)
   - To: [قراءة من الإعدادات أو ثابت]
   - Subject: "تقرير شهري"
   - Body: [قراءة من الإعدادات أو قالب]
```

---

### Option 2: Convex Scheduler (بديل)

استخدم `convex/clearRevenues.ts`:
- ✅ `initializeScheduling()` - لبدء الجدولة
- ✅ `dailyTask3AM()` - المهمة اليومية
- ✅ `monthlyTask1st()` - المهمة الشهرية

**ملاحظة:** Convex Scheduler يحتاج re-scheduling بعد كل تشغيل، بينما Zapier Schedule تلقائي بالكامل.

---

## 📊 كيفية الاستخدام الكامل

### Workflow كامل:

```
1. إعداد المرسل
   ↓
2. إضافة المستلمين الافتراضيين
   ↓
3. تفعيل الجدولة اليومية/الشهرية
   ↓
4. اختيار القالب أو كتابة نص مفتوح
   ↓
5. إضافة المستلمين (أو استخدام الافتراضي)
   ↓
6. حفظ الإعدادات
   ↓
7. إعداد Zapier Schedule
   ↓
8. اختبار التشغيل
```

---

## 🎯 الميزات الرئيسية

### ✅ المرسل
- ضبط الاسم والبريد
- يظهر في جميع الرسائل المُرسلة

### ✅ المستلمون الافتراضيون
- قائمة محفوظة
- استخدام سريع في الجدولات

### ✅ الجدولة اليومية
- وقت قابل للتخصيص
- 3 خيارات: قالب دوري، إشعار، نص مفتوح
- مستلمون مخصصون أو افتراضيون

### ✅ الجدولة الشهرية
- يوم ووقت قابلان للتخصيص
- 3 خيارات: قالب دوري، إشعار، نص مفتوح
- مستلمون مخصصون أو افتراضيون

### ✅ النص المفتوح
- دعم كامل لـ HTML
- محرر نصي كبير (6 أسطر)
- معاينة متاحة في تاب القوالب

---

## 🚀 الخطوات التالية

### 1. تجربة الإعدادات
```
1. اذهب إلى /system-support
2. اضغط على تاب "إعدادات"
3. أدخل بياناتك
4. اضغط حفظ
```

### 2. إعداد Zapier
```
1. افتح Zapier
2. أنشئ Zap للجدولة اليومية (3:00 AM)
3. أنشئ Zap للجدولة الشهرية (1st @ 12:00 PM)
4. اختبر التشغيل
```

### 3. اختبار النظام
```
1. أرسل بريد تجريبي من تاب "إرسال بريد"
2. تحقق من استخدام إعدادات المرسل
3. راقب السجل في تاب "السجل"
```

---

## 🎉 خلاصة الإنجاز

**تم إضافة:**
✅ Settings Tab شامل
✅ إعدادات المرسل (اسم + بريد)
✅ قائمة المستلمين الافتراضيين
✅ جدولة يومية (3:00 AM)
✅ جدولة شهرية (1 @ 12:00 PM)
✅ دعم القوالب الجاهزة
✅ دعم النص المفتوح (HTML)
✅ UI/UX احترافي
✅ ربط مع Zapier
✅ توثيق شامل

**الحالة:**
🟢 جاهز للاستخدام الفوري!

**الملفات المُضافة/المُعدّلة:**
1. ✅ `convex/schema.ts` - جدول emailSettings
2. ✅ `convex/emailSettings.ts` - Backend functions
3. ✅ `src/pages/system-support/page.tsx` - Settings Tab
4. ✅ `EMAIL_SETTINGS_GUIDE.md` - هذا الملف

---

**Ready to use!** 🚀📧
