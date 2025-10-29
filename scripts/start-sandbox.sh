#!/bin/bash

# Anthropic Sandbox Runtime Startup Script
# This script starts the Anthropic sandbox runtime with the configured proxy ports

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration (matches convex/ai.ts)
HTTP_PROXY_PORT="${ANTHROPIC_HTTP_PROXY_PORT:-8080}"
SOCKS_PROXY_PORT="${ANTHROPIC_SOCKS_PROXY_PORT:-8081}"
RUNTIME="${1:-bash}"

echo -e "${GREEN}Starting Anthropic Sandbox Runtime${NC}"
echo -e "  Runtime: ${YELLOW}${RUNTIME}${NC}"
echo -e "  HTTP Proxy Port: ${YELLOW}${HTTP_PROXY_PORT}${NC}"
echo -e "  SOCKS Proxy Port: ${YELLOW}${SOCKS_PROXY_PORT}${NC}"
echo ""

# Check if ports are already in use
if lsof -Pi :${HTTP_PROXY_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${RED}Error: Port ${HTTP_PROXY_PORT} is already in use${NC}"
    echo "Please stop the process using this port or change HTTP_PROXY_PORT"
    exit 1
fi

if lsof -Pi :${SOCKS_PROXY_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${RED}Error: Port ${SOCKS_PROXY_PORT} is already in use${NC}"
    echo "Please stop the process using this port or change SOCKS_PROXY_PORT"
    exit 1
fi

echo -e "${GREEN}Starting sandbox...${NC}"
echo ""

# Export environment variables for the runtime
export ANTHROPIC_HTTP_PROXY_PORT="${HTTP_PROXY_PORT}"
export ANTHROPIC_SOCKS_PROXY_PORT="${SOCKS_PROXY_PORT}"

# Start the sandbox runtime
npx @anthropic-ai/sandbox-runtime "${RUNTIME}"
