# ⚠️ تصحيح مهم: كيف تحصل على Zapier Webhook URL
## Important Correction: How to Get Your Zapier Webhook URL

**تاريخ:** 2025-10-25

---

## 🚨 خطأ وجدته في التوثيق القديم:

الـ URL الموجود في بعض الملفات القديمة:
```
https://hooks.zapier.com/hooks/catch/4045e58858fec2e48109352fcd71ead5/
```

**هذا URL قديم من جلسة سابقة - ليس خاصاً بك!**

---

## ✅ الطريقة الصحيحة للحصول على رابطك:

### الخطوة 1: اذهب إلى Zapier

```
https://zapier.com/app/zaps
```

سجل دخول أو أنشئ حساب جديد (مجاني)

### الخطوة 2: أنشئ Zap جديد

```
1. اضغط الزر الأزرق "Create Zap"

2. في شاشة Trigger (الخطوة 1):
   - في مربع البحث، اكتب: "Webhooks"
   - اختر: "Webhooks by Zapier"

3. في App Event:
   - اختر: "Catch Hook"
   - اضغط "Continue"

4. في الصفحة التالية ستظهر:
   "Your webhook URL is ready to receive data"

   تحت هذا النص ستجد رابط مثل:
   https://hooks.zapier.com/hooks/catch/1234567/abcd1234

5. اضغط على أيقونة النسخ 📋 لنسخ الرابط كاملاً
```

### الخطوة 3: احفظ هذا الرابط

هذا هو **رابطك الفريد** - استخدمه في Convex:

```bash
npx convex env set ZAPIER_WEBHOOK_URL "https://hooks.zapier.com/hooks/catch/[رابطك-هنا]"
```

---

## 🔍 الفرق بين Webhooks و Zapier API:

### Webhooks by Zapier (ما نحتاجه):

```
[تطبيقك] ──────→ [Zapier]
            webhook

الاستخدام:
- تطبيقك يُرسل بيانات إلى Zapier
- Zapier يستقبل ويعالج البيانات
- بسيط ومباشر

الرابط:
https://hooks.zapier.com/hooks/catch/XXXXX
```

### Zapier API (شيء آخر):

```
[Zapier] ──────→ [تطبيقك]
           API call

الاستخدام:
- Zapier يستدعي API في تطبيقك
- يحتاج API endpoints في تطبيقك
- أكثر تعقيداً

التوثيق:
https://docs.zapier.com/ai-actions/api-reference/
```

**نحن نستخدم Webhooks - وليس API!**

---

## 📸 شرح بالصور (خطوات مفصلة):

### الخطوة 1: Create Zap

```
┌─────────────────────────────────────┐
│  Zapier Dashboard                   │
│                                     │
│  [+ Create Zap]  ← اضغط هنا       │
│                                     │
│  My Zaps                            │
│  - Zap 1                            │
│  - Zap 2                            │
└─────────────────────────────────────┘
```

### الخطوة 2: اختر Trigger

```
┌─────────────────────────────────────┐
│  Choose app & event                 │
│                                     │
│  🔍 Search apps...                  │
│      [webhooks]                     │
│                                     │
│  📌 Webhooks by Zapier  ← اختر هذا │
│  📧 Gmail                           │
│  📊 Google Sheets                   │
└─────────────────────────────────────┘
```

### الخطوة 3: اختر Event

```
┌─────────────────────────────────────┐
│  Choose Event                       │
│                                     │
│  ○ Catch Hook          ← اختر هذا  │
│  ○ Catch Raw Hook                   │
│                                     │
│  [Continue]                         │
└─────────────────────────────────────┘
```

### الخطوة 4: انسخ الرابط

```
┌─────────────────────────────────────┐
│  Your webhook URL is ready          │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ https://hooks.zapier.com/...  │ │
│  │                           📋  │ │
│  └───────────────────────────────┘ │
│           ↑                         │
│     انسخ هذا الرابط                │
│                                     │
│  [Continue]                         │
└─────────────────────────────────────┘
```

---

## ✅ تحقق من الرابط الصحيح:

### رابط صحيح ✅

