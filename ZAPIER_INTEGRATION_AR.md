# 🔌 دليل التكاملات - Zapier Integration
## أين وكيف تضع التكاملات في النظام

**تاريخ:** 2025-10-25
**الحالة:** ✅ النظام جاهز - فقط أضف المفتاح!

---

## 📍 إجابة سريعة: أين أضع التكاملات؟

### المكان #1: مفتاح Zapier في Convex Backend

```bash
# في Terminal
cd /home/user/lkm

npx convex env set ZAPIER_WEBHOOK_URL "https://hooks.zapier.com/hooks/catch/[YOUR-ID]/xxxxx"
```

**هذا كل شيء!** 🎉

النظام جاهز بالكامل - الكود موجود مسبقاً ويعمل تلقائياً!

---

## 🎯 ما هي التكاملات المتوفرة؟

النظام يرسل webhooks تلقائياً عند:

| الحدث | متى يُرسل | البيانات المُرسلة |
|-------|-----------|-------------------|
| 💰 `revenue_created` | إضافة إيراد جديد | التاريخ، المبالغ، الفرع |
| 💸 `expense_created` | إضافة مصروف جديد | العنوان، المبلغ، الفئة |
| 📦 `product_order_created` | طلب منتجات جديد | الموظف، المنتجات، الإجمالي |
| 👤 `employee_request_created` | طلب موظف جديد | الموظف، النوع، الحالة |
| 📧 `email_request` | إرسال إيميل | المستقبل، الموضوع، المحتوى |
| 📄 `pdf_generated` | تصدير PDF | نوع التقرير، ملخص البيانات |
| 💵 `payroll_generated` | إنشاء مسير رواتب | الفرع، الشهر، الموظفين |
| ✅ `request_approved` | قبول طلب | نوع الطلب، المبلغ |

**ملاحظة:** الكود يعمل تلقائياً - لا تحتاج لبرمجة أي شيء!

---

## 📂 أين يوجد الكود؟

### الملفات الجاهزة في المشروع:

```
convex/
├── zapier.ts              ← الكود الرئيسي للتكاملات ✅
├── zapierHelper.ts        ← دوال مساعدة ✅
├── zapierQueries.ts       ← استعلامات قاعدة البيانات ✅
├── revenues.ts            ← يستدعي Zapier عند إيراد جديد ✅
├── expenses.ts            ← يستدعي Zapier عند مصروف جديد ✅
├── productOrders.ts       ← يستدعي Zapier عند طلب جديد ✅
├── employeeRequests.ts    ← يستدعي Zapier عند طلب موظف ✅
└── emailSystem.ts         ← يستدعي Zapier عند إيميل ✅
```

**كل الكود موجود ويعمل!** لا تحتاج لتعديل أي شيء!

---

## 🛠️ خطوات الإعداد الكاملة

### الخطوة 1: احصل على Webhook URL من Zapier

#### 1.1 اذهب إلى Zapier:
```
https://zapier.com/
```

#### 1.2 سجل حساب (مجاني):
- خطة مجانية: 100 tasks/شهر
- كافية للبداية!

#### 1.3 أنشئ Zap جديد:
```
1. اضغط "Create Zap"
2. في Trigger:
   - ابحث عن: "Webhooks by Zapier"
   - اختر: "Catch Hook"
   - اضغط "Continue"
3. ستظهر لك Webhook URL:
   https://hooks.zapier.com/hooks/catch/12345678/abcdef
4. انسخ هذا الرابط! ✅
```

### الخطوة 2: ضع المفتاح في Convex

#### الطريقة 1: عبر Dashboard (موصى بها)

```
1. اذهب إلى: https://dashboard.convex.dev/
2. اختر مشروعك
3. Settings → Environment Variables
4. اضغط "Add Variable"
5. املأ:
   Name:  ZAPIER_WEBHOOK_URL
   Value: https://hooks.zapier.com/hooks/catch/12345678/abcdef
6. Save
```

#### الطريقة 2: عبر Terminal

```bash
cd /home/user/lkm

npx convex env set ZAPIER_WEBHOOK_URL "https://hooks.zapier.com/hooks/catch/12345678/abcdef"
```

#### ✅ تحقق من الإضافة:

```bash
npx convex env get ZAPIER_WEBHOOK_URL
```

**يجب أن ترى:** رابط Webhook الذي أضفته

### الخطوة 3: اختبر التكامل

#### 3.1 في التطبيق:
```
1. افتح: http://localhost:5173/revenues
   (أو الموقع المنشور على Cloudflare)

2. أضف إيراد جديد:
   - التاريخ: اليوم
   - نقدي: 1000
   - شبكة: 500
   - آجل: 300

3. اضغط حفظ
```

#### 3.2 في Zapier:
```
1. ارجع لـ Zapier Dashboard
2. في نفس الـ Zap
3. اضغط "Test trigger"
4. يجب أن ترى البيانات التي أدخلتها! ✅
```

