# ✅ دليل التحقق من متغيرات البيئة
## Cloudflare Pages Environment Variables Verification Guide

**تاريخ الإنشاء:** 2025-10-25
**الحالة:** 🔧 دليل شامل للتحقق وحل المشاكل

---

## 🎯 الهدف

هذا الدليل يساعدك في:
1. ✅ التأكد من ضبط متغيرات البيئة بشكل صحيح
2. ✅ التحقق من تحميلها أثناء البناء
3. ✅ اختبارها في الموقع المنشور
4. ✅ حل أي مشاكل متعلقة بها

---

## 📋 المتغيرات المطلوبة (5 متغيرات أساسية)

### ✅ القائمة الكاملة:

```env
# 1. اتصال Convex (مطلوب!)
VITE_CONVEX_URL=https://smiling-dinosaur-349.convex.cloud

# 2. وضع التطوير (للتجاوز المؤقت للمصادقة)
VITE_DEV_MODE=true

# 3. كلمة مرور صفحة الرواتب
VITE_PAYROLL_PASSWORD=Omar1010#

# 4. كلمة مرور صفحة الموظفين
VITE_EMPLOYEES_PASSWORD=Omar1010#

# 5. رابط التطبيق (اختياري - للإشعارات)
VITE_APP_URL=https://your-site.pages.dev
```

**⚠️ ملاحظات مهمة:**
- ❌ **لا تضيف** `VITE_MANAGE_REQUESTS_PASSWORD` - تم نقله للـ backend!
- ❌ **لا تضيف** `VITE_HERCULES_WEBSITE_ID` - اختياري وغير مستخدم
- ✅ يجب أن تبدأ جميع المتغيرات بـ `VITE_` لتكون متاحة في Frontend

---

## 🔧 الخطوة 1: إضافة المتغيرات في Cloudflare

### طريقة الإضافة الصحيحة:

1. **اذهب إلى:**
   ```
   Cloudflare Dashboard → Workers & Pages → [مشروعك] → Settings → Environment variables
   ```

2. **لكل متغير:**
   - اضغط **Add variable**
   - اكتب **اسم المتغير** (مثل: `VITE_CONVEX_URL`)
   - اكتب **القيمة** (مثل: `https://smiling-dinosaur-349.convex.cloud`)
   - ⚠️ **مهم جداً!** اختر: **"Production and Preview"** (ليس Production فقط!)
   - اضغط **Save**

3. **كرر للمتغيرات الخمسة:**
   - `VITE_CONVEX_URL`
   - `VITE_DEV_MODE`
   - `VITE_PAYROLL_PASSWORD`
   - `VITE_EMPLOYEES_PASSWORD`
   - `VITE_APP_URL` (اختياري)

### ✅ التحقق من الإضافة:

بعد الإضافة، يجب أن ترى:
```
VITE_CONVEX_URL          [مخفي]    Production and Preview
VITE_DEV_MODE            [مخفي]    Production and Preview
VITE_PAYROLL_PASSWORD    [مخفي]    Production and Preview
VITE_EMPLOYEES_PASSWORD  [مخفي]    Production and Preview
VITE_APP_URL             [مخفي]    Production and Preview
```

---

## 🔄 الخطوة 2: إعادة النشر (Redeploy)

بعد إضافة المتغيرات، **يجب** إعادة النشر:

### الطريقة 1: عبر Dashboard
1. اذهب إلى: `Deployments`
2. اختر آخر deployment ناجح
3. اضغط **⋯** (ثلاث نقاط)
4. اضغط **Retry deployment**

### الطريقة 2: عبر Git Push
```bash
git add .
git commit -m "fix: Update environment variables configuration" --allow-empty
git push -u origin claude/senior-engineer-profile-011CUSTeMoVrh97pTkgMgFXs
```

---

## 🔍 الخطوة 3: فحص Build Log

بعد إعادة النشر، افتح Build log:

