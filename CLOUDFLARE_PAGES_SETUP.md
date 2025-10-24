# 🚀 Cloudflare Pages Deployment Guide

## 📋 Prerequisites

- Cloudflare account
- Git repository (GitHub/GitLab)
- Convex project deployed

---

## ⚙️ Cloudflare Pages Configuration

### **Build Settings:**

| Setting | Value |
|---------|-------|
| **Framework preset** | None (or Vite) |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Node version** | 20 |

### **Environment Variables:**

Add these in Cloudflare Pages dashboard → Settings → Environment Variables:

```bash
# Required for Convex
VITE_CONVEX_URL=https://your-project.convex.cloud

# Optional: Add any other environment variables your app needs
```

> **Note:** All environment variables for client-side React/Vite apps must be prefixed with `VITE_`

---

## 📦 Deployment Steps

### **Option 1: Connect Git Repository (Recommended)**

1. **Login to Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com/
   - Navigate to: **Pages** → **Create a project**

2. **Connect Repository**
   - Select **Connect to Git**
   - Choose GitHub/GitLab
   - Authorize Cloudflare
   - Select your repository: `llu77/lkm`

3. **Configure Build**
   ```
   Project name: lkm-hr-system (or your choice)
   Production branch: main
   Build command: npm run build
   Build output directory: dist
   ```

4. **Add Environment Variables**
   - Click **Environment Variables** tab
   - Add `VITE_CONVEX_URL` with your Convex deployment URL

5. **Deploy**
   - Click **Save and Deploy**
   - Wait for build to complete (~2-5 minutes)

### **Option 2: Direct Upload (Wrangler CLI)**

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the project
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=lkm-hr-system
```

---

## 🔧 Post-Deployment Configuration

### **Custom Domain (Optional)**

1. Go to: **Pages** → Your Project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain: `app.yourdomain.com`
4. Follow DNS configuration instructions

### **Preview Deployments**

Cloudflare Pages automatically creates preview URLs for:
- Pull requests
- Non-production branches

Format: `https://[branch].[project].pages.dev`

---

## 🛠️ Build Optimizations

The project is configured with:

✅ **Code Splitting**: Vendor, UI, and Convex chunks separated
✅ **SPA Routing**: `_redirects` file handles React Router
✅ **Source Maps**: Disabled for production (smaller bundle)
✅ **Node Version**: Locked to v20 via `.node-version`

### **Bundle Analysis**

To analyze bundle size locally:

```bash
npm run build

# Output will show chunk sizes
# dist/assets/vendor-[hash].js   ~150KB
# dist/assets/ui-[hash].js       ~80KB
# dist/assets/convex-[hash].js   ~50KB
```

---

## 🔐 Security Considerations

### **Environment Variables**

- **Never commit** `.env` files
- All client-side env vars are public (bundled in JS)
- For sensitive operations, use Convex backend

### **Authentication**

- OIDC auth is handled client-side
- Convex validates authentication server-side
- No sensitive keys should be in client code

### **Password Protection**

Current password-protected pages:
- `/employees` - Password: `Omar1010#`
- `/payroll` - Password: `Omar1010#`
- `/manage-requests` - Password: `Omar101010#`

> **Production Recommendation**: Replace hardcoded passwords with environment-based configuration or backend authentication.

---

## 📊 Performance

### **Expected Metrics:**

- **First Load**: ~500ms (Cloudflare CDN)
- **Time to Interactive**: <2s
- **Lighthouse Score**: 90+ (Performance)

### **Caching:**

Cloudflare automatically caches:
- Static assets (JS, CSS, images)
- HTML with short TTL

### **Global CDN:**

Your app will be served from 300+ Cloudflare edge locations worldwide.

---

## 🐛 Troubleshooting

### **Build Fails**

**Issue**: `npm install` fails
```bash
# Solution: Clear cache
rm -rf node_modules package-lock.json
npm install
```

**Issue**: TypeScript errors
```bash
# Solution: Check tsconfig.json
npm run build
# Fix any TS errors shown
```

### **Blank Page After Deployment**

**Possible causes:**
1. Missing `_redirects` file → Check `public/_redirects` exists
2. Wrong `VITE_CONVEX_URL` → Verify environment variable
3. Build errors → Check Cloudflare Pages build logs

### **Routing Issues**

**Symptom**: 404 on refresh
**Solution**: Ensure `public/_redirects` contains:
```
/*    /index.html   200
```

### **Environment Variables Not Working**

**Check:**
1. Variables prefixed with `VITE_` ✓
2. Added in Cloudflare dashboard ✓
3. Rebuild after adding variables ✓

---

## 🔄 CI/CD Workflow

Cloudflare Pages automatically:

1. **On Push to Main**:
   - Builds and deploys to production
   - URL: `https://lkm-hr-system.pages.dev`

2. **On Pull Request**:
   - Creates preview deployment
   - Adds comment with preview URL
   - Runs build checks

3. **On Merge**:
   - Deploys to production
   - Previous version available via rollback

---

## 📈 Monitoring

### **Analytics**

- Go to: **Pages** → Your Project → **Analytics**
- View: Requests, Bandwidth, Errors

### **Logs**

- Go to: **Pages** → Your Project → **Deployments**
- Click deployment → **View build log**

---

## 🚀 Production Checklist

Before going live:

- [ ] Test authentication flow
- [ ] Verify all pages load correctly
- [ ] Check mobile responsiveness
- [ ] Test password-protected pages
- [ ] Verify Convex integration works
- [ ] Set up custom domain (optional)
- [ ] Configure error tracking (Sentry/etc)
- [ ] Test all CRUD operations
- [ ] Verify PDF generation works
- [ ] Check email sending (Resend integration)

---

## 📞 Support

- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **Vite Docs**: https://vitejs.dev/
- **Convex Docs**: https://docs.convex.dev/

---

## 🎉 Quick Deploy Command

```bash
# Build locally
npm run build

# Deploy via Wrangler
wrangler pages deploy dist --project-name=lkm-hr-system
```

---

**Last Updated**: October 24, 2025
**Project Version**: 1.0.0
**Node Version**: 20.x
