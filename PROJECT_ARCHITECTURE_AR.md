# 🏗️ بنية المشروع - أين يُنشر كل شيء؟
## Project Architecture - Where Everything is Deployed

**تاريخ:** 2025-10-25

---

## 🎯 الإجابة المختصرة:

البرنامج **مقسم إلى جزئين** ويُنشر في **مكانين مختلفين**:

| الجزء | أين يُنشر | الوصف |
|------|-----------|-------|
| **Frontend** (واجهة المستخدم) | ☁️ **Cloudflare Pages** | الصفحات والأزرار والمظهر |
| **Backend** (قاعدة البيانات والمنطق) | 🔧 **Convex Cloud** | البيانات والحسابات والأمان |

---

## 📂 تفصيل المشروع:

### مجلدات المشروع:

```
/home/user/lkm/
├── src/                    ← Frontend (React)
│   ├── pages/             ← الصفحات
│   ├── components/        ← المكونات
│   └── main.tsx           ← نقطة البداية
│
├── convex/                 ← Backend (Convex)
│   ├── schema.ts          ← بنية قاعدة البيانات
│   ├── employees.ts       ← وظائف الموظفين
│   ├── payroll.ts         ← وظائف الرواتب
│   └── zapier.ts          ← التكاملات
│
├── public/                 ← ملفات ثابتة
│   └── _redirects         ← إعدادات Cloudflare
│
├── dist/                   ← ناتج البناء (للنشر)
├── package.json           ← إعدادات المشروع
└── .env.local             ← متغيرات التطوير المحلي
```

---

## 🔄 كيف يعمل النظام:

### البنية الكاملة:

```
┌─────────────────────────────────────────────────────────────┐
│                         المستخدم                            │
│                    (متصفح الويب)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              ☁️ Cloudflare Pages                            │
│           (Frontend - واجهة المستخدم)                       │
│                                                             │
│  📁 مجلد src/                                               │
│  - الصفحات (pages/)                                         │
│  - المكونات (components/)                                   │
│  - React + TypeScript                                       │
│                                                             │
│  📦 بعد البناء:                                             │
│  - index.html, JavaScript, CSS                             │
│  - يُنشر على: your-site.pages.dev                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ API Calls
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              🔧 Convex Cloud                                │
│            (Backend - الخادم)                               │
│                                                             │
│  📁 مجلد convex/                                            │
│  - قاعدة البيانات (18 جدول)                                │
│  - المنطق البرمجي (mutations, queries)                      │
│  - الأمان والتحقق                                           │
│                                                             │
│  🌐 يعمل على:                                               │
│  - smiling-dinosaur-349.convex.cloud                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Frontend - Cloudflare Pages

### ما هو؟

**الواجهة** التي يراها المستخدم - الصفحات، الأزرار، القوائم، إلخ.

### المكونات:

```
src/
├── pages/
│   ├── dashboard/         ← لوحة التحكم
│   ├── employees/         ← صفحة الموظفين
│   ├── payroll/           ← صفحة الرواتب
│   ├── revenues/          ← صفحة الإيرادات
│   └── manage-requests/   ← صفحة الطلبات
│
├── components/
│   ├── ui/                ← مكونات الواجهة
│   └── ...
│
└── main.tsx               ← نقطة البداية
```

### التقنيات:

- **React** - مكتبة بناء الواجهات
- **TypeScript** - لغة البرمجة
- **Vite** - أداة البناء
- **Tailwind CSS** - التصميم

### أين يُنشر؟

```
☁️ Cloudflare Pages
URL: https://your-site.pages.dev
```

### كيف يُنشر؟

```bash
# 1. البناء محلياً
npm run build
# ينتج: dist/ (ملفات HTML, JS, CSS)

# 2. Cloudflare Pages يسحب من Git
# - يراقب التغييرات في الفرع
# - يبني تلقائياً: npm run build
# - ينشر: محتوى مجلد dist/
```

### المتغيرات المطلوبة في Cloudflare:

```env
VITE_CONVEX_URL=https://smiling-dinosaur-349.convex.cloud
VITE_DEV_MODE=true
VITE_PAYROLL_PASSWORD=Omar1010#
VITE_EMPLOYEES_PASSWORD=Omar1010#
VITE_APP_URL=https://your-site.pages.dev
```

---

## 2️⃣ Backend - Convex Cloud

### ما هو؟

**الخادم** - قاعدة البيانات، المنطق البرمجي، الأمان، الحسابات.

### المكونات:

```
convex/
├── schema.ts              ← بنية قاعدة البيانات (18 جدول)
├── employees.ts           ← إدارة الموظفين
├── payroll.ts             ← حساب الرواتب
├── revenues.ts            ← إدارة الإيرادات
├── expenses.ts            ← إدارة المصاريف
├── employeeRequests.ts    ← طلبات الموظفين
├── zapier.ts              ← التكاملات
├── emailSystem.ts         ← نظام الإيميلات
└── setup.ts               ← إعداد البيانات
```

### قاعدة البيانات:

```
18 جدول:
- branches            ← الفروع
- employees           ← الموظفين
- payrollRecords      ← مسيرات الرواتب
- advances            ← السلف
- deductions          ← الخصومات
- bonuses             ← المكافآت
- revenues            ← الإيرادات
- expenses            ← المصاريف
- employeeRequests    ← طلبات الموظفين
- ... وغيرها
```

### أين يعمل؟

```
🔧 Convex Cloud
URL: https://smiling-dinosaur-349.convex.cloud
Dashboard: https://dashboard.convex.dev
```

### كيف يُنشر؟

```bash
# Convex يُنشر تلقائياً عند:
npx convex dev      # للتطوير
npx convex deploy   # للإنتاج

