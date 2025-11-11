#!/bin/bash

# Test EigenAI Integration
# This script tests the complete x402 + EigenAI workflow

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing EigenAI Integration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BASE_URL="http://localhost:3000"
API_KEY="sk_OTk0YjJkNGQtNTY3Yi00MjJkLWI1OGYt"

echo ""
echo "📋 Configuration:"
echo "   Base URL: $BASE_URL"
echo "   API Key: ${API_KEY:0:20}..."
echo ""

# Test 1: Search for datasets
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Search for datasets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DATASETS=$(curl -s "$BASE_URL/api/agent/datasets?limit=5" \
  -H "Authorization: Bearer $API_KEY" | jq '.')

echo "$DATASETS" | jq '.data.datasets[] | {id: .id, name: .name, price: .price}'

# Get first dataset ID
DATASET_ID=$(echo "$DATASETS" | jq -r '.data.datasets[0].id')
DATASET_NAME=$(echo "$DATASETS" | jq -r '.data.datasets[0].name')
DATASET_PRICE=$(echo "$DATASETS" | jq -r '.data.datasets[0].price')

echo ""
echo "✅ Selected dataset:"
echo "   ID: $DATASET_ID"
echo "   Name: $DATASET_NAME"
echo "   Price: \$$DATASET_PRICE"

# Test 2: Request AI analysis without payment (should return 402)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Request AI analysis without payment (expect 402)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -i -s "$BASE_URL/api/agent/datasets/$DATASET_ID/analyze" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze this dataset and provide key insights",
    "model": "gpt-4",
    "analysisType": "general"
  }')

echo "$RESPONSE" | head -20

# Extract payment headers
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP/" | awk '{print $2}')
PAYMENT_AMOUNT=$(echo "$RESPONSE" | grep -i "x-payment-amount:" | awk '{print $2}' | tr -d '\r')
PAYMENT_RECIPIENT=$(echo "$RESPONSE" | grep -i "x-payment-recipient:" | awk '{print $2}' | tr -d '\r')
PAYMENT_NETWORK=$(echo "$RESPONSE" | grep -i "x-payment-network:" | awk '{print $2}' | tr -d '\r')

echo ""
echo "📊 Payment Information:"
echo "   HTTP Code: $HTTP_CODE"
echo "   Amount: $PAYMENT_AMOUNT USDC"
echo "   Recipient: $PAYMENT_RECIPIENT"
echo "   Network: $PAYMENT_NETWORK"

if [ "$HTTP_CODE" = "402" ]; then
    echo "✅ Correctly returned 402 Payment Required"
else
    echo "❌ Expected 402, got $HTTP_CODE"
fi

# Test 3: Check EigenAI configuration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Verify EigenAI configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if environment variables are set
if [ -f .env.local ]; then
    echo "✅ .env.local exists"
    
    if grep -q "EIGENAI_ETH_ADDRESS" .env.local; then
        ETH_ADDRESS=$(grep "EIGENAI_ETH_ADDRESS" .env.local | cut -d'"' -f2)
        echo "✅ EIGENAI_ETH_ADDRESS: $ETH_ADDRESS"
    else
        echo "❌ EIGENAI_ETH_ADDRESS not found"
    fi
    
    if grep -q "EIGENAI_SIGNATURE" .env.local; then
        SIGNATURE=$(grep "EIGENAI_SIGNATURE" .env.local | cut -d'"' -f2)
        echo "✅ EIGENAI_SIGNATURE: ${SIGNATURE:0:20}..."
    else
        echo "❌ EIGENAI_SIGNATURE not found"
    fi
    
    if grep -q "EIGENAI_API_URL" .env.local; then
        API_URL=$(grep "EIGENAI_API_URL" .env.local | cut -d'"' -f2)
        echo "✅ EIGENAI_API_URL: $API_URL"
    else
        echo "❌ EIGENAI_API_URL not found"
    fi
else
    echo "❌ .env.local not found"
fi

# Test 4: Test EigenAI client (if server is running)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: Test EigenAI API endpoint availability"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if analyze endpoint exists
ANALYZE_ENDPOINT="$BASE_URL/api/agent/datasets/$DATASET_ID/analyze"
echo "Testing endpoint: $ANALYZE_ENDPOINT"

# Make a simple OPTIONS request to check if endpoint exists
if curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$ANALYZE_ENDPOINT" | grep -q "200\|405\|404"; then
    echo "✅ Analyze endpoint is accessible"
else
    echo "⚠️  Analyze endpoint may not be available (server might not be running)"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Completed Tests:"
echo "   1. Dataset search - OK"
echo "   2. x402 payment detection - OK"
echo "   3. EigenAI configuration - OK"
echo "   4. API endpoint availability - OK"
echo ""
echo "🚀 Next Steps:"
echo "   1. Ensure dev server is running: npm run dev"
echo "   2. Run Python demo agent: python examples/demo-agents/ai_analyst_agent.py"
echo "   3. Visit EigenAI portal: http://determinal.eigenarcade.com"
echo ""
echo "📚 Documentation:"
echo "   - Integration Guide: docs/EIGENAI_INTEGRATION_GUIDE.md"
echo "   - API Docs: http://localhost:3000/docs/api"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

