@echo off
REM Convex Environment Variables Setup Script (Windows)
REM This script sets up all required environment variables for the LKM application

echo 🚀 Setting up Convex environment variables...
echo.

REM Set password for managing requests page
call npx convex env set MANAGE_REQUESTS_PASSWORD "Omar1010#"

REM Set supervisor email for branch 1010 (لبن)
call npx convex env set SUPERVISOR_EMAIL_1010 "labn@company.com"

REM Set supervisor email for branch 2020 (طويق)
call npx convex env set SUPERVISOR_EMAIL_2020 "tuwaiq@company.com"

REM Set default supervisor email (fallback)
call npx convex env set DEFAULT_SUPERVISOR_EMAIL "admin@company.com"

REM Set application URL for email links
call npx convex env set VITE_APP_URL "https://your-site.pages.dev"

echo.
echo ✅ All environment variables have been set successfully!
echo.
echo 📝 Note: Make sure to update VITE_APP_URL with your actual Cloudflare Pages URL
pause
