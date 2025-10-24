# ✅ Checklist قبل الرفع - LKM Project

## 🔴 **CRITICAL - يجب إنجازها قبل Production**

### 1. Environment Variables
- [ ] إنشاء ملف `.env.local` من `.env.example`
- [ ] تعيين `VITE_CONVEX_URL` الخاص بك
- [ ] (اختياري) تعيين `PDFCO_API_KEY` إذا أردت استخدام PDF.co
- [ ] (اختياري) تعيين `RESEND_API_KEY` لإرسال البريد
- [ ] **تغيير كلمات المرور الافتراضية** في الـ `.env.local`

### 2. Security
- [ ] تأكد من تغيير كلمات المرور من "Omar1010#"
- [ ] لا تُدخل أي API keys في الكود مباشرة
- [ ] راجع أذونات المستخدمين في Convex

### 3. Build & Test
- [ ] اختبر `npm run build` محلياً
- [ ] تأكد من عدم وجود TypeScript errors
- [ ] افتح dist/index.html في المتصفح للتأكد

## 🟡 **IMPORTANT - خلال 24 ساعة من الرفع**

### 4. Functionality Testing
- [ ] اختبر تسجيل الدخول
- [ ] اختبر صفحة الموظفين (إضافة/تعديل/حذف)
- [ ] اختبر صفحة الرواتب (إنشاء/عرض/حذف)
- [ ] اختبر PDF generation (تحميل + طباعة)
- [ ] اختبر البحث والفلترة

### 5. Email System (إذا أردت تفعيله)
- [ ] احصل على `RESEND_API_KEY`
- [ ] اختبر إرسال بريد إلكتروني تجريبي
- [ ] تأكد من email templates تعمل

### 6. Mobile Testing
- [ ] اختبر على شاشات صغيرة (iPhone/Android)
- [ ] تأكد من Navbar dropdowns تعمل
- [ ] تأكد من الجداول scrollable

## 🟢 **NICE TO HAVE - خلال أسبوع**

### 7. Monitoring
- [ ] إضافة Sentry لتتبع الأخطاء
- [ ] إضافة Google Analytics (اختياري)
- [ ] مراقبة Cloudflare Pages logs

### 8. Code Quality
- [ ] إزالة console.log statements
- [ ] إضافة Error Boundaries
- [ ] كتابة tests أساسية

### 9. Documentation
- [ ] تحديث README.md
- [ ] توثيق API endpoints المهمة
- [ ] توثيق workflow للموظفين الجدد

## 📝 **ملاحظات إضافية**

### PDF Generation
لديك خياران:
1. **jsPDF (محلي)** - يعمل بدون إعدادات، أسرع، offline
2. **PDF.co (سحابي)** - يحتاج API key، features أكثر

**التوصية الحالية:** استخدم jsPDF (الافتراضي)

### Password Protection
**⚠️ تحذير:** كلمات المرور hardcoded حل مؤقت فقط.
**للإنتاج:** استخدم role-based authentication عبر Convex

### Cloudflare Pages Variables
تأكد من إضافة هذه في Cloudflare Dashboard:
```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_EMPLOYEES_PASSWORD=your_secure_password
VITE_PAYROLL_PASSWORD=your_secure_password
VITE_MANAGE_REQUESTS_PASSWORD=your_secure_password
```

---

## 🎯 **الحالة النهائية**

بعد إنجاز القسم الأحمر:
- ✅ **المشروع جاهز للرفع على Cloudflare Pages**
- ✅ **الوظائف الأساسية تعمل**
- ⚠️ **يحتاج اختبارات إضافية بعد الرفع**

---

**آخر تحديث:** 24 أكتوبر 2025
