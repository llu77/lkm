#!/bin/bash

# Setup Convex Zapier Webhook
# Run this script in your local terminal (NOT in Claude Code)

set -e

echo "🔧 Convex Zapier Setup Script"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Webhook URL
WEBHOOK_URL="https://hooks.zapier.com/hooks/catch/4045e58858fec2e48109352fcd71ead5/"

echo -e "${YELLOW}Step 1: Checking Convex CLI...${NC}"
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Please install Node.js first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npx found${NC}"
echo ""

echo -e "${YELLOW}Step 2: Checking Convex authentication...${NC}"
if npx convex env list &> /dev/null; then
    echo -e "${GREEN}✅ Already authenticated${NC}"
else
    echo -e "${YELLOW}⚠️  Not authenticated. Running login...${NC}"
    npx convex login
fi
echo ""

echo -e "${YELLOW}Step 3: Setting ZAPIER_WEBHOOK_URL...${NC}"
echo "Webhook URL: $WEBHOOK_URL"
if npx convex env set ZAPIER_WEBHOOK_URL "$WEBHOOK_URL"; then
    echo -e "${GREEN}✅ Webhook URL set successfully!${NC}"
else
    echo -e "${RED}❌ Failed to set webhook URL${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 4: Verifying configuration...${NC}"
CURRENT_URL=$(npx convex env get ZAPIER_WEBHOOK_URL 2>/dev/null || echo "")
if [ "$CURRENT_URL" = "$WEBHOOK_URL" ]; then
    echo -e "${GREEN}✅ Configuration verified!${NC}"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 Setup Complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Your Convex deployment is now configured to send webhooks to:"
    echo "$WEBHOOK_URL"
    echo ""
    echo "Next steps:"
    echo "1. ✅ Create a Zap in Zapier (Webhooks by Zapier → Catch Hook)"
    echo "2. ✅ Test by creating revenue/expense in your app"
    echo "3. ✅ Check Zapier Task History for incoming data"
    echo ""
    echo "Documentation: See ZAPIER_QUICKSTART.md"
else
    echo -e "${RED}❌ Verification failed${NC}"
    echo "Expected: $WEBHOOK_URL"
    echo "Got: $CURRENT_URL"
    exit 1
fi
