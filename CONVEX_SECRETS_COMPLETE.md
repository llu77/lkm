# 🔐 جميع الأسرار المطلوبة في Convex
## Complete Convex Secrets Guide

**تاريخ:** 2025-10-25

---

## ⚠️ مهم جداً!

هناك **أسرار إضافية** يجب إضافتها في Convex Backend!

---

## 🔑 الأسرار المطلوبة في Convex

### ✅ 1. كلمة مرور إدارة الطلبات (إجباري)

```bash
npx convex env set MANAGE_REQUESTS_PASSWORD "Omar1010#"
```

**الاستخدام:** التحقق من كلمة المرور في صفحة إدارة الطلبات

---

### 📧 2. إيميلات المشرفين (مهم للتقارير)

```bash
# إيميل مشرف فرع لبن (1010)
npx convex env set SUPERVISOR_EMAIL_1010 "labn@example.com"

# إيميل مشرف فرع طويق (2020)
npx convex env set SUPERVISOR_EMAIL_2020 "tuwaiq@example.com"

# إيميل افتراضي (للنسخ الاحتياطية)
npx convex env set DEFAULT_SUPERVISOR_EMAIL "admin@company.com"
```

**⚠️ مهم:** غيّر هذه الإيميلات لإيميلات حقيقية!

**الاستخدام:**
- إرسال تقارير مسيرات الرواتب
- إرسال تقارير يومية وشهرية
- إشعارات مهمة

---

### 🤖 3. Anthropic API Key (للذكاء الاصطناعي - اختياري)

```bash
npx convex env set ANTHROPIC_API_KEY "sk-ant-api03-xxxxx"
```

**للحصول على API Key:**
1. اذهب إلى: https://console.anthropic.com/
2. سجل حساب جديد
3. اذهب إلى API Keys
4. أنشئ key جديد
5. انسخه وضعه هنا

**الاستخدام:**
- تحليل البيانات المالية
- إنشاء تقارير ذكية
- الإشعارات الذكية

**⚠️ ملاحظة:** اختياري - النظام يعمل بدونه لكن بدون ميزات AI

---

### 📮 4. Resend API Key (لإرسال البريد - مهم!)

```bash
npx convex env set RESEND_API_KEY "re_xxxxx"
```

**للحصول على API Key:**
1. اذهب إلى: https://resend.com/
2. سجل حساب جديد (مجاني)
3. اذهب إلى API Keys
4. أنشئ key جديد
5. انسخه وضعه هنا

**الاستخدام:**
- إرسال مسيرات الرواتب عبر البريد
- إرسال التقارير اليومية والشهرية
- إشعارات البريد الإلكتروني

**⚠️ مهم:** بدون هذا الـ key، لن يتم إرسال أي إيميلات!

---

### 🌐 5. رابط التطبيق (للإيميلات)

```bash
# بعد النشر على Cloudflare، ضع الرابط الحقيقي
npx convex env set VITE_APP_URL "https://your-site.pages.dev"
```

**مثال:**
```bash
npx convex env set VITE_APP_URL "https://lkm-hr-system.pages.dev"
```

**الاستخدام:** روابط في الإيميلات للعودة للنظام

---

### 🔧 6. Zapier Webhook (اختياري - للتكاملات)

```bash
npx convex env set ZAPIER_WEBHOOK_URL "https://hooks.zapier.com/hooks/catch/xxxxx"
```

**الاستخدام:**
- تكامل مع أنظمة خارجية
- أتمتة إضافية

**⚠️ ملاحظة:** اختياري - فقط إذا كنت تستخدم Zapier

---

### 📄 7. PDF.co API Key (اختياري - لـ PDF متقدم)

```bash
npx convex env set PDFCO_API_KEY "xxxxx"
```

**للحصول على API Key:**
https://pdf.co/

**الاستخدام:** إنشاء PDF احترافي (النظام يستخدم jsPDF افتراضياً)

**⚠️ ملاحظة:** اختياري تماماً - النظام لديه PDF generator مدمج

---

## 📋 ملخص الأولويات

### 🔴 **إجباري (يجب إضافته):**

```bash
npx convex env set MANAGE_REQUESTS_PASSWORD "Omar1010#"
```

---

### 🟡 **مهم جداً (للتقارير والإيميلات):**

```bash
npx convex env set SUPERVISOR_EMAIL_1010 "labn@example.com"
npx convex env set SUPERVISOR_EMAIL_2020 "tuwaiq@example.com"
npx convex env set DEFAULT_SUPERVISOR_EMAIL "admin@company.com"
npx convex env set RESEND_API_KEY "re_xxxxx"
npx convex env set VITE_APP_URL "https://your-site.pages.dev"
```

---

### 🟢 **اختياري (ميزات إضافية):**

```bash
npx convex env set ANTHROPIC_API_KEY "sk-ant-api03-xxxxx"
npx convex env set ZAPIER_WEBHOOK_URL "https://hooks.zapier.com/hooks/catch/xxxxx"
npx convex env set PDFCO_API_KEY "xxxxx"
```

---

## ⚡ النسخة السريعة (انسخ والصق كل شيء)

### الأساسيات (نفذها الآن):