### ✅ ما يجب أن تراه:

```
11:19:57.915  Vite v5.x.x building for production...
11:19:58.000  ✓ built in X.XXs
```

### ⚠️ ما **لا** يجب أن تراه:

```
❌ (!) %VITE_HERCULES_WEBSITE_ID% is not defined
❌ (!) %VITE_CONVEX_URL% is not defined
```

**ملاحظة:** القيم الفعلية للمتغيرات **لن تظهر** في الـ log (لأسباب أمنية). هذا طبيعي! ✅

---

## 🧪 الخطوة 4: اختبار الموقع المنشور

### اختبار 1: فتح الموقع
```
https://your-site.pages.dev
```

**النتيجة المتوقعة:**
- ✅ الصفحة تفتح بدون أخطاء في Console
- ✅ لا توجد رسائل عن متغيرات غير معرّفة

### اختبار 2: فحص Console (F12)

افتح Developer Tools (F12) ثم اذهب إلى Console:

**الأخطاء التي تعني مشكلة في المتغيرات:**
```javascript
❌ Error: Missing Convex deployment URL
❌ Uncaught TypeError: Cannot read properties of undefined
❌ VITE_CONVEX_URL is not defined
```

**إذا لم ترى هذه الأخطاء = المتغيرات تعمل! ✅**

### اختبار 3: اتصال Convex

في Console، شغّل:
```javascript
console.log(import.meta.env.VITE_CONVEX_URL);
```

**النتيجة المتوقعة:**
```
https://smiling-dinosaur-349.convex.cloud
```

**إذا ظهرت `undefined` = المتغير غير محمّل!** ❌

### اختبار 4: تجربة Dev Mode

1. افتح الموقع
2. يجب أن تدخل **بدون تسجيل دخول** (لأن `VITE_DEV_MODE=true`)
3. إذا طُلب منك تسجيل دخول = `VITE_DEV_MODE` غير محمّل

### اختبار 5: تجربة صفحة محمية

1. اذهب إلى: `https://your-site.pages.dev/payroll`
2. أدخل كلمة المرور: `Omar1010#`
3. يجب أن تدخل بنجاح ✅
4. إذا لم تعمل = `VITE_PAYROLL_PASSWORD` غير محمّل

---

## 🐛 حل المشاكل الشائعة

### المشكلة 1: "VITE_CONVEX_URL is not defined"

**السبب:** المتغير غير مضاف أو غير محمّل

**الحل:**
1. ✅ تأكد من إضافة المتغير في Cloudflare Pages
2. ✅ تأكد من اختيار "Production and Preview" (ليس Production فقط)
3. ✅ أعد النشر (Retry deployment)
4. ✅ امسح الكاش: Ctrl+Shift+R

---

### المشكلة 2: المتغيرات موجودة لكن لا تعمل

**السبب:** نوع البيئة خاطئ

**الحل:**
1. احذف جميع المتغيرات القديمة
2. أعد إضافتها واحداً واحداً
3. **تأكد من اختيار "Production and Preview"** لكل متغير
4. أعد النشر

---

### المشكلة 3: Build Log يعرض تحذيرات عن متغيرات غير معرّفة

**السبب:** المتغيرات المستخدمة في الكود غير موجودة

**الحل:**
```bash
# امسح المتغيرات غير المستخدمة من .env.local
# ثم أعد البناء
npm run build
```

---

### المشكلة 4: لا يمكن تسجيل الدخول (Hercules OIDC Error)

**السبب:** Hercules غير مُعَد أو غير ضروري

**الحل السريع:**
```env
# في Cloudflare Pages Environment Variables
VITE_DEV_MODE=true
```

**النتيجة:** تجاوز المصادقة كلياً (للتطوير) ✅

---

### المشكلة 5: "Infinite loop detected" في _redirects

**الحالة:** ✅ تم إصلاحها!

