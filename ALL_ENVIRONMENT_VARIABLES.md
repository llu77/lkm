# 🔑 جميع المفاتيح والأسرار - Complete Environment Variables
## All Keys and Secrets for LKM HR System

**تاريخ:** 2025-10-25
**الحالة:** ✅ كامل وجاهز

---

## 📋 القائمة الكاملة

---

## 1️⃣ للـ Cloudflare Pages (Frontend)

### انسخ والصق هذه المتغيرات في Cloudflare Pages:

**الطريقة:**
1. اذهب إلى: https://dash.cloudflare.com/
2. Pages → مشروعك → **Settings** → **Environment variables**
3. اضغط **Add variable** لكل واحدة

---

### ✅ المتغيرات المطلوبة (Cloudflare Pages):

```env
# 1. Convex Backend URL (مطلوب!)
VITE_CONVEX_URL=https://smiling-dinosaur-349.convex.cloud

# 2. Development Mode (للتجربة فقط - ضعه true للتجاوز المصادقة)
VITE_DEV_MODE=true

# 3. كلمات المرور للصفحات المحمية
VITE_PAYROLL_PASSWORD=Omar1010#
VITE_EMPLOYEES_PASSWORD=Omar1010#

# 4. Hercules OIDC Authentication (اختياري - إذا كنت تستخدم Hercules)
VITE_HERCULES_OIDC_AUTHORITY=https://accounts.hercules.app
VITE_HERCULES_OIDC_CLIENT_ID=your-client-id-here
VITE_HERCULES_OIDC_PROMPT=select_account
VITE_HERCULES_OIDC_RESPONSE_TYPE=code
VITE_HERCULES_OIDC_SCOPE=openid profile email
```

---

### 📝 جدول المتغيرات للنسخ السريع:

| Variable Name | Value | مطلوب؟ |
|--------------|-------|--------|
| `VITE_CONVEX_URL` | `https://smiling-dinosaur-349.convex.cloud` | ✅ **إجباري** |
| `VITE_DEV_MODE` | `true` | ✅ **مهم للتجربة** |
| `VITE_PAYROLL_PASSWORD` | `Omar1010#` | ✅ **إجباري** |
| `VITE_EMPLOYEES_PASSWORD` | `Omar1010#` | ✅ **إجباري** |
| `VITE_HERCULES_OIDC_AUTHORITY` | `https://accounts.hercules.app` | ⚠️ اختياري |
| `VITE_HERCULES_OIDC_CLIENT_ID` | `your-client-id-here` | ⚠️ اختياري |
| `VITE_HERCULES_OIDC_PROMPT` | `select_account` | ⚠️ اختياري |
| `VITE_HERCULES_OIDC_RESPONSE_TYPE` | `code` | ⚠️ اختياري |
| `VITE_HERCULES_OIDC_SCOPE` | `openid profile email` | ⚠️ اختياري |

---

## 2️⃣ للـ Convex Backend

### شغّل هذا الأمر في Terminal:

```bash
npx convex env set MANAGE_REQUESTS_PASSWORD "Omar1010#"
```

**ملاحظة:** هذا يُنفذ **مرة واحدة فقط**!

---

### 📝 جدول Convex Secrets:

| Variable Name | Value | الأمر |
|--------------|-------|-------|
| `MANAGE_REQUESTS_PASSWORD` | `Omar1010#` | `npx convex env set MANAGE_REQUESTS_PASSWORD "Omar1010#"` |

---

## 3️⃣ للـ Development المحلي (.env.local)

### إذا كنت تشتغل محلياً، استخدم هذا الملف:

**الملف:** `.env.local`

```env
# Development Mode
VITE_DEV_MODE=true

# Convex Backend
VITE_CONVEX_URL=https://smiling-dinosaur-349.convex.cloud
CONVEX_DEPLOYMENT=eyJ2MiI6IjM5YTQ2NmYzZWQ5YTRmZDViZDczNjQzZmI1ODkzMTNhIn0=

# Hercules OIDC (اختياري)
VITE_HERCULES_OIDC_AUTHORITY=https://accounts.hercules.app
VITE_HERCULES_OIDC_CLIENT_ID=your-client-id-here
VITE_HERCULES_OIDC_PROMPT=select_account
VITE_HERCULES_OIDC_RESPONSE_TYPE=code
VITE_HERCULES_OIDC_SCOPE=openid profile email

# كلمات المرور (للتطوير فقط)
VITE_MANAGE_REQUESTS_PASSWORD=Omar1010#
VITE_PAYROLL_PASSWORD=Omar1010#
VITE_EMPLOYEES_PASSWORD=Omar1010#
```

**⚠️ ملاحظة:** `VITE_MANAGE_REQUESTS_PASSWORD` تُستخدم فقط في Development المحلي، **ليست مطلوبة** في Cloudflare!

---

## 🔐 ملاحظات الأمان

### كلمات المرور الحالية:

```
Omar1010#
```

**⚠️ توصيات:**
- هذه كلمة مرور ضعيفة للإنتاج!
- يُفضل تغييرها لكلمة أقوى مثل:
  - `MyStr0ng!Pass@2025`
  - `SecureHR#System$123`

### كيف تغير كلمات المرور:

#### 1. في Cloudflare:
- غيّر قيمة `VITE_PAYROLL_PASSWORD`
- غيّر قيمة `VITE_EMPLOYEES_PASSWORD`

#### 2. في Convex:
```bash
npx convex env set MANAGE_REQUESTS_PASSWORD "كلمة-المرور-الجديدة"
```

---

## 📋 خطوات إضافة المتغيرات في Cloudflare

### الطريقة التفصيلية:

1. **افتح Cloudflare Dashboard:**
   ```
   https://dash.cloudflare.com/
   ```