```bash
# 1. كلمة المرور (إجباري)
npx convex env set MANAGE_REQUESTS_PASSWORD "Omar1010#"

# 2. الإيميلات (غيّر للإيميلات الحقيقية!)
npx convex env set SUPERVISOR_EMAIL_1010 "labn@company.com"
npx convex env set SUPERVISOR_EMAIL_2020 "tuwaiq@company.com"
npx convex env set DEFAULT_SUPERVISOR_EMAIL "admin@company.com"

# 3. رابط الموقع (بعد النشر، غيّره للرابط الحقيقي)
npx convex env set VITE_APP_URL "https://your-site.pages.dev"
```

### إضافي (بعد الحصول على API Keys):

```bash
# Resend API Key (للإيميلات)
npx convex env set RESEND_API_KEY "re_xxxxx"

# Anthropic API Key (للذكاء الاصطناعي - اختياري)
npx convex env set ANTHROPIC_API_KEY "sk-ant-api03-xxxxx"
```

---

## 🔍 كيف تتحقق من الأسرار المضافة؟

```bash
npx convex env list
```

**يجب أن ترى:**
```
✓ MANAGE_REQUESTS_PASSWORD
✓ SUPERVISOR_EMAIL_1010
✓ SUPERVISOR_EMAIL_2020
✓ DEFAULT_SUPERVISOR_EMAIL
✓ VITE_APP_URL
✓ RESEND_API_KEY (إذا أضفته)
✓ ANTHROPIC_API_KEY (إذا أضفته)
```

---

## 📧 الحصول على Resend API Key (مجاني!)

### خطوات بسيطة:

1. **اذهب إلى:** https://resend.com/signup

2. **سجل حساب جديد** (مجاني 100%)

3. **في Dashboard:**
   - اضغط **API Keys**
   - اضغط **Create API Key**
   - اسم: `LKM HR System`
   - Permissions: `Full Access` أو `Sending access`
   - اضغط **Add**

4. **انسخ الـ Key:**
   ```
   re_xxxxxxxxxxxxx
   ```

5. **أضفه في Convex:**
   ```bash
   npx convex env set RESEND_API_KEY "re_xxxxxxxxxxxxx"
   ```

6. **تحقق من Domain:**
   - في Resend Dashboard → Domains
   - يمكنك استخدام: `onboarding@resend.dev` (مجاني للتجربة)
   - أو أضف domain خاص بك

**الحد المجاني:**
- 100 إيميل/يوم
- 3000 إيميل/شهر
- مثالي للبداية!

---

## 🤖 الحصول على Anthropic API Key

### خطوات:

1. **اذهب إلى:** https://console.anthropic.com/

2. **سجل حساب**

3. **في Console:**
   - Settings → API Keys
   - Create Key
   - انسخ الـ key

4. **أضفه:**
   ```bash
   npx convex env set ANTHROPIC_API_KEY "sk-ant-api03-xxxxx"
   ```

**الحد المجاني:**
- $5 رصيد مجاني للتجربة
- Pay-as-you-go بعد ذلك

---

## ⚠️ ملاحظات أمان

### 🔒 هذه أسرار - لا تشاركها!

- ❌ لا ترفعها على GitHub
- ❌ لا تشاركها في Discord/Slack
- ✅ احفظها في مكان آمن
- ✅ استخدم Password Manager

### 🔄 في حالة تسريب API Key:

1. احذفها فوراً من الموقع الأصلي
2. أنشئ key جديد
3. حدّث في Convex:
   ```bash
   npx convex env set KEY_NAME "new-key-value"
   ```

---

## 🎯 Checklist النهائي

قبل النشر النهائي، تأكد:

### Frontend (Cloudflare):
- [ ] ✅ `VITE_CONVEX_URL`
- [ ] ✅ `VITE_DEV_MODE`
- [ ] ✅ `VITE_PAYROLL_PASSWORD`
- [ ] ✅ `VITE_EMPLOYEES_PASSWORD`

### Backend (Convex):
- [ ] ✅ `MANAGE_REQUESTS_PASSWORD`
- [ ] ✅ `SUPERVISOR_EMAIL_1010`
- [ ] ✅ `SUPERVISOR_EMAIL_2020`
- [ ] ✅ `DEFAULT_SUPERVISOR_EMAIL`
- [ ] ✅ `VITE_APP_URL`
- [ ] 🟡 `RESEND_API_KEY` (مهم للإيميلات)
- [ ] 🟢 `ANTHROPIC_API_KEY` (اختياري)

---

## 🚀 بعد إضافة كل الأسرار

النظام سيكون جاهز 100%:
- ✅ المصادقة تعمل
- ✅ الإيميلات تُرسل
- ✅ التقارير تصل للمشرفين
- ✅ الميزات الذكية نشطة (إذا أضفت Anthropic)

---

## 💡 نصيحة أخيرة

ابدأ بالأساسيات أولاً:
1. ✅ `MANAGE_REQUESTS_PASSWORD`
2. ✅ الإيميلات الثلاثة
3. ✅ `VITE_APP_URL`

ثم أضف `RESEND_API_KEY` عندما تكون جاهزاً لإرسال الإيميلات.

باقي الـ keys اختيارية - يمكنك إضافتها لاحقاً!

---

**تم إنشاؤه بواسطة:** Claude Code
**التاريخ:** 2025-10-25
