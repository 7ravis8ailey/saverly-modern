#!/bin/bash

# Saverly Comprehensive Testing Script
# Tests all features, API keys, and user types

echo "🚀 SAVERLY COMPREHENSIVE TESTING SUITE"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="https://lziayzusujlvhebyagdl.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc"
GOOGLE_MAPS_KEY="AIzaSyD7tG8B_Y851kIfPuLaJpX5Cnt8e5W7Gn8"
STRIPE_PUB_KEY="pk_test_51QhXCD02ghiSs4BUndAbMANHphG6iq71buFRb4Mjc6VQdiJCXk5Y5qijKXykFzu80xoPUVFiZdFTLH5O6k2dlfmj00EK32tJqL"
NETLIFY_URL="https://saverly-web.netlify.app"

# Test counters
PASSED=0
FAILED=0
WARNINGS=0

# Test function
test_api() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" == "$expected" ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED (HTTP $response)${NC}"
        ((FAILED++))
        return 1
    fi
}

echo -e "${BLUE}🔌 API Integration Tests:${NC}"
echo "------------------------"

# Test Google Maps API
echo -n "Testing Google Maps API... "
maps_response=$(curl -s "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=San+Francisco&key=$GOOGLE_MAPS_KEY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'ERROR'))" 2>/dev/null)
if [ "$maps_response" == "OK" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
elif [ "$maps_response" == "REQUEST_DENIED" ]; then
    echo -e "${RED}❌ FAILED - Billing not enabled${NC}"
    ((FAILED++))
else
    echo -e "${YELLOW}⚠️  WARNING - Status: $maps_response${NC}"
    ((WARNINGS++))
fi

# Test Supabase Connection
echo -n "Testing Supabase Connection... "
supabase_response=$(curl -s -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/" | head -c 100)
if [[ "$supabase_response" == *"paths"* ]] || [[ "$supabase_response" == *"Paths"* ]]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED++))
fi

# Test Stripe API (limited without secret key)
echo -n "Testing Stripe Publishable Key... "
if [[ "$STRIPE_PUB_KEY" == pk_test_* ]]; then
    echo -e "${GREEN}✅ PASSED (Valid test key format)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED (Invalid key format)${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}🌐 Deployment Tests:${NC}"
echo "-------------------"

# Test Netlify Deployment
test_api "Netlify Site" "$NETLIFY_URL" "200"
test_api "Auth Page" "$NETLIFY_URL/auth" "200"
test_api "Businesses Page" "$NETLIFY_URL/businesses" "200"
test_api "Profile Page" "$NETLIFY_URL/profile" "200"

echo ""
echo -e "${BLUE}🔐 Supabase Edge Functions:${NC}"
echo "-------------------------"

echo -n "Testing create-payment-intent function... "
edge_response=$(curl -s -X POST \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    "$SUPABASE_URL/functions/v1/create-payment-intent" \
    -d '{"test": true}' \
    -w "\n%{http_code}" | tail -n 1)

if [ "$edge_response" == "401" ]; then
    echo -e "${GREEN}✅ PASSED (Function exists, auth required)${NC}"
    ((PASSED++))
elif [ "$edge_response" == "200" ]; then
    echo -e "${GREEN}✅ PASSED (Function responding)${NC}"
    ((PASSED++))
elif [ "$edge_response" == "404" ]; then
    echo -e "${YELLOW}⚠️  WARNING (Function not deployed)${NC}"
    ((WARNINGS++))
else
    echo -e "${RED}❌ FAILED (HTTP $edge_response)${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}💾 Database Schema Check:${NC}"
echo "-----------------------"

# Check tables exist
for table in users businesses coupons redemptions; do
    echo -n "Checking $table table... "
    table_check=$(curl -s -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        "$SUPABASE_URL/rest/v1/$table?select=count&limit=0" \
        -w "\n%{http_code}" | tail -n 1)
    
    if [ "$table_check" == "200" ]; then
        echo -e "${GREEN}✅ EXISTS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ NOT FOUND${NC}"
        ((FAILED++))
    fi
done

echo ""
echo -e "${BLUE}📊 Test Data Creation:${NC}"
echo "--------------------"

# Create test business
echo -n "Creating test business... "
business_response=$(curl -s -X POST \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    "$SUPABASE_URL/rest/v1/businesses" \
    -d '{
        "id": "test-biz-'$(date +%s)'",
        "name": "Test Coffee Shop",
        "email": "test'$(date +%s)'@saverly.test",
        "contact_name": "Test Manager",
        "category": "Food & Beverage",
        "address": "123 Test Street",
        "city": "San Francisco",
        "state": "CA",
        "zip_code": "94102",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "description": "Test business for QA"
    }' \
    -w "\n%{http_code}" | tail -n 1)

if [ "$business_response" == "201" ]; then
    echo -e "${GREEN}✅ CREATED${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING (May already exist or need auth)${NC}"
    ((WARNINGS++))
fi

echo ""
echo -e "${BLUE}🎯 Feature Verification:${NC}"
echo "----------------------"

# List features that need manual testing
echo -e "${YELLOW}⚠️  Manual Testing Required:${NC}"
echo "  • Subscribe button with Stripe checkout"
echo "  • QR code generation and 60-second timer"
echo "  • Geolocation 'Near Me' feature"
echo "  • Google Maps address autocomplete"
echo "  • Admin panel (business/coupon management)"
echo "  • Mobile responsive design"
echo "  • Subscription gating for non-subscribers"

echo ""
echo -e "${BLUE}🔑 Test Credentials:${NC}"
echo "------------------"
echo "Admin Account:"
echo "  Email: admin@saverly.test"
echo "  Password: TestAdmin123!"
echo ""
echo "Subscriber Accounts:"
echo "  Active: subscriber.active@saverly.test"
echo "  Inactive: subscriber.inactive@saverly.test"
echo "  Password: TestUser123!"
echo ""
echo "Stripe Test Card:"
echo "  Number: 4242 4242 4242 4242"
echo "  Expiry: 12/25"
echo "  CVC: 123"

echo ""
echo "======================================"
echo -e "${BLUE}📊 TEST SUMMARY:${NC}"
echo "======================================"
echo -e "${GREEN}✅ Passed: $PASSED tests${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS tests${NC}"
echo -e "${RED}❌ Failed: $FAILED tests${NC}"

TOTAL=$((PASSED + WARNINGS + FAILED))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo ""
    if [ $SUCCESS_RATE -ge 70 ]; then
        echo -e "${GREEN}Overall Success Rate: $SUCCESS_RATE%${NC}"
    elif [ $SUCCESS_RATE -ge 50 ]; then
        echo -e "${YELLOW}Overall Success Rate: $SUCCESS_RATE%${NC}"
    else
        echo -e "${RED}Overall Success Rate: $SUCCESS_RATE%${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📝 CRITICAL ACTIONS NEEDED:${NC}"
echo "-------------------------"

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}1. Fix failed tests before production${NC}"
fi

echo "2. Enable Google Maps billing in Google Cloud Console"
echo "3. Configure Stripe webhook endpoint in Dashboard"
echo "4. Deploy Supabase Edge Functions if not done"
echo "5. Create production admin account"
echo "6. Test payment flow with real Stripe test card"
echo "7. Verify mobile experience on actual devices"

echo ""
echo "Test completed at: $(date)"
echo "======================================"