# 🚀 تطبيق Convex Auth - دليل كامل

## المراجع
- [Convex Auth Docs](https://docs.convex.dev/auth/convex-auth)
- [Account Linking](https://docs.convex.dev/auth/convex-auth#account-linking)
- [Security Best Practices](https://docs.convex.dev/auth/convex-auth#security)

## ✅ الخطوة 1: تثبيت الحزمة

```bash
cd C:\Users\llu77\Desktop\gpt\lkm
npm install @convex-dev/auth @auth/core
```

## ✅ الخطوة 2: تحديث Schema (اختياري)

Schema الحالي متوافق بالفعل! لكن يمكنك إضافة حقل `emailVerified`:

```typescript
// في convex/schema.ts
users: defineTable({
  tokenIdentifier: v.string(),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerified: v.optional(v.boolean()), // ← إضافة جديدة
  username: v.string(),
  avatar: v.optional(v.string()),
  role: v.optional(v.string()),
})
  .index("by_token", ["tokenIdentifier"])
  .index("by_username", ["username"])
  .index("by_email", ["email"]), // ← إضافة index للبريد
```

## ✅ الخطوة 3: استبدال auth.config.js

استبدل محتوى `convex/auth.config.js` بالكود التالي:

```javascript
import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
});
```

## ✅ الخطوة 4: إضافة متغيرات البيئة في Convex

1. اذهب إلى [Convex Dashboard](https://dashboard.convex.dev/)
2. اختر مشروعك
3. Settings → Environment Variables
4. أضف:

```bash
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret
```

### كيف تحصل على Google OAuth Credentials:

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create Project (إذا لم يكن لديك)
3. APIs & Services → Credentials
4. Create OAuth 2.0 Client ID
5. Application type: **Web application**
6. Authorized redirect URIs:
   ```
   https://your-deployment.convex.cloud/api/auth/callback/google
   ```
   احصل على deployment URL من Convex Dashboard
7. Copy Client ID and Client Secret

## ✅ الخطوة 5: تحديث Frontend Auth Provider

استبدل `src/components/providers/auth.tsx`:

```typescript
import { ReactNode } from "react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { convex } from "@/lib/convex";

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      {children}
    </ConvexAuthProvider>
  );
}
```

## ✅ الخطوة 6: تحديث Auth Hooks

استبدل `src/hooks/use-auth.ts`:

```typescript
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useMemo } from "react";

export function useAuth() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      signinRedirect: () => void signIn("google"),
      signoutRedirect: signOut,
      user: null, // سنحصل عليه من query منفصل
      error: null,
    }),
    [isLoading, isAuthenticated, signIn, signOut]
  );
}

export function useUser({ shouldRedirect }: { shouldRedirect?: boolean } = {}) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();

  // Auto-redirect if needed
  if (!isLoading && !isAuthenticated && shouldRedirect) {
    void signIn("google");
  }

  return {
    isLoading,
    isAuthenticated,
    id: null, // يمكن الحصول عليه من getCurrentUser query
    name: null,
    email: null,
    avatar: null,
    error: null,
  };
}
```

## ✅ الخطوة 7: تحديث Sign In Component

في `src/components/ui/signin.tsx` (أو أي مكان يعرض زر تسجيل الدخول):

```typescript
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Loader2 } from "lucide-react";

export function SignInButton() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  if (isLoading) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button onClick={() => void signOut()}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    );
  }

  return (
    <Button onClick={() => void signIn("google")}>
      <LogIn className="mr-2 h-4 w-4" />
      Sign in with Google
    </Button>
  );
}
```

## ✅ الخطوة 8: تحديث Convex Queries/Mutations

معظم الكود الحالي متوافق! فقط تأكد من استخدام:

```typescript
// في convex functions
export const myQuery = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      });
    }
    // ... باقي الكود
  },
});
```

## ✅ الخطوة 9: Deploy

```bash
# Deploy Convex backend
npx convex deploy

# Deploy frontend to Cloudflare Pages
git add .
git commit -m "feat: migrate to Convex Auth"
git push origin main
```

## ✅ الخطوة 10: اختبار

1. افتح: https://symai.pages.dev
2. انقر "Sign in with Google"
3. اختر حساب Google
4. يجب أن تُسجّل دخول بنجاح
5. تحقق من Console - لا أخطاء!

## 🔐 Account Linking (متقدم)

إذا أردت منع duplicate accounts للبريد نفسه:

```javascript
// في convex/auth.config.js
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Google(...)],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Custom account linking logic
      if (args.existingUserId) {
        return args.existingUserId;
      }

      // البحث عن مستخدم بنفس البريد
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.profile.email))
        .first();

      if (existing) {
        console.log("Linking account to existing user");
        return existing._id;
      }

      // إنشاء مستخدم جديد
      return ctx.db.insert("users", {
        email: args.profile.email,
        name: args.profile.name,
        emailVerified: true,
        tokenIdentifier: "", // سيتم ملؤه تلقائياً
        username: await generateUniqueUsername(ctx, args.profile.name),
        role: "employee",
      });
    },
  },
});
```

## 🎯 مقارنة: قبل وبعد

| Feature | قبل (Hercules OIDC) | بعد (Convex Auth) |
|---------|---------------------|-------------------|
| **Setup** | معقد | بسيط جداً |
| **CORS** | مشاكل | لا مشاكل |
| **External Service** | نعم (Hercules) | لا |
| **Account Linking** | يدوي | تلقائي |
| **Providers** | واحد | متعدد |
| **Cloudflare Pages** | يعمل أحياناً | يعمل دائماً |

## 🐛 Troubleshooting

### خطأ: "Provider not configured"
- تأكد من إضافة `AUTH_GOOGLE_ID` و `AUTH_GOOGLE_SECRET` في Convex
- Deploy: `npx convex deploy`

### خطأ: "Redirect URI mismatch"
- تأكد من إضافة redirect URI في Google Console:
  `https://your-deployment.convex.cloud/api/auth/callback/google`

### المستخدم لا يُنشأ في database
- تحقق من schema - يجب أن يحتوي على index `by_email`
- راجع Convex logs في Dashboard

## 📚 موارد إضافية

- [Convex Auth Example](https://github.com/get-convex/convex-auth)
- [OAuth Providers List](https://authjs.dev/getting-started/providers)
- [Custom Domain Setup](https://docs.convex.dev/auth/convex-auth#custom-callback-and-sign-in-urls)

---

**ملاحظة**: بعد التطبيق، احذف المتغيرات القديمة من Cloudflare Pages:
- `VITE_HERCULES_OIDC_AUTHORITY`
- `VITE_HERCULES_OIDC_CLIENT_ID`

