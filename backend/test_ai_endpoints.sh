#!/bin/bash

# AI Features Test Script
# This script tests all AI endpoints to ensure they're working correctly

BASE_URL="http://localhost:8000"
API_BASE="${BASE_URL}/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "AI Features Integration Test"
echo "========================================"
echo ""

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    
    echo -n "Testing: $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "  Response: $body" | head -c 200
        echo ""
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "1. Testing Bid Optimization Endpoints"
echo "--------------------------------------"

# Test bid analysis (Note: requires actual bid ID, using 1 as example)
test_endpoint "Analyze Bid Strength" "POST" "${API_BASE}/ai/bids/1/analyze/" ""

test_endpoint "Optimize Bid" "POST" "${API_BASE}/ai/bids/1/optimize/" ""

test_endpoint "Predict Bid Success" "POST" "${API_BASE}/ai/bids/1/predict-success/" ""

echo ""
echo "2. Testing Project Optimization Endpoints"
echo "------------------------------------------"

# Test project optimization (Note: requires actual project ID)
test_endpoint "Optimize Project" "POST" "${API_BASE}/ai/projects/6/optimize/" ""

echo ""
echo "3. Testing Recommendation Endpoints"
echo "------------------------------------"

# These require authentication, so they might fail without proper tokens
test_endpoint "Get Personalized Recommendations" "GET" "${API_BASE}/ai/recommendations/personalized/?limit=5" ""

test_endpoint "Get Trending Opportunities" "GET" "${API_BASE}/ai/recommendations/trending/?limit=3" ""

echo ""
echo "4. Testing Analytics Endpoints"
echo "-------------------------------"

test_endpoint "Get Usage Analytics" "GET" "${API_BASE}/ai/analytics/usage/" ""

test_endpoint "Get Performance Metrics" "GET" "${API_BASE}/ai/analytics/performance/" ""

test_endpoint "Get Cost Analytics" "GET" "${API_BASE}/ai/analytics/costs/" ""

echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}Some tests failed. Check the output above for details.${NC}"
    exit 1
fi
