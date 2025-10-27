# دليل الانتقال من Convex إلى Cloudflare 🔄

## 📋 ما تم إنجازه حتى الآن

### ✅ المرحلة 1: Backend Structure (مكتملة)

```
✅ cloudflare/schema.sql           - قاعدة البيانات (17 جدول)
✅ cloudflare-backend/             - مشروع Workers كامل
  ✅ src/index.ts                 - Router رئيسي
  ✅ src/types.ts                 - TypeScript types
  ✅ src/api/revenues.ts          - Revenues API
  ✅ src/api/employees.ts         - Employees API
  ✅ src/api/expenses.ts          - Expenses API
  ✅ src/api/branches.ts          - Branches API
  ✅ src/api/advances.ts          - Advances API
  ✅ src/api/deductions.ts        - Deductions API
  ✅ wrangler.toml                - إعدادات
  ✅ package.json                 - Dependencies
```

### ✅ المرحلة 2: Frontend Adapter (مكتملة)

```
✅ src/lib/cloudflare-adapter.ts  - محول Convex → REST API
```

---

## 🚀 الخطوات التالية للتفعيل

### 🔵 الخطوة 1: إنشاء D1 Database

```bash
cd cloudflare-backend

# إنشاء قاعدة البيانات
npx wrangler d1 create lkm-database

# سترى نتيجة مثل:
# database_id = "xxxx-xxxx-xxxx"

# انسخ database_id وضعه في wrangler.toml:
# database_id = "xxxx-xxxx-xxxx"  ← هنا

# تطبيق Schema
npx wrangler d1 execute lkm-database --file=../cloudflare/schema.sql
```

### 🔵 الخطوة 2: تثبيت Dependencies

```bash
# Backend
cd cloudflare-backend
npm install

# Frontend
cd ..
npm install
```

### 🔵 الخطوة 3: تحديث Frontend

#### أ) تحديث الـ imports في الصفحات:

**قبل:**
```typescript
// src/pages/revenues/page.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
```

**بعد:**
```typescript
// src/pages/revenues/page.tsx
import { useQuery, useMutation, api } from "@/lib/cloudflare-adapter";
```

#### ب) إضافة API URL في `.env`:

```bash
# أنشئ ملف .env
echo "VITE_API_URL=http://localhost:8787" > .env
```

#### ج) تحديث كل الصفحات (18 صفحة):

```bash
# ابحث عن كل الملفات التي تستخدم Convex
grep -r "from \"convex/react\"" src/pages/

# في كل ملف، استبدل:
# من: import { useQuery, useMutation } from "convex/react";
#      import { api } from "@/convex/_generated/api";
# إلى: import { useQuery, useMutation, api } from "@/lib/cloudflare-adapter";
```

### 🔵 الخطوة 4: حذف Convex (اختياري - بعد التأكد)

```bash
# حذف مجلد convex
rm -rf convex/

# حذف مكتبات Convex
npm uninstall convex convex-helpers @convex-dev/auth @auth/core

# حذف providers
# تحديث src/components/providers/default.tsx
```

### 🔵 الخطوة 5: التشغيل والاختبار

#### Terminal 1 - Backend:
```bash
cd cloudflare-backend
npm run dev
```

#### Terminal 2 - Frontend:
```bash
npm run dev
```

افتح: `http://localhost:5173`

---

## 🎯 التحقق من النجاح

### ✅ Backend يعمل:
```bash
curl http://localhost:8787/health
# يجب أن يرجع: {"success":true,"message":"LKM API is running",...}
```

### ✅ Frontend يتصل بـ Backend:
1. افتح المتصفح على `http://localhost:5173`
2. افتح DevTools → Network
3. اضغط على أي صفحة (مثل Revenues)
4. يجب أن ترى requests لـ `http://localhost:8787/api/...`

---

## 🐛 استكشاف الأخطاء

### خطأ: "fetch failed" في Frontend

**الحل:**
```bash
# تأكد أن Backend يعمل
curl http://localhost:8787/health

# تأكد من VITE_API_URL في .env
cat .env
```

### خطأ: "Database binding not found"

**الحل:**
```bash
# تأكد من تطبيق Schema
npx wrangler d1 execute lkm-database --file=../cloudflare/schema.sql

# تأكد من database_id في wrangler.toml
cat wrangler.toml | grep database_id
```

### خطأ: CORS

**الحل:**
- تأكد أن `ALLOWED_ORIGINS` في `wrangler.toml` يحتوي على `http://localhost:5173`

---

## 📊 المقارنة

| الميزة | قبل (Convex) | بعد (Cloudflare) |
|--------|--------------|------------------|
| Backend | Convex Cloud | Cloudflare Workers |
| Database | Convex NoSQL | D1 (SQLite) |
| مصادقة | @convex-dev/auth | لا شيء (تم الحذف) |
| روابط خارجية | ✅ يحتاج CONVEX_URL | ❌ لا يحتاج |
| التكلفة | مجاني حتى 1GB | مجاني حتى 100k req |
| السرعة | سريع | **أسرع** (Edge) |

---

## 🎉 النتيجة النهائية

عند اكتمال كل الخطوات:

✅ **لا URLs خارجية**
✅ **لا API keys** (إلا Anthropic للـ AI - اختياري)
✅ **لا مصادقة** معقدة
✅ **كل شيء على Cloudflare**
✅ **Frontend يعمل بنفس الكود!**

---

## 💡 نصائح

1. **اختبر كل صفحة** بعد التحديث
2. **ابدأ بصفحة واحدة** (مثل Revenues) قبل تحديث الباقي
3. **استخدم DevTools** لمتابعة Network requests
4. **اقرأ الأخطاء** في Console - عادة تكون واضحة

---

## 📞 الدعم

إذا واجهت مشكلة:
1. تأكد من تشغيل Backend (`npm run dev` في cloudflare-backend)
2. افتح DevTools → Console للأخطاء
3. تحقق من Network tab للـ API requests
4. تأكد من `.env` يحتوي على `VITE_API_URL`

**جاهز للبدء؟ 🚀**