#### 3.3 إذا لم تصل البيانات:

```bash
# تحقق من أن المفتاح موجود
npx convex env list

# يجب أن ترى:
# ZAPIER_WEBHOOK_URL = https://hooks.zapier.com/...
```

---

## 🎨 أمثلة Zaps جاهزة

### مثال 1: إرسال إيميل عند إيراد جديد

```
Trigger: Webhooks by Zapier → Catch Hook
Filter:  Only continue if: event equals "revenue_created"
Action:  Gmail → Send Email
         To: manager@company.com
         Subject: إيراد جديد - {{data__branch__name}}
         Body:
           تم إضافة إيراد جديد:
           - التاريخ: {{data__date}}
           - نقدي: {{data__cash}}
           - شبكة: {{data__network}}
           - آجل: {{data__budget}}
           - الإجمالي: {{data__total}}
           - الفرع: {{data__branch__name}}
```

### مثال 2: حفظ المصاريف في Google Sheets

```
Trigger: Webhooks by Zapier → Catch Hook
Filter:  Only continue if: event equals "expense_created"
Action:  Google Sheets → Create Spreadsheet Row
         Spreadsheet: "مصاريف 2025"
         Worksheet: "يناير"
         Row:
           - التاريخ: {{data__date}}
           - العنوان: {{data__title}}
           - المبلغ: {{data__amount}}
           - الفئة: {{data__category}}
           - الفرع: {{data__branch__name}}
```

### مثال 3: إشعار Slack عند طلب موظف جديد

```
Trigger: Webhooks by Zapier → Catch Hook
Filter:  Only continue if: event equals "employee_request_created"
Action:  Slack → Send Channel Message
         Channel: #hr-requests
         Message:
           🔔 طلب جديد من موظف!

           الموظف: {{data__employeeName}}
           النوع: {{data__requestType}}
           الحالة: {{data__status}}
           الفرع: {{data__branchName}}
```

### مثال 4: إشعار عند إنشاء مسير رواتب

```
Trigger: Webhooks by Zapier → Catch Hook
Filter:  Only continue if: event equals "payroll_generated"
Action:  Telegram → Send Message
         Chat: @hr_team
         Message:
           💵 تم إنشاء مسير رواتب جديد!

           الفرع: {{data__branchName}}
           الشهر: {{data__month}}/{{data__year}}
           عدد الموظفين: {{data__employeeCount}}
           الإجمالي: {{data__totalAmount}}
```

---

## 🔄 تكاملات متقدمة

### Multi-Step Zap (عدة خطوات)

```
Trigger: revenue_created

Actions:
  1. Gmail → إرسال إيميل للمدير
  2. Google Sheets → حفظ البيانات
  3. Slack → إشعار في #finance
  4. Trello → إنشاء بطاقة للمراجعة
```

### Conditional Zap (شرطي)

```
Trigger: expense_created

Filter 1: amount > 5000
Action:  Gmail → تنبيه للمدير (مصروف كبير!)

Filter 2: category = "المصاريف الثابتة"
Action:  Google Sheets → حفظ في ورقة "ثابت"
```

### Scheduled Zap (مجدول)

```
Trigger: Schedule → Every Month on 1st at 9:00 AM

Action:  Webhooks by Zapier → POST Request
         URL: https://your-convex-url/api/generateMonthlyReport
         (يمكنك إنشاء endpoint خاص لهذا)
```

---

## 📊 مراقبة التكاملات

### في Zapier Dashboard:

```
1. اذهب إلى: https://zapier.com/app/zaps
2. اختر الـ Zap الخاص بك
3. اضغط "Task History"
4. ستجد:
   ✅ Successful tasks (نجحت)
   ❌ Failed tasks (فشلت)
   ⏸️ Held tasks (معلقة)
```

### في التطبيق (لو أضفنا صفحة Zapier):

```
يمكن إضافة صفحة في:
/system-support

تعرض:
- عدد الـ webhooks المرسلة
- آخر 10 events
- معدل النجاح
- الأخطاء الأخيرة
```

---

## 🐛 حل المشاكل

### المشكلة 1: لا يُرسل webhooks

**الأسباب المحتملة:**

```bash
# تحقق من وجود المفتاح
npx convex env get ZAPIER_WEBHOOK_URL

# إذا لم يظهر شيء:
npx convex env set ZAPIER_WEBHOOK_URL "https://hooks.zapier.com/..."
```

### المشكلة 2: Zapier يرجع 404

**الحلول:**

```
✅ تأكد أن الـ Zap مُشغّل (ON)
✅ تأكد أن الـ URL كامل (ينتهي بـ /)
✅ جرب إنشاء Zap جديد
✅ تحقق من حالة Zapier: https://status.zapier.com
```

### المشكلة 3: البيانات لا تصل كاملة