**الحل:** تم تحديث ملف `public/_redirects` باستخدام:
```
/assets/*  /assets/:splat  200
/*  /index.html  200!
```

---

## 📊 Checklist النهائي

### قبل النشر:
- [ ] ✅ أضفت جميع المتغيرات الخمسة
- [ ] ✅ اخترت "Production and Preview" لكل متغير
- [ ] ✅ حفظت التغييرات (Save)
- [ ] ✅ أعدت النشر (Retry deployment)

### بعد النشر:
- [ ] ✅ Build log خالٍ من الأخطاء
- [ ] ✅ لا توجد تحذيرات عن متغيرات غير معرّفة
- [ ] ✅ الموقع يفتح بدون أخطاء في Console
- [ ] ✅ `console.log(import.meta.env.VITE_CONVEX_URL)` يعرض الـ URL الصحيح
- [ ] ✅ يمكن الدخول للصفحة الرئيسية (بفضل Dev Mode)
- [ ] ✅ يمكن الدخول لصفحة Payroll بكلمة المرور

---

## 🔐 الأمان (للإنتاج)

### ⚠️ قبل النشر النهائي:

1. **غيّر `VITE_DEV_MODE` إلى `false`:**
   ```env
   VITE_DEV_MODE=false
   ```

2. **عيّن Hercules OIDC (إذا كنت تستخدمه):**
   ```env
   VITE_HERCULES_OIDC_AUTHORITY=https://accounts.hercules.app
   VITE_HERCULES_OIDC_CLIENT_ID=[your-actual-client-id]
   VITE_HERCULES_OIDC_SCOPE=openid profile email
   ```

3. **غيّر كلمات المرور:**
   ```env
   VITE_PAYROLL_PASSWORD=[كلمة-مرور-قوية]
   VITE_EMPLOYEES_PASSWORD=[كلمة-مرور-قوية-أخرى]
   ```

4. **في Convex Backend:**
   ```bash
   npx convex env set MANAGE_REQUESTS_PASSWORD "[كلمة-مرور-قوية-جداً]"
   ```

---

## 🎯 الخلاصة

| المتغير | القيمة الافتراضية | مطلوب؟ | الملاحظات |
|---------|-------------------|--------|-----------|
| `VITE_CONVEX_URL` | `https://smiling-dinosaur-349.convex.cloud` | ✅ نعم | لا تغيّره |
| `VITE_DEV_MODE` | `true` | ⚠️ للتطوير فقط | `false` للإنتاج |
| `VITE_PAYROLL_PASSWORD` | `Omar1010#` | ✅ نعم | غيّره في الإنتاج |
| `VITE_EMPLOYEES_PASSWORD` | `Omar1010#` | ✅ نعم | غيّره في الإنتاج |
| `VITE_APP_URL` | `https://your-site.pages.dev` | 📧 اختياري | للإشعارات |

---

## 🚀 خطوات سريعة للاختبار

```bash
# 1. افتح الموقع
https://your-site.pages.dev

# 2. افتح Console (F12)
console.log(import.meta.env.VITE_CONVEX_URL);
# يجب أن ترى: https://smiling-dinosaur-349.convex.cloud

# 3. افتح Console (F12)
console.log(import.meta.env.VITE_DEV_MODE);
# يجب أن ترى: true

# 4. جرب الدخول
# يجب أن تدخل بدون مصادقة ✅
```

---

**تم بواسطة:** Claude Code
**التاريخ:** 2025-10-25
**الحالة:** ✅ جاهز للاستخدام

---

## 📞 الدعم

إذا لا زالت لديك مشاكل بعد اتباع هذا الدليل:
1. ✅ تأكد من تنفيذ جميع الخطوات بالترتيب
2. ✅ راجع Checklist النهائي
3. ✅ تأكد من إعادة النشر بعد أي تغيير
4. ✅ امسح الكاش: Ctrl+Shift+R

**مبروك! كل شيء يجب أن يعمل الآن!** 🎉
