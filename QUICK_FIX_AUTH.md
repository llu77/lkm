# 🚀 Quick Fix: تعطيل Hercules OIDC مؤقتاً

## المشكلة الحالية

```
TypeError: Failed to fetch
Error: No authority or metadataUrl configured on settings
```

**السبب**: 
- `VITE_HERCULES_OIDC_AUTHORITY` غير صحيح أو غير قابل للوصول
- CORS policy على Hercules auth server
- Hercules قد لا يوفر OIDC endpoint عام

## ✅ الحل السريع: تعطيل OIDC مؤقتاً

### الخطوة 1: تعديل Auth Provider

عدّل `src/components/providers/auth.tsx`:

```typescript
import { useCallback } from "react";
import {
  AuthProvider as ReactAuthProvider,
  type AuthProviderProps,
} from "react-oidc-context";

// تعطيل OIDC مؤقتاً - استخدم null كقيمة افتراضية
const AUTH_CONFIG: AuthProviderProps = {
  authority: import.meta.env.VITE_HERCULES_OIDC_AUTHORITY || "https://example.com", // Dummy value
  client_id: import.meta.env.VITE_HERCULES_OIDC_CLIENT_ID || "dummy-client-id",
  prompt: import.meta.env.VITE_HERCULES_OIDC_PROMPT ?? "select_account",
  response_type: import.meta.env.VITE_HERCULES_OIDC_RESPONSE_TYPE ?? "code",
  scope: import.meta.env.VITE_HERCULES_OIDC_SCOPE ?? "openid profile email",
  redirect_uri:
    import.meta.env.VITE_HERCULES_OIDC_REDIRECT_URI ??
    `${window.location.origin}/auth/callback`,
  // تعطيل auto signin
  automaticSilentRenew: false,
};

// أضف check للتحقق من وجود المتغيرات
const isAuthConfigured = 
  import.meta.env.VITE_HERCULES_OIDC_AUTHORITY && 
  import.meta.env.VITE_HERCULES_OIDC_CLIENT_ID;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const onSigninCallback = useCallback(() => {
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);
  const onSignoutCallback = useCallback(() => {
    window.location.pathname = "";
  }, []);

  // إذا لم يكن Auth مُعدّ، ارجع children مباشرة (بدون OIDC)
  if (!isAuthConfigured) {
    console.warn("OIDC not configured. Running without authentication.");
    return <>{children}</>;
  }

  return (
    <ReactAuthProvider
      {...AUTH_CONFIG}
      onSigninCallback={onSigninCallback}
      onSignoutCallback={onSignoutCallback}
    >
      {children}
    </ReactAuthProvider>
  );
}
```

### الخطوة 2: إخفاء زر Sign In إذا لم يكن Auth مُعدّ

عدّل `src/components/ui/signin.tsx` (أو المكون الذي يعرض زر تسجيل الدخول):

```typescript
// في أعلى الملف
const isAuthConfigured = 
  import.meta.env.VITE_HERCULES_OIDC_AUTHORITY && 
  import.meta.env.VITE_HERCULES_OIDC_CLIENT_ID;

// في component render
if (!isAuthConfigured) {
  return null; // أو اعرض رسالة "Authentication not configured"
}
```

## 🔄 خيار 2: استخدام Convex Auth المدمج

إذا أردت authentication يعمل، استخدم Convex Auth:

### 1. أضف Convex Auth Provider

في `convex/auth.config.js`:

```javascript
// استخدم Anonymous Auth للتطوير
export default {
  providers: [
    {
      id: "anonymous",
    },
  ],
};
```

### 2. عدّل Frontend

استخدم Convex's built-in auth بدلاً من OIDC:

```typescript
import { ConvexProviderWithAuth } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { useConvexAuth } from "convex/react";

// استخدم Convex auth hooks مباشرة
const { isLoading, isAuthenticated } = useConvexAuth();
```

## 🎯 الحل الموصى به للإنتاج

### استخدام Google OAuth بدلاً من Hercules

1. **أنشئ OAuth Client في Google Cloud Console**:
   - https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Authorized redirect URIs: `https://symai.pages.dev/auth/callback`

2. **أضف المتغيرات**:
   ```bash
   VITE_HERCULES_OIDC_AUTHORITY=https://accounts.google.com
   VITE_HERCULES_OIDC_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

3. **لا تحتاج تعديل كود** - المشروع جاهز لاستخدام أي OIDC provider

## 📋 خطوات تطبيق الحل السريع

1. **نفّذ التعديل على `auth.tsx`** (الكود أعلاه)
2. **Commit و Push**:
   ```bash
   git add src/components/providers/auth.tsx
   git commit -m "fix: disable OIDC when not configured"
   git push origin main
   ```
3. **انتظر البناء**
4. **اختبر** - الموقع يجب أن يعمل بدون أخطاء authentication

## ✅ النتيجة المتوقعة

- ✅ لا مزيد من أخطاء `Failed to fetch`
- ✅ لا مزيد من `No authority configured`
- ✅ الموقع يُحمّل بشكل طبيعي
- ⚠️ تسجيل الدخول معطّل مؤقتاً (حتى تضيف Google OAuth أو provider آخر)

---

**ملاحظة**: هذا حل مؤقت للتطوير. للإنتاج، استخدم Google OAuth أو Auth0 أو أي OIDC provider موثوق.

