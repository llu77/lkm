# 🔧 Convex Environment Variables Setup Guide

## Overview

This guide explains how to set up the required Convex environment variables for the LKM application. These variables are used for authentication, email routing, and application configuration.

---

## 📋 Required Environment Variables

| Variable | Purpose | Default Value |
|----------|---------|---------------|
| `MANAGE_REQUESTS_PASSWORD` | Password protection for the manage requests page | `Omar1010#` |
| `SUPERVISOR_EMAIL_1010` | Supervisor email for branch 1010 (لبن) | `labn@company.com` |
| `SUPERVISOR_EMAIL_2020` | Supervisor email for branch 2020 (طويق) | `tuwaiq@company.com` |
| `DEFAULT_SUPERVISOR_EMAIL` | Fallback supervisor email | `admin@company.com` |
| `VITE_APP_URL` | Application URL for email links | `https://your-site.pages.dev` |

---

## 🚀 Quick Setup (Recommended)

### Option 1: Using the Setup Script

Run the provided shell script to set all environment variables at once:

```bash
./setup-convex-env.sh
```

This will automatically execute all the required `npx convex env set` commands.

### Option 2: Manual Setup

If you prefer to set the variables manually or need to customize values, run the following commands:

```bash
# Set password for managing requests page
npx convex env set MANAGE_REQUESTS_PASSWORD "Omar1010#"

# Set supervisor email for branch 1010 (لبن)
npx convex env set SUPERVISOR_EMAIL_1010 "labn@company.com"

# Set supervisor email for branch 2020 (طويق)
npx convex env set SUPERVISOR_EMAIL_2020 "tuwaiq@company.com"

# Set default supervisor email (fallback)
npx convex env set DEFAULT_SUPERVISOR_EMAIL "admin@company.com"

# Set application URL for email links
npx convex env set VITE_APP_URL "https://your-site.pages.dev"
```

---

## 🔍 Variable Details

### 1. MANAGE_REQUESTS_PASSWORD

**Used in:** `src/pages/manage-requests/page.tsx`

**Purpose:** Protects the manage requests admin page with password authentication.

**Default:** `Omar1010#`

**⚠️ Security Note:** For production, change this to a strong, unique password and avoid committing it to version control.

### 2. SUPERVISOR_EMAIL_1010

**Used in:** `convex/branches.ts`

**Purpose:** Email address for the supervisor of branch 1010 (لبن). Used when seeding branch data and for email notifications.

**Default:** `labn@company.com`

### 3. SUPERVISOR_EMAIL_2020

**Used in:** `convex/branches.ts`

**Purpose:** Email address for the supervisor of branch 2020 (طويق). Used when seeding branch data and for email notifications.

**Default:** `tuwaiq@company.com`

### 4. DEFAULT_SUPERVISOR_EMAIL

**Used in:** `convex/branches.ts`

**Purpose:** Fallback email address if branch-specific supervisor emails are not set.

**Default:** `admin@company.com`

**Fallback Chain:** 
```
SUPERVISOR_EMAIL_1010 → DEFAULT_SUPERVISOR_EMAIL → "admin@company.com"
```

### 5. VITE_APP_URL

**Used in:** `convex/payrollEmail.ts`

**Purpose:** Base URL of the application, used to generate links in email notifications (e.g., links to payroll pages).

**Default:** `https://your-site.pages.dev`

**⚠️ Important:** Update this with your actual Cloudflare Pages deployment URL after deployment.

---

## 📝 How Environment Variables Are Used

### In Convex Backend (`convex/branches.ts`)

```typescript
// Reading supervisor emails with fallbacks
const supervisor1Email = process.env.SUPERVISOR_EMAIL_1010 || 
                        process.env.DEFAULT_SUPERVISOR_EMAIL || 
                        "admin@company.com";

const supervisor2Email = process.env.SUPERVISOR_EMAIL_2020 || 
                        process.env.DEFAULT_SUPERVISOR_EMAIL || 
                        "admin@company.com";
```

### In Frontend (`src/pages/manage-requests/page.tsx`)

```typescript
// Reading password for admin authentication
const ADMIN_PASSWORD = import.meta.env.VITE_MANAGE_REQUESTS_PASSWORD || "";
```

### In Email Templates (`convex/payrollEmail.ts`)

```typescript
// Using app URL in email links
const appUrl = process.env.VITE_APP_URL || 'https://your-app-url.com';
```

---

## ✅ Verification

After setting the environment variables, verify they are set correctly:

```bash
# List all Convex environment variables
npx convex env list
```

You should see all five variables listed with their values.

---

## 🔄 Updating Values

To update any environment variable, simply run the `npx convex env set` command again with the new value:

```bash
npx convex env set VARIABLE_NAME "new-value"
```

For example, to update the application URL after deployment:

```bash
npx convex env set VITE_APP_URL "https://lkm-hr-system.pages.dev"
```

---

## 🗑️ Removing Variables

To remove an environment variable:

```bash
npx convex env remove VARIABLE_NAME
```

---

## 🔐 Security Best Practices

1. **Never commit sensitive values** to version control
2. **Use strong passwords** for production environments
3. **Rotate passwords** regularly
4. **Limit access** to environment variable configuration
5. **Use different values** for development and production environments

### Development vs Production

For development:
```bash
npx convex env set MANAGE_REQUESTS_PASSWORD "dev-password-123" --dev
```

For production:
```bash
npx convex env set MANAGE_REQUESTS_PASSWORD "StrongProd#Pass2024!" --prod
```

---

## 🐛 Troubleshooting

### Variables Not Taking Effect

1. **Restart Convex development server** after setting variables
2. **Redeploy Convex functions** to production
3. **Clear browser cache** if testing frontend variables

### Check Current Values

```bash
# View specific variable
npx convex env get VARIABLE_NAME

# List all variables
npx convex env list
```

### Permission Issues

Ensure you're authenticated with Convex:

```bash
npx convex login
```

---

## 📚 Additional Resources

- [Convex Environment Variables Documentation](https://docs.convex.dev/production/environment-variables)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Cloudflare Pages Setup](./CLOUDFLARE_PAGES_SETUP.md)

---

## 🎯 Quick Start Checklist

- [ ] Run `./setup-convex-env.sh` or manually execute all commands
- [ ] Verify with `npx convex env list`
- [ ] Update `VITE_APP_URL` with your actual deployment URL
- [ ] Change `MANAGE_REQUESTS_PASSWORD` for production
- [ ] Update supervisor emails with actual company emails
- [ ] Test the application to ensure variables are working

---

**Last Updated:** October 25, 2025