**تحقق من Payload:**

افتح Zapier Task History وشاهد البيانات المُستلمة:

```json
{
  "event": "revenue_created",
  "timestamp": "2025-10-25T12:00:00Z",
  "data": {
    "id": "...",
    "date": "...",
    "cash": 1000,
    ...
  }
}
```

إذا كانت البيانات ناقصة، تحقق من الكود في `convex/revenues.ts`

---

## 🔐 الأمان

### ✅ Best Practices:

1. **لا تشارك Webhook URL علناً**
   - احفظه في Convex env فقط
   - لا ترفعه على GitHub

2. **استخدم Zapier Filters**
   - فلتر البيانات حسب الحاجة
   - لا ترسل كل شيء لكل مكان

3. **راقب الاستخدام**
   - تحقق من Task History بانتظام
   - احذر من الـ loops (حلقات لا نهائية)

4. **اختبر في Dev أولاً**
   - استخدم webhook URL مختلف للتطوير
   - لا تختبر في Production مباشرة

---

## 💡 أفكار إبداعية

### 1. نظام تقارير ذكي:

```
كل نهاية يوم (7 PM):
→ جمع إيرادات اليوم من Convex
→ إرسال تقرير PDF عبر Email
→ نشر ملخص في Slack
→ حفظ في Google Drive
```

### 2. تنبيهات ذكية:

```
عند إنشاء مسير رواتب:
→ إرسال إيميل للمحاسب
→ إرسال SMS للمدير
→ إنشاء مهمة في Asana
→ جدولة اجتماع في Google Calendar
```

### 3. نسخ احتياطي تلقائي:

```
كل أسبوع (Sunday 12 AM):
→ تصدير جميع البيانات
→ حفظ في Google Sheets
→ نسخة احتياطية في Dropbox
→ إشعار بنجاح العملية
```

---

## 📚 ملفات مرجعية

| الملف | الوصف |
|------|-------|
| `convex/zapier.ts` | الكود الرئيسي للـ webhooks |
| `ZAPIER_QUICKSTART.md` | دليل البداية السريعة (English) |
| `ZAPIER_EMAIL_AGENT_SETUP.md` | دليل تكامل الإيميل |
| `ZAPIER_SCHEDULER_SETUP.md` | دليل المهام المجدولة |
| `ALL_SECRETS_AND_KEYS.md` | جميع المفاتيح والأسرار |

---

## ✅ Checklist الإعداد

- [ ] ✅ سجلت في Zapier.com
- [ ] ✅ أنشأت Zap جديد
- [ ] ✅ اخترت "Webhooks by Zapier" → "Catch Hook"
- [ ] ✅ نسخت Webhook URL
- [ ] ✅ أضفت `ZAPIER_WEBHOOK_URL` في Convex
- [ ] ✅ تحققت: `npx convex env get ZAPIER_WEBHOOK_URL`
- [ ] ✅ اختبرت بإضافة إيراد/مصروف جديد
- [ ] ✅ رأيت البيانات في Zapier Task History
- [ ] ✅ أضفت Action (Gmail, Sheets, Slack, إلخ)
- [ ] ✅ شغّلت الـ Zap (ON)

---

## 🎓 موارد تعليمية

### دروس Zapier:

```
1. Zapier University:
   https://zapier.com/university

2. Zapier Help Center:
   https://help.zapier.com/

3. Webhooks Tutorial:
   https://zapier.com/apps/webhook/tutorials
```

### مجتمع Zapier:

```
Community Forum:
https://community.zapier.com/
```

---

## 🎯 الخلاصة

### أين تضع التكاملات؟

**مكان واحد فقط:**
```bash
npx convex env set ZAPIER_WEBHOOK_URL "https://hooks.zapier.com/hooks/catch/xxxxx"
```

### الكود جاهز؟

✅ **نعم!** كل الكود موجود في:
- `convex/zapier.ts`
- `convex/revenues.ts`
- `convex/expenses.ts`
- وغيرها...

### يعمل تلقائياً؟

✅ **نعم!** فقط أضف المفتاح وسيبدأ الإرسال تلقائياً عند:
- إضافة إيراد
- إضافة مصروف
- إنشاء طلب
- إنشاء مسير رواتب
- وغيرها...

---

## 🚀 ابدأ الآن!

```bash
# 1. احصل على Webhook URL من Zapier
https://zapier.com → Create Zap → Webhooks → Catch Hook

# 2. أضفه في Convex
npx convex env set ZAPIER_WEBHOOK_URL "https://hooks.zapier.com/hooks/catch/xxxxx"

# 3. اختبر!
افتح التطبيق → أضف إيراد جديد → تحقق من Zapier
```

**مبروك! تكاملاتك جاهزة!** 🎉

---

**تم بواسطة:** Claude Code
**التاريخ:** 2025-10-25
**الحالة:** ✅ دليل شامل جاهز
