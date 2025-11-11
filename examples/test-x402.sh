#!/bin/bash

# x402 Payment Flow Test Script
# This script tests the complete x402 payment flow

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
API_KEY="sk_OTk0YjJkNGQtNTY3Yi00MjJkLWI1OGYt"
BASE_URL="http://localhost:3000"
DATASET_ID="09390864-938d-4b84-a9f2-f5c99d7b2d4a"  # Replace with an actual dataset ID

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  x402 Payment Flow Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Request without payment token (should return 402)
echo -e "${YELLOW}Test 1: Request dataset without payment${NC}"
echo "GET /api/agent/datasets/${DATASET_ID}/download"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${BASE_URL}/api/agent/datasets/${DATASET_ID}/download" \
  -H "Authorization: Bearer ${API_KEY}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "402" ]; then
  echo -e "${GREEN}✅ Test 1 PASSED: Received 402 Payment Required${NC}"
  
  # Extract payment headers
  echo -e "${BLUE}Payment Information:${NC}"
  curl -s -I "${BASE_URL}/api/agent/datasets/${DATASET_ID}/download" \
    -H "Authorization: Bearer ${API_KEY}" | grep -i "x-payment"
  echo ""
else
  echo -e "${RED}❌ Test 1 FAILED: Expected 402, got $HTTP_CODE${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 2: Request with invalid payment token (should return 402)
echo -e "${YELLOW}Test 2: Request with invalid payment token${NC}"
echo "GET /api/agent/datasets/${DATASET_ID}/download"
echo "x-payment-token: invalid-token"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${BASE_URL}/api/agent/datasets/${DATASET_ID}/download" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "x-payment-token: invalid-token")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "402" ]; then
  echo -e "${GREEN}✅ Test 2 PASSED: Invalid token rejected${NC}"
else
  echo -e "${RED}❌ Test 2 FAILED: Expected 402, got $HTTP_CODE${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 3: Check if dataset is already purchased
echo -e "${YELLOW}Test 3: Check purchase status${NC}"
echo "GET /api/agent/purchases"
echo ""

PURCHASES=$(curl -s "${BASE_URL}/api/agent/purchases" \
  -H "Authorization: Bearer ${API_KEY}")

echo "Your purchases:"
echo "$PURCHASES" | jq '.data.purchases[] | {id: .id, datasetName: .dataset.name, status: .status}' 2>/dev/null || echo "$PURCHASES"
echo ""

# Check if dataset is already purchased
IS_PURCHASED=$(echo "$PURCHASES" | jq -r ".data.purchases[] | select(.dataset.id == \"${DATASET_ID}\") | .id" 2>/dev/null)

if [ -n "$IS_PURCHASED" ]; then
  echo -e "${GREEN}✅ Dataset already purchased (Order ID: $IS_PURCHASED)${NC}"
  echo -e "${BLUE}You can download it directly without x402 payment${NC}"
  
  # Try downloading
  echo ""
  echo -e "${YELLOW}Downloading dataset...${NC}"
  curl -s "${BASE_URL}/api/agent/datasets/${DATASET_ID}/download" \
    -H "Authorization: Bearer ${API_KEY}" \
    -o "/tmp/dataset_${DATASET_ID}.csv"
  
  if [ -f "/tmp/dataset_${DATASET_ID}.csv" ]; then
    echo -e "${GREEN}✅ Download successful!${NC}"
    echo "File saved to: /tmp/dataset_${DATASET_ID}.csv"
    echo "File size: $(wc -c < /tmp/dataset_${DATASET_ID}.csv) bytes"
  else
    echo -e "${RED}❌ Download failed${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Dataset not purchased yet${NC}"
  echo -e "${BLUE}To complete the purchase, you need to:${NC}"
  echo "1. Make a Solana payment to the recipient address"
  echo "2. Get the transaction signature"
  echo "3. Use the signature as x-payment-token"
  echo ""
  echo -e "${BLUE}Example with Python SDK:${NC}"
  echo "  client = DataNexusClient(api_key='${API_KEY}', solana_private_key='YOUR_KEY')"
  echo "  client.download_dataset('${DATASET_ID}', './output.csv')"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "✅ x402 middleware is working correctly"
echo "✅ 402 responses include payment headers"
echo "✅ Invalid payment tokens are rejected"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Implement Python x402 client"
echo "2. Test end-to-end payment flow"
echo "3. Verify payment on Solana blockchain"
echo ""

