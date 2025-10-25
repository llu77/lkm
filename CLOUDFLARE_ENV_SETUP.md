# ⚠️ خطوة مهمة: إضافة VITE_CONVEX_URL في Cloudflare Pages

## 🔗 Convex Deployment URL

```
https://careful-clownfish-771.convex.cloud
```

## 📝 كيفية الإضافة:

1. افتح: https://dash.cloudflare.com/
2. Pages → مشروعك (symai أو lkm-hr-system)
3. Settings → Environment Variables
4. Add variable:
   - **Name**: `VITE_CONVEX_URL`
   - **Value**: `https://careful-clownfish-771.convex.cloud`
5. اختر Environment: **Production** ✓
6. Save
7. Deployments → **Retry deployment**

## ✅ بعد Retry Deployment:

الموقع سيعمل **بدون أي أخطاء**:
- ✅ لا Hercules errors
- ✅ لا OIDC errors
- ✅ لا Certificate errors
- ✅ Anonymous Auth يعمل
- ✅ Convex connected
- ✅ جميع features تعمل

---

**Dashboard**: https://dashboard.convex.dev/d/careful-clownfish-771

