# 🔧 Development Setup Guide - LKM Project

## ✅ تم الإصلاح

### المشاكل التي تم حلها:
1. ✅ **Dependencies** - تم تثبيت جميع الـ packages (389 package)
2. ✅ **Environment Variables** - تم إنشاء `.env.local` مع القيم الأساسية
3. ✅ **Development Mode** - تم إضافة bypass للـ authentication في التطوير المحلي
4. ✅ **Dev Server** - يعمل على `http://localhost:5173`

---

## 🟢 الحالة الحالية

```
✓ Vite Server Running: http://localhost:5173
✓ Development Mode: ENABLED
✓ Authentication: BYPASSED (dev mode)
⚠ Convex Backend: Needs verification
```

**الصفحة البيضاء يجب أن تكون قد اختفت الآن!**

---

## 🎯 كيف تختبر التطبيق

### 1. افتح المتصفح
```
http://localhost:5173
```

### 2. يجب أن ترى:
- ✅ صفحة رئيسية تحتوي على شعار LKM
- ✅ Features cards (الإيرادات، المصروفات، إلخ)
- ✅ مؤشر "🔧 DEV MODE" أسفل يسار الشاشة

### 3. التنقل في التطبيق:
بما أن DEV_MODE مفعّل، يمكنك الوصول مباشرة إلى:
- `/dashboard` - لوحة التحكم
- `/employees` - الموظفين
- `/payroll` - الرواتب
- `/revenues` - الإيرادات
- `/expenses` - المصروفات

---

## ⚠️ ملاحظات مهمة

### Development Mode

**الميزات:**
- ✅ لا يحتاج OIDC authentication
- ✅ user مضبوط تلقائياً (dev-user-123)
- ✅ سريع للتطوير والاختبار

**التحذيرات:**
- ⚠️ **لا تستخدم في Production!**
- ⚠️ لا يوجد أمان حقيقي
- ⚠️ جميع الصفحات متاحة بدون تحقق

### Convex Backend

**الحالة:**
```env
VITE_CONVEX_URL=https://smiling-dinosaur-349.convex.cloud
```

**إذا كان الـ URL غير صحيح:**
1. افتح browser console (F12)
2. ابحث عن errors تحتوي على "convex"
3. احصل على الـ URL الصحيح من:
   - Convex Dashboard: https://dashboard.convex.dev
   - أو من الشخص الذي أعد المشروع

4. حدّث `.env.local`:
   ```env
   VITE_CONVEX_URL=https://your-actual-deployment.convex.cloud
   ```

5. أعد تشغيل dev server:
   ```bash
   npm run dev
   ```

---

## 🚀 للانتقال إلى Production

### 1. إيقاف Development Mode
في `.env.local`:
```env
VITE_DEV_MODE=false  # أو احذف السطر تماماً
```

### 2. إضافة Hercules OIDC Credentials
```env
VITE_HERCULES_OIDC_AUTHORITY=https://your-authority.com
VITE_HERCULES_OIDC_CLIENT_ID=your-real-client-id
```

احصل عليها من:
- Hercules Dashboard: https://hercules.app
- أو من OIDC provider الخاص بك

### 3. التحقق من Convex URL
تأكد من أن الـ URL صحيح ويعمل:
```bash
npx convex env get CONVEX_URL
```

### 4. Build & Deploy
```bash
npm run build
# ثم رفع dist/ على Cloudflare Pages
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: الصفحة لا تزال بيضاء

**الحلول:**
1. افتح Browser Console (F12) واقرأ الـ errors
2. تأكد من أن `.env.local` موجود في root directory
3. أعد تشغيل dev server:
   ```bash
   pkill -f vite
   npm run dev
   ```

### المشكلة: "Failed to fetch" errors

**السبب:** Convex URL غير صحيح

**الحل:**
1. تحقق من Convex Dashboard
2. حدّث `VITE_CONVEX_URL` في `.env.local`
3. أعد تشغيل server

### المشكلة: "Authentication Error"

**السبب:** DEV_MODE غير مفعّل ولا توجد OIDC credentials

**الحل:**
```env
VITE_DEV_MODE=true
```

---

## 📁 الملفات المهمة

### تم إنشاؤها/تعديلها:
- `.env.local` - Environment variables
- `convex.json` - Convex deployment config
- `src/components/providers/dev-auth.tsx` - Development auth bypass (جديد)
- `src/components/providers/auth.tsx` - معدّل لدعم dev mode

### لا تنس:
- `.env.local` **لا يُرفع** على Git (في .gitignore)
- تحتاج إنشاء `.env.local` على كل machine جديدة

---

## 🎓 للمطورين الجدد

### Quick Start
```bash
# 1. Clone & Install
git clone <repo-url>
cd lkm
npm install

# 2. Setup Environment
cp .env.local.example .env.local  # (أو أنشئ ملف جديد)
# Edit .env.local and set VITE_DEV_MODE=true

# 3. Run
npm run dev

# 4. Open
# http://localhost:5173
```

### Tech Stack
- **Frontend:** React 19 + TypeScript + Vite
- **UI:** Radix UI + Tailwind CSS
- **Backend:** Convex (BaaS)
- **Auth:** OIDC (Hercules) - مع dev bypass
- **Routing:** React Router v7

---

**آخر تحديث:** 24 أكتوبر 2025
**الحالة:** ✅ Ready for Development
