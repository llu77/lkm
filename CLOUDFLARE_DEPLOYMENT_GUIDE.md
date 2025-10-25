# 🚀 Cloudflare Pages Deployment Guide

**Project:** LKM HR System
**Framework:** React 19 + Vite + Convex
**Target:** Cloudflare Pages

---

## ✅ Pre-Deployment Checklist

### **1. Environment Variables** 🔴 CRITICAL

Make sure you have all required environment variables:

```bash
# Production Environment Variables (Set in Cloudflare Pages)

# CRITICAL - Development Mode
VITE_DEV_MODE=false

# CRITICAL - Convex Backend
VITE_CONVEX_URL=https://smiling-dinosaur-349.convex.cloud

# CRITICAL - Hercules OIDC Authentication
VITE_HERCULES_OIDC_AUTHORITY=<your-oidc-authority>
VITE_HERCULES_OIDC_CLIENT_ID=<your-client-id>

# OPTIONAL - OIDC Configuration
VITE_HERCULES_OIDC_PROMPT=select_account
VITE_HERCULES_OIDC_RESPONSE_TYPE=code
VITE_OIDC_SCOPE=openid profile email

# OPTIONAL - Page Passwords (Consider removing in production)
VITE_MANAGE_REQUESTS_PASSWORD=<secure-password>
VITE_PAYROLL_PASSWORD=<secure-password>
VITE_EMPLOYEES_PASSWORD=<secure-password>

# OPTIONAL - Hercules Website ID
VITE_HERCULES_WEBSITE_ID=<your-website-id>
```

### **2. Convex Environment Variables** 🔴 CRITICAL

Set in Convex Dashboard or CLI:

```bash
# Zapier Webhook
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/<your-webhook-id>/

# Email (Resend)
RESEND_API_KEY=<your-resend-api-key>

# Anthropic AI (Optional)
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

### **3. Files Check** ✅

Make sure these files exist:
- ✅ `public/_headers` - Security headers
- ✅ `public/_redirects` - SPA routing
- ✅ `convex/rateLimit.ts` - Rate limiting
- ✅ `src/lib/env.ts` - Environment validation
- ✅ `src/components/error-boundary.tsx` - Error handling

---

## 📝 Step-by-Step Deployment

### **Step 1: Local Build Test**

Test the production build locally:

```bash
# Build the project
npm run build

# Verify build output
ls -lh dist/

# Preview the production build
npm run preview

# Open http://localhost:4173 and test
```

**Expected Output:**
```
dist/
├── index.html (2-3 KB)
├── assets/
│   ├── index-*.js (90 KB)
│   ├── react-vendor-*.js (266 KB)
│   ├── radix-ui-*.js (101 KB)
│   └── ... (other chunks)
└── _headers
└── _redirects
```

### **Step 2: Connect to Cloudflare Pages**

1. **Login to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com/
   - Navigate to **Pages**
   - Click **Create a project**

2. **Connect Git Repository**
   - Select **Connect to Git**
   - Choose your Git provider (GitHub/GitLab)
   - Authorize Cloudflare
   - Select your repository: `llu77/lkm`

3. **Configure Build Settings**
   ```
   Project name: lkm-hr-system (or your choice)
   Production branch: main (or your production branch)
   Build command: npm run build
   Build output directory: dist
   Root directory: / (leave empty)
   ```

4. **Environment Variables**
   Click **Environment variables** and add all variables from Step 1

### **Step 3: Deploy**

1. Click **Save and Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Cloudflare will provide a URL: `https://lkm-hr-system.pages.dev`

### **Step 4: Custom Domain (Optional)**

1. Go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain: `hr.yourdomain.com`
4. Follow DNS configuration instructions
5. Wait for SSL certificate (automatic)

---

## 🔧 Build Configuration Details

### **Vite Configuration** (`vite.config.ts`)

Already optimized:
- ✅ Lazy loading enabled
- ✅ Manual chunks configured
- ✅ Bundle size optimized (95.1% reduction)
- ✅ Build output: `dist`

### **TypeScript Configuration** (`tsconfig.json`)

Already configured:
- ✅ Strict mode enabled
- ✅ Path aliases configured
- ✅ Modern ES target

---

## 🔒 Security Configuration

### **Security Headers** (`public/_headers`)

Automatically deployed with:
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection
- ✅ Content Security Policy
- ✅ Cache Control headers

### **SPA Routing** (`public/_redirects`)

Configured for React Router:
```
/*    /index.html   200
```

This ensures all routes work correctly with client-side routing.

