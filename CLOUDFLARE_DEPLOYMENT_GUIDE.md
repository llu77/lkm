# دليل النشر على Cloudflare Pages

هذا الدليل يشرح كيفية نشر مشروع lkm على Cloudflare Pages.

---

## ✅ المتطلبات الأولية

1. **حساب Cloudflare** (مجاني)
   - قم بالتسجيل على: https://dash.cloudflare.com/sign-up

2. **Convex Deployment** (يجب أن يكون موجوداً)
   - احصل على URL من: https://dashboard.convex.dev/

3. **Git Repository**
   - المشروع يجب أن يكون على GitHub/GitLab

---

## 📋 الطريقة الأولى: النشر عبر Cloudflare Dashboard (الأسهل)

### الخطوة 1: ربط Git Repository

1. اذهب إلى: https://dash.cloudflare.com/
2. من القائمة الجانبية، اختر **Pages**
3. اضغط على **Create a project**
4. اختر **Connect to Git**
5. اختر **GitHub** أو **GitLab**
6. اختر repository: `lkm`

### الخطوة 2: Build Settings

في صفحة Build Configuration، أدخل:

```
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: (اتركه فارغاً)
```

**إعدادات Build المتقدمة:**
- Node.js version: **18** أو أحدث
- Environment variables: أضفها في الخطوة التالية

### الخطوة 3: Environment Variables

أضف المتغيرات التالية:

**المتغيرات المطلوبة:**
```
VITE_CONVEX_URL=<your-convex-deployment-url>
VITE_EMPLOYEES_PASSWORD=<your-secure-password>
VITE_PAYROLL_PASSWORD=<your-secure-password>
VITE_MANAGE_REQUESTS_PASSWORD=<your-secure-password>
```

**كيفية الحصول على `VITE_CONVEX_URL`:**
1. اذهب إلى: https://dashboard.convex.dev/
2. اختر مشروعك
3. من Settings → Deployment URL
4. انسخ الـ URL

### الخطوة 4: Deploy!

1. اضغط **Save and Deploy**
2. انتظر حتى يكتمل البناء (عادة 2-3 دقائق)
3. ستحصل على URL مثل: `https://lkm-hr-system.pages.dev`

---

## 🚀 الطريقة الثانية: النشر عبر Wrangler CLI

### الخطوة 1: تثبيت Wrangler

```bash
npm install -g wrangler
```

### الخطوة 2: تسجيل الدخول

```bash
wrangler login
```
سيفتح متصفح للمصادقة.

### الخطوة 3: بناء المشروع

```bash
npm run build
```

### الخطوة 4: النشر

```bash
wrangler pages deploy dist --project-name=lkm-hr-system
```

**في المرة الأولى، سيطلب منك:**
1. إنشاء مشروع جديد
2. ربطه بـ Git (اختياري)

### الخطوة 5: إضافة Environment Variables

```bash
# إضافة متغير واحد
wrangler pages secret put VITE_CONVEX_URL

# سيطلب منك إدخال القيمة بشكل آمن
```

كرر الأمر لكل متغير:
- `VITE_CONVEX_URL`
- `VITE_EMPLOYEES_PASSWORD`
- `VITE_PAYROLL_PASSWORD`
- `VITE_MANAGE_REQUESTS_PASSWORD`

---

## 🔄 الطريقة الثالثة: النشر التلقائي عبر GitHub Actions

تم إنشاء ملف `.github/workflows/cloudflare-deploy.yml` جاهز للاستخدام!

### الخطوة 1: إضافة Secrets في GitHub

1. اذهب إلى GitHub Repository
2. Settings → Secrets and variables → Actions
3. اضغط **New repository secret**
4. أضف الـ secrets التالية:

**المطلوب:**
```
CLOUDFLARE_API_TOKEN=<your-cloudflare-api-token>
CLOUDFLARE_ACCOUNT_ID=<your-cloudflare-account-id>
VITE_CONVEX_URL=<your-convex-deployment-url>
VITE_EMPLOYEES_PASSWORD=<your-secure-password>
VITE_PAYROLL_PASSWORD=<your-secure-password>
VITE_MANAGE_REQUESTS_PASSWORD=<your-secure-password>
```

**كيفية الحصول على `CLOUDFLARE_API_TOKEN`:**
1. اذهب إلى: https://dash.cloudflare.com/profile/api-tokens
2. اضغط **Create Token**
3. استخدم Template: **Edit Cloudflare Workers**
4. أو أنشئ Custom Token مع:
   - Permissions: `Account → Cloudflare Pages → Edit`
5. انسخ الـ Token (يظهر مرة واحدة فقط!)

**كيفية الحصول على `CLOUDFLARE_ACCOUNT_ID`:**
1. اذهب إلى: https://dash.cloudflare.com/
2. من القائمة الجانبية، اختر **Pages**
3. ستجد Account ID في الـ URL: `dash.cloudflare.com/<ACCOUNT_ID>/pages`
4. أو من: Workers & Pages → Overview → Account ID