# أو تلقائياً عند Push إلى Git
# (إذا كان Convex مرتبط بـ GitHub)
```

### المتغيرات المطلوبة في Convex:

```bash
# كلمات المرور
npx convex env set MANAGE_REQUESTS_PASSWORD "Omar1010#"

# الإيميلات
npx convex env set SUPERVISOR_EMAIL_1010 "labn@company.com"
npx convex env set SUPERVISOR_EMAIL_2020 "tuwaiq@company.com"
npx convex env set DEFAULT_SUPERVISOR_EMAIL "admin@company.com"

# المفاتيح الاختيارية
npx convex env set RESEND_API_KEY "re_xxxxx"
npx convex env set ZAPIER_WEBHOOK_URL "https://hooks.zapier.com/..."
npx convex env set ANTHROPIC_API_KEY "sk-ant-api03-xxxxx"
```

---

## 🔗 كيف يتواصل Frontend و Backend؟

### الاتصال:

```typescript
// في Frontend (src/):
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// استدعاء بيانات من Backend
const employees = useQuery(api.employees.getAll);

// إرسال بيانات إلى Backend
const addEmployee = useMutation(api.employees.create);
```

### كيف يعمل؟

```
1. Frontend (Cloudflare) يستدعي:
   api.employees.getAll()

2. يُرسل طلب HTTP إلى:
   https://smiling-dinosaur-349.convex.cloud/api/employees/getAll

3. Backend (Convex) يعالج الطلب:
   - يتحقق من الصلاحيات
   - يقرأ من قاعدة البيانات
   - يُرجع البيانات

4. Frontend يستقبل النتيجة ويعرضها
```

---

## 🌐 رحلة المستخدم الكاملة:

```
المستخدم
    ↓
1. يفتح المتصفح:
   https://your-site.pages.dev

2. Cloudflare Pages يُرسل:
   - index.html
   - JavaScript files
   - CSS files

3. المتصفح يعرض الواجهة (Frontend)

4. المستخدم يضغط "عرض الموظفين"

5. Frontend يستدعي:
   api.employees.getAll()

6. طلب HTTP يُرسل إلى:
   https://smiling-dinosaur-349.convex.cloud

7. Convex Backend:
   - يتحقق من الصلاحيات
   - يقرأ البيانات من قاعدة البيانات
   - يُرجع JSON

8. Frontend يستقبل البيانات

9. المتصفح يعرض قائمة الموظفين
```

---

## 📊 جدول المقارنة الشامل:

| المقارنة | Frontend (Cloudflare) | Backend (Convex) |
|----------|----------------------|------------------|
| **المجلد** | `src/` | `convex/` |
| **اللغة** | TypeScript + React | TypeScript |
| **الدور** | الواجهة والعرض | البيانات والمنطق |
| **التقنيات** | React, Vite, Tailwind | Convex Runtime |
| **النشر** | Cloudflare Pages | Convex Cloud |
| **الرابط** | `your-site.pages.dev` | `smiling-dinosaur-349.convex.cloud` |
| **المتغيرات** | في Cloudflare Dashboard | عبر `npx convex env set` |
| **قاعدة البيانات** | لا | نعم (18 جدول) |
| **الأمان** | كلمات مرور بسيطة | كلمات مرور آمنة في Backend |
| **التحديثات** | عبر Git Push | عبر Git Push أو `npx convex deploy` |

---

## 🚀 خطوات النشر الكاملة:

### الخطوة 1: نشر Backend (Convex)

```bash
# متصل مسبقاً!
# URL: https://smiling-dinosaur-349.convex.cloud

# فقط أضف المتغيرات:
npx convex env set MANAGE_REQUESTS_PASSWORD "Omar1010#"
npx convex env set SUPERVISOR_EMAIL_1010 "labn@company.com"
npx convex env set SUPERVISOR_EMAIL_2020 "tuwaiq@company.com"
npx convex env set DEFAULT_SUPERVISOR_EMAIL "admin@company.com"
```

✅ **Backend جاهز ويعمل!**

### الخطوة 2: نشر Frontend (Cloudflare)

```
1. اذهب إلى: Cloudflare Dashboard
2. Workers & Pages → مشروعك
3. Settings → Environment variables
4. أضف المتغيرات الخمسة:
   - VITE_CONVEX_URL
   - VITE_DEV_MODE
   - VITE_PAYROLL_PASSWORD
   - VITE_EMPLOYEES_PASSWORD
   - VITE_APP_URL