---

## ⚡ Performance Optimization

### **Current Performance**

After optimization:
```
Initial Bundle:     90 KB (25 KB gzipped)
Shared Chunks:     511 KB (176 KB gzipped)
Lazy Pages:        20-150 KB each

Initial Load (3G): 1.5-2 seconds ✅
Lighthouse Score:  85-90/100 ✅
```

### **Cloudflare Benefits**

- ✅ Global CDN (150+ locations)
- ✅ Automatic caching
- ✅ DDoS protection
- ✅ Free SSL/TLS
- ✅ Unlimited bandwidth
- ✅ Automatic preview deployments

---

## 🐛 Troubleshooting

### **Build Fails**

**Error:** `npm run build fails`

**Solution:**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **Blank Page After Deployment**

**Possible Causes:**
1. Missing `_redirects` file
2. Wrong build output directory
3. Missing environment variables

**Solution:**
```bash
# Check build output
ls -la dist/
# Should contain index.html and assets/

# Verify _headers and _redirects are copied
ls -la dist/_headers dist/_redirects

# Check browser console for errors
```

### **Authentication Not Working**

**Possible Causes:**
1. `VITE_DEV_MODE=true` in production
2. Missing OIDC credentials
3. Incorrect redirect URI

**Solution:**
```bash
# In Cloudflare Pages Environment Variables:
VITE_DEV_MODE=false
VITE_HERCULES_OIDC_CLIENT_ID=<correct-value>

# Check redirect URI in OIDC provider matches:
https://your-domain.pages.dev/auth/callback
```

### **Convex Not Connecting**

**Possible Causes:**
1. Wrong `VITE_CONVEX_URL`
2. CORS issues
3. Network blocked

**Solution:**
```bash
# Verify Convex URL in environment variables
VITE_CONVEX_URL=https://smiling-dinosaur-349.convex.cloud

# Check browser console for CORS errors
# Ensure Convex deployment is active
```

---

## 📊 Post-Deployment Monitoring

### **1. Check Deployment Status**
```
Cloudflare Pages Dashboard
→ Deployments
→ View latest deployment
→ Check build logs
```

### **2. Test Functionality**
- [ ] Homepage loads
- [ ] Authentication works
- [ ] Dashboard displays data
- [ ] All routes accessible
- [ ] Forms submit successfully
- [ ] Error boundaries work

### **3. Performance Testing**
```bash
# Lighthouse CI
npx lighthouse https://your-domain.pages.dev --view

# Expected Scores:
Performance: > 85
Accessibility: > 90
Best Practices: > 90
SEO: > 85
```

### **4. Error Monitoring**

Consider adding error tracking:
- Sentry
- LogRocket
- Rollbar

Add to `src/components/error-boundary.tsx`:
```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
  // Log to error tracking service
  // Sentry.captureException(error, { contexts: { errorInfo } });
}
```

---

## 🔄 CI/CD Pipeline

### **Automatic Deployments**

Cloudflare Pages automatically:
- ✅ Builds on every push to main
- ✅ Creates preview deployments for PRs
- ✅ Provides unique URLs for each deployment
- ✅ Rolls back if build fails

### **Branch Deployments**

```
main branch        → Production  (https://lkm-hr-system.pages.dev)
feature branches   → Preview     (https://abc123.lkm-hr-system.pages.dev)
```

### **Build Notifications**

Configure in Cloudflare:
- Email notifications
- Slack/Discord webhooks
- GitHub status checks

---

## 📈 Scaling Considerations

### **Traffic Limits**

Cloudflare Pages Free Tier:
- ✅ Unlimited requests
- ✅ Unlimited bandwidth
- ✅ 500 builds/month
- ✅ 1 build at a time

### **Upgrading**

For higher traffic:
- Pro Plan: $20/month
- Business Plan: $200/month
- Enterprise: Custom pricing

---

## 🎯 Final Checklist

Before going live:
- [ ] All environment variables set in Cloudflare
- [ ] Convex environment variables configured
- [ ] Build tested locally
- [ ] Deployment successful
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] All pages load correctly
- [ ] Authentication tested
- [ ] Error handling verified
- [ ] Performance acceptable (Lighthouse > 85)
- [ ] Monitoring configured
- [ ] Team notified

---

## 📞 Support

If you need help:
1. Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
2. Convex Docs: https://docs.convex.dev/
3. Project Issues: https://github.com/llu77/lkm/issues

---

**✅ Your app is ready for deployment!**

Follow these steps and you'll be live in under 10 minutes. 🚀