### الخطوة 2: Push إلى Main Branch

```bash
git add .
git commit -m "Setup Cloudflare deployment"
git push origin main
```

**سيتم النشر تلقائياً!** 🎉

يمكنك متابعة التقدم من:
- GitHub: Actions tab
- Cloudflare: Pages → Deployments

---

## 🧪 اختبار بعد النشر

### 1. تحقق من الصفحة الرئيسية
```
https://your-app.pages.dev
```
يجب أن تظهر صفحة تسجيل الدخول.

### 2. اختبار Routing
جرب:
```
https://your-app.pages.dev/revenues
https://your-app.pages.dev/expenses
https://your-app.pages.dev/employees
```
يجب أن تعمل جميع الروابط بدون 404.

### 3. اختبار Convex Connection
1. افتح Console: F12 → Console
2. يجب أن ترى: `Connected to Convex`
3. لا يجب أن ترى أخطاء CORS

### 4. اختبار المصادقة
1. جرب تسجيل الدخول
2. تحقق من أن Clerk/Auth يعمل

---

## ⚙️ إعدادات متقدمة

### Custom Domain

1. في Cloudflare Pages → Your Project → Custom domains
2. اضغط **Set up a custom domain**
3. أدخل نطاقك: `hr.yourcompany.com`
4. اتبع التعليمات لإضافة DNS records

### Preview Deployments

Cloudflare تنشئ تلقائياً preview لكل:
- Pull Request
- Branch غير main

يمكنك الوصول إليها من:
```
https://abc123.lkm-hr-system.pages.dev
```

### Rollback

للعودة إلى نشر سابق:
1. Pages → Your Project → Deployments
2. اختر deployment قديم
3. اضغط **Rollback to this deployment**

---

## 🔧 استكشاف الأخطاء

### مشكلة: Build فشل

**الأخطاء الشائعة:**

1. **"command not found: npm"**
   - الحل: تأكد من Node.js version = 18 في Build settings

2. **"Cannot find module '@/...' "**
   - الحل: تأكد من أن `vite.config.ts` يحتوي على alias settings

3. **"Out of memory"**
   - الحل: أضف إلى `package.json`:
   ```json
   "build": "NODE_OPTIONS=--max-old-space-size=4096 vite build"
   ```

### مشكلة: الموقع يعمل لكن Convex لا يتصل

**الحل:**

1. تحقق من `VITE_CONVEX_URL` في Environment Variables
2. يجب أن تبدأ بـ: `https://` وتنتهي بـ `.convex.cloud`
3. لا تضع `/` في النهاية

### مشكلة: 404 عند Refresh الصفحة

**الحل:**

تأكد من وجود ملف `public/_redirects`:
```
/*    /index.html   200
```

### مشكلة: الإيميلات لا تُرسل

**ليست مشكلة!**

الإيميلات تعمل على **Convex backend** وليس Cloudflare.
- تأكد من `RESEND_API_KEY` موجود في **Convex Dashboard**
- ليس في Cloudflare Pages!

---

## 📊 المراقبة والتحليلات

### Cloudflare Analytics

1. Pages → Your Project → Analytics
2. ستجد:
   - عدد الزيارات
   - Bandwidth المستخدم
   - البلدان
   - أخطاء 4xx/5xx

### Convex Logs

1. اذهب إلى: https://dashboard.convex.dev/
2. Logs → Function Logs
3. راقب:
   - Email sending
   - Cron jobs
   - Errors

---

## 💰 التكاليف

### Cloudflare Pages (Free Tier)
- ✅ Unlimited requests
- ✅ Unlimited bandwidth
- ✅ 500 builds/month
- ✅ Concurrent builds: 1

**كافٍ تماماً للمشروع!**

### Convex (Free Tier)
- ✅ 1 GB storage
- ✅ 1 GB bandwidth/day
- ✅ Unlimited function calls

**كافٍ تماماً للمشروع!**

### Resend (Free Tier)
- ✅ 100 emails/day
- ✅ 3,000 emails/month

**المشروع يستخدم ~90 email/month = 3% فقط**

---

## 🎯 الخلاصة

المشروع **جاهز 100%** للنشر على Cloudflare Pages!

**الملفات الجاهزة:**
- ✅ `vite.config.ts` - إعدادات البناء
- ✅ `public/_redirects` - SPA routing
- ✅ `public/_headers` - Security headers
- ✅ `wrangler.toml` - CLI deployment
- ✅ `.github/workflows/cloudflare-deploy.yml` - CI/CD
- ✅ `.env.production` - متغيرات الإنتاج (reference)

**ما عليك فعله:**
1. اختر طريقة النشر (Dashboard أو CLI أو GitHub Actions)
2. أضف Environment Variables
3. Deploy!

🚀 **بالتوفيق!**

---

**تم إنشاء هذا الدليل بواسطة:** Claude Code
**التاريخ:** 2025-10-24