2. **اذهب إلى مشروعك:**
   - Workers & Pages
   - اختر مشروع `lkm-hr-system` (أو اسم مشروعك)

3. **Settings → Environment variables:**
   - اضغط **Add variable**

4. **أضف كل متغير:**

   **المتغير الأول:**
   ```
   Variable name: VITE_CONVEX_URL
   Value: https://smiling-dinosaur-349.convex.cloud
   ```

   **المتغير الثاني:**
   ```
   Variable name: VITE_DEV_MODE
   Value: true
   ```

   **المتغير الثالث:**
   ```
   Variable name: VITE_PAYROLL_PASSWORD
   Value: Omar1010#
   ```

   **المتغير الرابع:**
   ```
   Variable name: VITE_EMPLOYEES_PASSWORD
   Value: Omar1010#
   ```

5. **احفظ:**
   - اضغط **Save**

6. **Redeploy:**
   - اذهب إلى **Deployments**
   - اضغط **Retry deployment** على آخر deployment

---

## ⚡ Quick Copy (للنسخ السريع)

### انسخ هذا النص كاملاً والصقه في Cloudflare:

```
VITE_CONVEX_URL=https://smiling-dinosaur-349.convex.cloud
VITE_DEV_MODE=true
VITE_PAYROLL_PASSWORD=Omar1010#
VITE_EMPLOYEES_PASSWORD=Omar1010#
```

**ملاحظة:** Cloudflare لا يسمح بنسخ متعدد، يجب إدخال كل واحد على حدة.

---

## 🎯 المتغيرات حسب الأهمية

### ⭐ إجبارية (لا يعمل بدونها):

```env
VITE_CONVEX_URL=https://smiling-dinosaur-349.convex.cloud
```

### 🔑 مهمة جداً (للمصادقة):

```env
VITE_DEV_MODE=true
VITE_PAYROLL_PASSWORD=Omar1010#
VITE_EMPLOYEES_PASSWORD=Omar1010#
```

### ⚙️ اختيارية (Hercules OIDC):

```env
VITE_HERCULES_OIDC_AUTHORITY=https://accounts.hercules.app
VITE_HERCULES_OIDC_CLIENT_ID=your-client-id-here
VITE_HERCULES_OIDC_SCOPE=openid profile email
```

**إذا لم تستخدم Hercules:** لا تضيف هذه المتغيرات!

---

## 🔍 كيف تتحقق أن المتغيرات موجودة؟

### في Cloudflare Pages:

1. Settings → Environment variables
2. يجب أن ترى:
   ```
   ✅ VITE_CONVEX_URL
   ✅ VITE_DEV_MODE
   ✅ VITE_PAYROLL_PASSWORD
   ✅ VITE_EMPLOYEES_PASSWORD
   ```

### في Convex:

```bash
npx convex env list
```

يجب أن ترى:
```
✅ MANAGE_REQUESTS_PASSWORD
```

---

## 🚨 مشاكل شائعة وحلولها

### المشكلة 1: Login error

**السبب:** `VITE_CONVEX_URL` غير موجود

**الحل:**
```env
VITE_CONVEX_URL=https://smiling-dinosaur-349.convex.cloud
```

---

### المشكلة 2: Cannot connect to database

**السبب:** `VITE_CONVEX_URL` خطأ

**الحل:** تأكد أنه:
```
https://smiling-dinosaur-349.convex.cloud
```
(بدون مسافات أو أحرف زائدة)

---

### المشكلة 3: Manage Requests password not working

**السبب:** لم تُعيّن في Convex

**الحل:**
```bash
npx convex env set MANAGE_REQUESTS_PASSWORD "Omar1010#"
```

---

## 📝 Checklist النهائي

قبل Redeploy، تأكد:

- [ ] ✅ أضفت `VITE_CONVEX_URL` في Cloudflare
- [ ] ✅ أضفت `VITE_DEV_MODE=true` في Cloudflare
- [ ] ✅ أضفت `VITE_PAYROLL_PASSWORD` في Cloudflare
- [ ] ✅ أضفت `VITE_EMPLOYEES_PASSWORD` في Cloudflare
- [ ] ✅ شغلت `npx convex env set MANAGE_REQUESTS_PASSWORD`
- [ ] ✅ حفظت التغييرات في Cloudflare
- [ ] ✅ ضغطت Retry deployment

---

## 🎉 بعد الانتهاء

بعد إضافة جميع المتغيرات و Redeploy:

1. ✅ افتح موقعك: `https://your-site.pages.dev`
2. ✅ يجب أن يعمل مباشرة (لأن `VITE_DEV_MODE=true`)
3. ✅ جرب صفحة `/manage-requests` وأدخل: `Omar1010#`
4. ✅ يجب أن يعمل كل شيء!

---

## 🔒 للإنتاج (Production)

عندما تكون جاهزاً للنشر الفعلي:

1. **غيّر `VITE_DEV_MODE` إلى `false`:**
   ```env
   VITE_DEV_MODE=false
   ```

2. **غيّر كلمات المرور لكلمات أقوى:**
   ```env
   VITE_PAYROLL_PASSWORD=كلمة-قوية-جديدة
   VITE_EMPLOYEES_PASSWORD=كلمة-قوية-أخرى
   ```

3. **في Convex أيضاً:**
   ```bash
   npx convex env set MANAGE_REQUESTS_PASSWORD "كلمة-قوية-ثالثة"
   ```

---

## 💾 احفظ هذا الملف!

هذا الملف يحتوي على جميع المفاتيح والأسرار.

**مهم:**
- ❌ لا ترفعه على GitHub!
- ✅ احفظه في مكان آمن
- ✅ استخدمه عند الحاجة

---

**تم إنشاؤه بواسطة:** Claude Code
**التاريخ:** 2025-10-25
