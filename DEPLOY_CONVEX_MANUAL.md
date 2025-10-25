# 🚀 نشر Convex Backend - خطوات يدوية

## الحالة الحالية

✅ **تم**:
- Convex Auth code جاهز
- Frontend محدّث
- Packages مُثبتة
- Changes مدفوعة إلى GitHub
- Cloudflare Pages نشر آخر update

⏳ **المطلوب**:
- نشر Convex backend

---

## 📋 الخطوات اليدوية (5-10 دقائق)

### الخطوة 1: تسجيل الدخول إلى Convex

افتح terminal في مجلد المشروع:

```bash
cd C:\Users\llu77\Desktop\gpt\lkm
npx convex login
```

**ما سيحدث**:
1. سيُطلب منك device name (اكتب أي اسم، مثل: `laptop`)
2. سيفتح متصفح تلقائياً
3. سجّل دخول بحساب Convex (أو أنشئ حساب جديد)
4. بعد النجاح، ارجع للـ terminal

### الخطوة 2: ربط المشروع بـ Deployment

بعد Login، شغّل:

```bash
npx convex dev
```

**سيسألك**:
```
? Create a new project? (Y/n)
```

اختر:
- **Y** (نعم) - إذا كان مشروع جديد
- **n** (لا) - إذا كان لديك deployment موجود

إذا اخترت Y:
```
? Project name: lkm-hr-system
```

**سيبدأ Convex dev server**:
```
✓ Synced types and generated code
✓ Convex functions ready
→ Deployment URL: https://your-deployment.convex.cloud
```

### الخطوة 3: نسخ CONVEX_URL

من output الخطوة السابقة، انسخ URL:
```
https://your-deployment.convex.cloud
```

### الخطوة 4: إضافة إلى Cloudflare Pages

1. اذهب إلى: https://dash.cloudflare.com/
2. Pages → مشروعك (symai)
3. Settings → Environment Variables
4. أضف:
   ```
   Name: VITE_CONVEX_URL
   Value: https://your-deployment.convex.cloud
   ```
5. Save

### الخطوة 5: إعادة النشر

في Cloudflare Pages:
1. Deployments → آخر deployment
2. اضغط **Retry deployment**

أو ادفع commit فارغ:
```bash
git commit --allow-empty -m "chore: trigger redeploy with Convex URL"
git push origin main
```

### الخطوة 6: اختبار نهائي

بعد اكتمال النشر (~2 دقيقة):

1. افتح: https://symai.pages.dev
2. افتح Console (F12)
3. **يجب أن ترى**:
   - ✅ لا أخطاء Hercules
   - ✅ لا أخطاء OIDC
   - ✅ لا أخطاء Certificate
   - ✅ "Convex WebSocket: Connected"
   - ✅ الموقع يعمل بشكل طبيعي

---

## 🔄 إذا كان لديك Convex Deployment موجود

إذا كان لديك deployment سابق:

### البحث عن CONVEX_URL

افتح Convex Dashboard:
1. https://dashboard.convex.dev/
2. اختر مشروعك
3. Settings → URL
4. انسخ Deployment URL

### ربط المشروع المحلي

```bash
cd C:\Users\llu77\Desktop\gpt\lkm
npx convex dev
```

سيسأل: `? Select a project:`
اختر مشروعك الموجود.

### Deploy التغييرات

بعد ربط المشروع:
```bash
npx convex deploy
```

---

## ✅ التحقق من نجاح النشر

### في Convex Dashboard:

1. اذهب إلى: https://dashboard.convex.dev/
2. اختر مشروعك
3. **Settings → Authentication**
   - يجب أن ترى: "Anonymous" provider
4. **Logs**
   - يجب أن ترى: Functions deploying
5. **Data**
   - بعد فتح الموقع، يجب أن ترى users table مع anonymous users

### في الموقع:

1. افتح: https://symai.pages.dev
2. Console (F12) → يجب أن ترى:
   ```
   ✅ Convex WebSocket: Connected
   ✅ No errors
   ```
3. Network tab → يجب أن ترى:
   ```
   ✅ WSS connection to convex.cloud
   ✅ Status: 101 Switching Protocols
   ```

---

## 🐛 Troubleshooting

### خطأ: "No project found"
**الحل**: شغّل `npx convex dev` واختر "Create new project"

### خطأ: "Authentication failed"
**الحل**: شغّل `npx convex logout` ثم `npx convex login` مرة أخرى

### خطأ: "Cannot find module @convex-dev/auth"
**الحل**: 
```bash
npm install @convex-dev/auth @auth/core
npx convex dev
```

### الموقع ما زال يظهر أخطاء
**السبب**: Frontend يحاول الاتصال بـ localhost أو URL خاطئ
**الحل**: تأكد من `VITE_CONVEX_URL` في Cloudflare Pages Environment Variables

---

## 📊 الخلاصة

### ما تم حتى الآن:
- ✅ Code جاهز 100%
- ✅ Packages مُثبتة
- ✅ Hercules معطّل
- ✅ Anonymous Auth مُطبّق

### ما تحتاج تعمله أنت:
1. ⏳ `npx convex login` (يحتاج متصفح)
2. ⏳ `npx convex dev` أو `npx convex deploy`
3. ⏳ إضافة `VITE_CONVEX_URL` في Cloudflare Pages
4. ⏳ Retry deployment في Cloudflare

### بعد ذلك:
- 🎉 الموقع سيعمل **بدون أي أخطاء**!

---

**وقت التنفيذ المتوقع**: 5-10 دقائق

