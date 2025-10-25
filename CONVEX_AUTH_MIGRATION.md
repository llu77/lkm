# 🔐 Migration to Convex Auth

## Overview

Migrate from Hercules OIDC (which has CORS issues) to Convex Auth for seamless authentication.

Reference: [Convex Auth Documentation](https://docs.convex.dev/auth/convex-auth)

## Why Convex Auth?

- ✅ **No external dependencies** - Everything runs in Convex
- ✅ **No CORS issues** - Auth happens on your backend
- ✅ **Multiple auth methods** - OAuth, Magic Links, Passwords
- ✅ **Works with Cloudflare Pages** - No server needed
- ✅ **Built for React** - Perfect for our Vite app

## Installation Steps

### Step 1: Install Convex Auth

```bash
npm install @convex-dev/auth
```

### Step 2: Update Convex Configuration

Update `convex/auth.config.js`:

```javascript
import { convexAuth } from "@convex-dev/auth/server";

export default convexAuth({
  providers: [
    // Option 1: OAuth (recommended)
    {
      id: "google",
      // Get these from Google Cloud Console
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    },
    
    // Option 2: Magic Links (email)
    {
      id: "resend",
      apiKey: process.env.AUTH_RESEND_KEY,
    },
    
    // Option 3: Password-based
    {
      id: "password",
      // Requires email verification setup
    },
  ],
});
```

### Step 3: Update Frontend Auth Provider

Replace `src/components/providers/auth.tsx`:

```typescript
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { convex } from "@/lib/convex";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      {children}
    </ConvexAuthProvider>
  );
}
```

### Step 4: Update Auth Hook

Replace `src/hooks/use-auth.ts`:

```typescript
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function useAuth() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  return {
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
  };
}
```

### Step 5: Update Sign In Component

```typescript
import { useAuthActions } from "@convex-dev/auth/react";

export function SignIn() {
  const { signIn } = useAuthActions();

  return (
    <button
      onClick={() => void signIn("google")}
    >
      Sign in with Google
    </button>
  );
}
```

## Quick Setup: Google OAuth

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI:
   ```
   https://your-deployment.convex.cloud/api/auth/callback/google/
   ```
4. Copy Client ID and Client Secret

### 2. Add Environment Variables

In Convex Dashboard → Settings → Environment Variables:

```bash
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret
```

### 3. Deploy

```bash
npx convex deploy
```

## Quick Setup: Magic Links (Email)

### 1. Get Resend API Key

1. Sign up at [Resend](https://resend.com/)
2. Get API key
3. Verify your domain

### 2. Add Environment Variables

In Convex Dashboard:

```bash
AUTH_RESEND_KEY=re_xxxxxxxxxxxxxxxx
```

### 3. Configure in Convex

```javascript
export default convexAuth({
  providers: [
    {
      id: "resend",
      apiKey: process.env.AUTH_RESEND_KEY,
      from: "noreply@yourdomain.com",
    },
  ],
});
```

## Migration Checklist

- [ ] Install `@convex-dev/auth` package
- [ ] Update `convex/auth.config.js`
- [ ] Choose auth provider (Google/Resend/Password)
- [ ] Get OAuth credentials or API keys
- [ ] Add environment variables to Convex
- [ ] Update `src/components/providers/auth.tsx`
- [ ] Update `src/hooks/use-auth.ts`
- [ ] Update sign-in component
- [ ] Remove old OIDC environment variables from Cloudflare
- [ ] Deploy Convex: `npx convex deploy`
- [ ] Test authentication flow
- [ ] Deploy frontend to Cloudflare Pages

## Benefits Over Current Setup

| Feature | Current (Hercules OIDC) | Convex Auth |
|---------|------------------------|-------------|
| **CORS Issues** | ❌ Has CORS problems | ✅ No CORS issues |
| **Setup Complexity** | ❌ Complex | ✅ Simple |
| **External Service** | ❌ Depends on Hercules | ✅ Self-contained |
| **Multiple Providers** | ❌ Single provider | ✅ Multiple options |
| **Works with CDN** | ⚠️ Maybe | ✅ Yes |
| **Built for Convex** | ❌ No | ✅ Yes |

## Testing Authentication

After migration:

```typescript
// In any component
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

function MyComponent() {
  const { isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  if (!isAuthenticated) {
    return <button onClick={() => signIn("google")}>Sign In</button>;
  }

  return <button onClick={signOut}>Sign Out</button>;
}
```

## Resources

- [Convex Auth Docs](https://docs.convex.dev/auth/convex-auth)
- [Example Repository](https://github.com/get-convex/convex-auth)
- [Live Demo](https://labs.convex.dev/auth-demo)

## Support

If you need help:
- [Convex Discord](https://discord.gg/convex)
- [Convex Auth Beta Feedback](https://discord.gg/convex)

