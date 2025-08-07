#!/bin/bash

# Saverly Development Server Health Check Runner
# Usage: ./run-health-check.sh [URL] [OPTIONS]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏥 Saverly Development Server Health Check${NC}"
echo "=========================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js to run health checks.${NC}"
    exit 1
fi

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Node modules not found. Installing dependencies...${NC}"
    npm install
fi

# Default URL
DEFAULT_URL="http://localhost:5177"
URL=${1:-$DEFAULT_URL}

echo -e "${BLUE}🎯 Target URL: ${URL}${NC}"
echo ""

# Check if server is running by attempting a quick connection
echo -e "${BLUE}🔍 Checking if server is running...${NC}"
if ! curl -s --connect-timeout 5 "$URL" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server is not responding at ${URL}${NC}"
    echo -e "${YELLOW}💡 Make sure to start your development server first:${NC}"
    echo "   npm run dev"
    echo ""
    echo -e "${YELLOW}⚠️  Proceeding with health check anyway (may fail)...${NC}"
    echo ""
fi

# Run the health check with the provided URL
echo -e "${BLUE}🚀 Running comprehensive health check...${NC}"
echo ""

# Build the command with optional arguments
CMD="node health-check.cjs"

if [ "$URL" != "$DEFAULT_URL" ]; then
    CMD="$CMD --url=$URL"
fi

# Add any additional arguments passed to the script
shift 2>/dev/null || true  # Remove first argument (URL) if it exists
for arg in "$@"; do
    CMD="$CMD $arg"
done

# Execute the health check
eval $CMD
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Health check completed successfully!${NC}"
    echo -e "${GREEN}🎉 Your development server is ready for use.${NC}"
else
    echo -e "${RED}❌ Health check failed with issues.${NC}"
    echo -e "${YELLOW}📋 Please review the results above and follow the recommendations.${NC}"
fi

exit $EXIT_CODE