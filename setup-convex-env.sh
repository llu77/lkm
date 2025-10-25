#!/bin/bash

# Convex Environment Variables Setup Script
# This script sets up all required environment variables for the LKM application

echo "🚀 Setting up Convex environment variables..."

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

echo "✅ All environment variables have been set successfully!"
echo ""
echo "📝 Note: Make sure to update VITE_APP_URL with your actual Cloudflare Pages URL"
