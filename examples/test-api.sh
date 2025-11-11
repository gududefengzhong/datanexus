#!/bin/bash

# DataNexus Agent API Test Script
# This script demonstrates all Agent API endpoints

# Configuration
API_KEY="sk_OTk0YjJkNGQtNTY3Yi00MjJkLWI1OGYt"
BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  DataNexus Agent API Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Search all datasets
echo -e "${GREEN}Test 1: Search all datasets${NC}"
echo -e "${YELLOW}GET /api/agent/datasets${NC}"
curl -s "$BASE_URL/api/agent/datasets" \
  -H "Authorization: Bearer $API_KEY" | jq '.data.pagination'
echo -e "\n"

# Test 2: Search with query
echo -e "${GREEN}Test 2: Search with query 'Test'${NC}"
echo -e "${YELLOW}GET /api/agent/datasets?q=Test${NC}"
curl -s "$BASE_URL/api/agent/datasets?q=Test&limit=5" \
  -H "Authorization: Bearer $API_KEY" | jq '.data.datasets[] | {id, name, price}'
echo -e "\n"

# Test 3: Filter by price
echo -e "${GREEN}Test 3: Filter by price (max 1 SOL)${NC}"
echo -e "${YELLOW}GET /api/agent/datasets?maxPrice=1${NC}"
curl -s "$BASE_URL/api/agent/datasets?maxPrice=1&limit=5" \
  -H "Authorization: Bearer $API_KEY" | jq '.data.datasets[] | {name, price}'
echo -e "\n"

# Test 4: Sort by purchases
echo -e "${GREEN}Test 4: Sort by purchases (descending)${NC}"
echo -e "${YELLOW}GET /api/agent/datasets?sortBy=purchases&order=desc${NC}"
curl -s "$BASE_URL/api/agent/datasets?sortBy=purchases&order=desc&limit=5" \
  -H "Authorization: Bearer $API_KEY" | jq '.data.datasets[] | {name, purchases}'
echo -e "\n"

# Get first dataset ID for detailed tests
DATASET_ID=$(curl -s "$BASE_URL/api/agent/datasets?limit=1" \
  -H "Authorization: Bearer $API_KEY" | jq -r '.data.datasets[0].id')

echo -e "${BLUE}Using dataset ID: $DATASET_ID${NC}\n"

# Test 5: Get dataset details
echo -e "${GREEN}Test 5: Get dataset details${NC}"
echo -e "${YELLOW}GET /api/agent/datasets/$DATASET_ID${NC}"
curl -s "$BASE_URL/api/agent/datasets/$DATASET_ID" \
  -H "Authorization: Bearer $API_KEY" | jq '.data | {id, name, price, views, purchases, isEncrypted}'
echo -e "\n"

# Test 6: Preview dataset
echo -e "${GREEN}Test 6: Preview dataset (first 10 rows)${NC}"
echo -e "${YELLOW}GET /api/agent/datasets/$DATASET_ID/preview${NC}"
curl -s "$BASE_URL/api/agent/datasets/$DATASET_ID/preview" \
  -H "Authorization: Bearer $API_KEY" | jq '.'
echo -e "\n"

# Test 7: Get purchase history
echo -e "${GREEN}Test 7: Get purchase history${NC}"
echo -e "${YELLOW}GET /api/agent/purchases${NC}"
curl -s "$BASE_URL/api/agent/purchases" \
  -H "Authorization: Bearer $API_KEY" | jq '.data.purchases[] | {productName: .product.name, amount, downloadCount}'
echo -e "\n"

# Test 8: Invalid API key
echo -e "${GREEN}Test 8: Test with invalid API key${NC}"
echo -e "${YELLOW}GET /api/agent/datasets (with invalid key)${NC}"
curl -s "$BASE_URL/api/agent/datasets" \
  -H "Authorization: Bearer invalid_key" | jq '.'
echo -e "\n"

# Test 9: Missing API key
echo -e "${GREEN}Test 9: Test without API key${NC}"
echo -e "${YELLOW}GET /api/agent/datasets (no auth header)${NC}"
curl -s "$BASE_URL/api/agent/datasets" | jq '.'
echo -e "\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  All tests completed!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${GREEN}Summary:${NC}"
echo -e "✅ Search datasets"
echo -e "✅ Filter and sort"
echo -e "✅ Get dataset details"
echo -e "✅ Preview datasets"
echo -e "✅ Get purchase history"
echo -e "✅ Error handling"
echo -e "\n${YELLOW}Note: Purchase and download tests require actual Solana transactions${NC}"