```
https://hooks.zapier.com/hooks/catch/1234567/abcd1234efgh5678
https://hooks.zapier.com/hooks/catch/9876543/xyz9876543210abc
```

**الخصائص:**
- يبدأ بـ `https://hooks.zapier.com/hooks/catch/`
- يحتوي على أرقام وحروف فريدة
- طويل ومعقد

### رابط خاطئ ❌

```
https://docs.zapier.com/...
https://api.zapier.com/...
https://zapier.com/app/...
```

**السبب:**
- هذه روابط للتوثيق أو Dashboard
- ليست webhook URLs

---

## 🧪 اختبر الرابط:

بعد نسخ الرابط:

### 1. اختبار بسيط (في Terminal):

```bash
curl -X POST https://hooks.zapier.com/hooks/catch/[YOUR-URL] \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**يجب أن ترى:**
```json
{"status":"success"}
```

### 2. اختبار في Zapier:

```
1. في نفس صفحة الـ Zap
2. اضغط "Test trigger"
3. يجب أن يقول:
   "We found a request!"
   (من الأمر curl أعلاه)
```

---

## 🔧 ضع الرابط في Convex:

### الطريقة 1: Dashboard (موصى بها)

```
1. https://dashboard.convex.dev/
2. اختر: smiling-dinosaur-349
3. Settings → Environment Variables
4. Add Variable:
   Name:  ZAPIER_WEBHOOK_URL
   Value: [الصق رابطك الحقيقي من Zapier]
5. Save
```

### الطريقة 2: Terminal

```bash
cd /home/user/lkm

# استبدل [YOUR-URL] برابطك الكامل
npx convex env set ZAPIER_WEBHOOK_URL "https://hooks.zapier.com/hooks/catch/[YOUR-URL]"
```

### تحقق:

```bash
npx convex env get ZAPIER_WEBHOOK_URL
```

**يجب أن يعرض رابطك الحقيقي!**

---

## 🎯 الخلاصة:

### ❌ لا تستخدم:
- الـ URL القديم من الملفات
- أمثلة من التوثيق
- روابط Zapier API

### ✅ استخدم:
- رابط جديد تنشئه من Zapier Dashboard
- رابط فريد خاص بك
- Webhook URL (يبدأ بـ `hooks.zapier.com/hooks/catch/`)

---

## 🆘 لو احتجت مساعدة:

### السؤال 1: لا أجد "Webhooks by Zapier"

**الحل:**
```
- تأكد من البحث عن: "webhooks" (بدون مسافات)
- يجب أن يظهر في القائمة المنسدلة
- إذا لم يظهر، حدّث الصفحة
```

### السؤال 2: لم يظهر لي الرابط

**الحل:**
```
- تأكد من اختيار "Catch Hook" (ليس Catch Raw Hook)
- اضغط Continue
- يجب أن يظهر الرابط في الصفحة التالية
```

### السؤال 3: الرابط لا يعمل في curl

**الحل:**
```
- تأكد من نسخ الرابط كاملاً
- تأكد من عدم وجود مسافات في البداية أو النهاية
- جرب في Zapier Dashboard أولاً (Test trigger)
```

---

## 📚 مراجع مفيدة:

```
Zapier Webhooks Documentation:
https://help.zapier.com/hc/en-us/articles/8496288690317-Trigger-Zaps-from-webhooks

Video Tutorial:
https://www.youtube.com/results?search_query=zapier+catch+hook+tutorial
```

---

## ✅ Checklist:

- [ ] ذهبت إلى https://zapier.com/app/zaps
- [ ] ضغطت "Create Zap"
- [ ] اخترت "Webhooks by Zapier"
- [ ] اخترت "Catch Hook"
- [ ] نسخت الرابط الكامل
- [ ] اختبرت الرابط بـ curl
- [ ] أضفته في Convex Dashboard أو CLI
- [ ] تحققت: `npx convex env get ZAPIER_WEBHOOK_URL`

---

**اعتذر عن الالتباس السابق!**

الآن لديك الطريقة الصحيحة 100% للحصول على رابطك الخاص.

**أي أسئلة؟ أخبرني!** 😊

---

**تم بواسطة:** Claude Code
**التاريخ:** 2025-10-25
**الحالة:** ✅ تم التصحيح