5. Deployments → Retry deployment

6. انتظر البناء (2-3 دقائق)

7. افتح: https://your-site.pages.dev
```

✅ **Frontend جاهز ويعمل!**

---

## 💡 لماذا جزئين منفصلين؟

### الفوائد:

1. **الأمان** 🔒
   - كلمات المرور الحساسة في Backend فقط
   - Frontend لا يحتوي على أسرار

2. **الأداء** ⚡
   - Cloudflare: شبكة CDN عالمية سريعة
   - Convex: قاعدة بيانات real-time

3. **السهولة** 🎯
   - Cloudflare: نشر تلقائي من Git
   - Convex: قاعدة بيانات بدون إعداد

4. **التكلفة** 💰
   - Cloudflare Pages: مجاني
   - Convex: خطة مجانية كافية للبداية

---

## 🔍 كيف تتحقق من كل جزء؟

### تحقق من Backend (Convex):

```bash
# 1. تحقق من الاتصال
npx convex env list

# يجب أن ترى:
# Project: smiling-dinosaur-349
# Deployment: production

# 2. افتح Dashboard
https://dashboard.convex.dev/
# اختر: smiling-dinosaur-349
# تحقق: 18 جدول موجودة
```

### تحقق من Frontend (Cloudflare):

```
1. افتح: https://dash.cloudflare.com/
2. Workers & Pages → مشروعك
3. Deployments → يجب أن ترى:
   - Status: Success ✅
   - Latest deployment

4. افتح الموقع:
   https://your-site.pages.dev
```

---

## 📁 ملف التوثيق المرتبط:

| الملف | الموضوع |
|------|---------|
| `ALL_SECRETS_AND_KEYS.md` | جميع المتغيرات والمفاتيح |
| `CLOUDFLARE_ENV_VERIFICATION.md` | التحقق من متغيرات Cloudflare |
| `DATABASE_STATUS.md` | حالة قاعدة البيانات (Convex) |
| `CONVEX_SECRETS_COMPLETE.md` | متغيرات Convex |

---

## ❓ أسئلة شائعة:

### س1: هل يجب رفع كل شيء على الاثنين؟

**ج:** لا! كل جزء له مكانه:
- `src/` → Cloudflare
- `convex/` → Convex (مرفوع مسبقاً!)

### س2: لماذا Convex مرتبط؟

**ج:** لأن المشروع يستخدم Convex كـ Backend-as-a-Service:
- قاعدة بيانات جاهزة
- API جاهز
- Real-time sync
- بدون إعداد سيرفر!

### س3: هل يمكن استخدام خيارات أخرى؟

**ج:** نظرياً نعم، لكن يحتاج إعادة كتابة كبيرة:
- بدلاً من Convex: Firebase, Supabase, MongoDB
- بدلاً من Cloudflare: Vercel, Netlify, AWS

**لكن الحالي يعمل ممتاز - لا تغيره!** ✅

### س4: ما دخل Zapier؟

**ج:** Zapier **اختياري تماماً**:
- ليس جزء من البنية الأساسية
- فقط للتكاملات الخارجية
- النظام يعمل 100% بدونه

---

## 🎯 الخلاصة:

```
┌──────────────────────────────────────────────┐
│              المشروع الكامل                 │
├──────────────────────────────────────────────┤
│                                              │
│  Frontend (src/)                             │
│  ↓                                           │
│  npm run build                               │
│  ↓                                           │
│  dist/                                       │
│  ↓                                           │
│  ☁️ Cloudflare Pages                         │
│  📍 https://your-site.pages.dev              │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  Backend (convex/)                           │
│  ↓                                           │
│  npx convex deploy                           │
│  ↓                                           │
│  🔧 Convex Cloud                             │
│  📍 https://smiling-dinosaur-349.convex.cloud│
│                                              │
└──────────────────────────────────────────────┘
```

### الإجابة المباشرة:

1. **Backend في Convex** ✅ (مرفوع مسبقاً!)
2. **Frontend في Cloudflare** ⚠️ (يحتاج متغيرات البيئة)

### ما تحتاج فعله الآن:

```
✅ Convex جاهز (فقط أضف المتغيرات)
⚠️ Cloudflare يحتاج المتغيرات الخمسة
```

---

**هل أوضحت الصورة الآن؟ أي جزء تريد تفصيل أكثر؟** 😊

---

**تم بواسطة:** Claude Code
**التاريخ:** 2025-10-25
**الحالة:** ✅ توضيح شامل للبنية
