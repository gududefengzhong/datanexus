# 🔌 API Documentation - DataNexus

Complete API reference for integrating DataNexus into your AI agents and applications.

---

## 🚀 Quick Start

### Base URL
```
Production: https://datanexus-da1ff0wj3-rochestors-projects.vercel.app/api
Staging: https://datanexus-staging.vercel.app/api
Development: http://localhost:3000/api
```

### Authentication

All API requests require an API key in the `Authorization` header:

```bash
Authorization: Bearer YOUR_API_KEY
```

**Get your API key**:
1. Visit [API Keys](/settings/api-keys)
2. Click "Generate New Key"
3. Copy and store securely (shown only once!)

---

## 📚 Endpoints

### **Datasets**

#### 1. Search Datasets

Search for datasets by query, category, and price range.

```http
GET /api/agent/datasets/search
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No | Search keywords |
| `category` | string | No | Filter by category (defi, social, market, nft, gaming) |
| `minPrice` | number | No | Minimum price in USDC |
| `maxPrice` | number | No | Maximum price in USDC |
| `limit` | integer | No | Results per page (default: 20, max: 100) |
| `page` | integer | No | Page number (default: 1) |

**Example Request**:
```bash
curl -X GET "${BASE_URL}/api/agent/datasets/search?query=DeFi&category=defi&maxPrice=1.0" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "datasets": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Solana DEX Trading Volume - Q4 2024",
        "description": "Complete trading data from major Solana DEXs",
        "category": "defi",
        "price": 0.5,
        "provider": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
        "fileSize": 45678901,
        "downloadCount": 234,
        "rating": 4.8,
        "createdAt": "2024-11-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

#### 2. Get Dataset Details

Get detailed information about a specific dataset.

```http
GET /api/agent/datasets/{id}
```

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Dataset ID |

**Example Request**:
```bash
curl -X GET "${BASE_URL}/api/agent/datasets/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Solana DEX Trading Volume - Q4 2024",
    "description": "Complete trading data...",
    "category": "defi",
    "price": 0.5,
    "provider": {
      "walletAddress": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
      "name": "DeFi Data Labs",
      "rating": 4.9,
      "totalSales": 1234
    },
    "fileSize": 45678901,
    "fileType": "csv",
    "downloadCount": 234,
    "rating": 4.8,
    "tags": ["solana", "dex", "trading", "defi"],
    "createdAt": "2024-11-01T00:00:00Z",
    "updatedAt": "2024-11-10T00:00:00Z"
  }
}
```

---

#### 3. Download Dataset (x402 Payment)

Download a dataset. Returns HTTP 402 if payment required.

```http
GET /api/agent/datasets/{id}/download
```

**Headers**:
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Authorization` | string | Yes | Bearer token with API key |
| `x-payment-token` | string | No | Solana transaction signature (for payment verification) |

**x402 Payment Flow**:

**Step 1**: Request without payment token
```bash
curl -X GET "${BASE_URL}/api/agent/datasets/{id}/download" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response (402 Payment Required)**:
```http
HTTP/1.1 402 Payment Required
x-payment-amount: 0.5
x-payment-recipient: 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin
x-payment-currency: USDC
x-payment-chain: solana
```

**Step 2**: Make Solana USDC payment
```python
# Use Solana SDK to send USDC
signature = send_usdc_payment(
    recipient="9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    amount=0.5
)
```

**Step 3**: Retry with payment token
```bash
curl -X GET "${BASE_URL}/api/agent/datasets/{id}/download" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-payment-token: {SOLANA_TX_SIGNATURE}"
```

**Response (200 OK)**:
```http
HTTP/1.1 200 OK
Content-Type: text/csv
Content-Disposition: attachment; filename="dataset.csv"

[CSV DATA]
```

---

#### 4. Analyze Dataset (EigenAI)

Analyze a dataset with EigenAI verifiable inference.

```http
POST /api/agent/datasets/{id}/analyze
```

**Request Body**:
```json
{
  "prompt": "Analyze this DeFi data and provide insights",
  "model": "gpt-oss-120b-f16",
  "analysisType": "general",
  "maxTokens": 2000,
  "temperature": 0.7
}
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Analysis prompt/question |
| `model` | string | No | AI model (default: gpt-oss-120b-f16) |
| `analysisType` | string | No | Type: general, sentiment, trading-signals, prediction |
| `maxTokens` | integer | No | Max tokens (default: 2000) |
| `temperature` | number | No | Temperature 0-1 (default: 0.7) |

**Example Request**:
```bash
curl -X POST "${BASE_URL}/api/agent/datasets/{id}/analyze" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze this DeFi protocol data",
    "model": "gpt-oss-120b-f16",
    "analysisType": "general"
  }'
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "analysis": {
      "summary": "The DeFi protocol shows strong growth...",
      "key_insights": [
        "TVL increased 45% in Q4",
        "Solana dominates with 60% market share"
      ],
      "recommendation": "Bullish outlook for Q1 2025"
    },
    "verified": true,
    "txHash": "5j7s...8k2p",
    "tokensUsed": 1234,
    "model": "gpt-oss-120b-f16"
  }
}
```

---

### **Purchases**

#### 5. Get Purchase History

Get your purchase history with pagination.

```http
GET /api/agent/purchases
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Results per page (default: 50, max: 100) |
| `page` | integer | No | Page number (default: 1) |
| `status` | string | No | Filter by status (completed, pending, failed, refunded) |

**Example Request**:
```bash
curl -X GET "${BASE_URL}/api/agent/purchases?limit=10&page=1" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "order_123",
      "datasetId": "550e8400-e29b-41d4-a716-446655440000",
      "datasetName": "Solana DEX Trading Volume",
      "amount": 0.5,
      "status": "completed",
      "signature": "5j7s8k2p...",
      "downloadCount": 3,
      "createdAt": "2024-11-10T12:00:00Z",
      "explorerUrl": "https://explorer.solana.com/tx/5j7s8k2p...?cluster=devnet"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "page": 1,
    "totalPages": 3
  }
}
```

---

## 🐍 Python SDK

### Installation

```bash
pip install requests solana spl-token base58
```

### Usage

```python
from x402_example import SimpleX402Client

# Initialize client
client = SimpleX402Client(
    api_key="YOUR_API_KEY",
    solana_private_key="YOUR_SOLANA_PRIVATE_KEY",
    base_url="https://datanexus-da1ff0wj3-rochestors-projects.vercel.app"  # or use localhost:3000 for development
)

# Search datasets
datasets = client.search_datasets(
    query="DeFi",
    category="defi",
    max_price=1.0
)

# Download with auto-payment
result = client.download_dataset(
    dataset_id=datasets['data']['datasets'][0]['id'],
    auto_pay=True
)

# Analyze with EigenAI
analysis = client.analyze_dataset(
    dataset_id=dataset_id,
    prompt="Analyze this data...",
    model="gpt-oss-120b-f16"
)

# Get purchase history
purchases = client.get_purchase_history(limit=50)
```

---

## 🔐 Authentication

### API Key Management

**Generate API Key**:
```bash
POST /api/auth/api-keys
```

**Revoke API Key**:
```bash
DELETE /api/auth/api-keys/{keyId}
```

**List API Keys**:
```bash
GET /api/auth/api-keys
```

---

## ⚠️ Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `PAYMENT_REQUIRED` | 402 | Payment required to access resource |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 📊 Rate Limits

| Tier | Requests/minute | Requests/day |
|------|-----------------|--------------|
| Free | 60 | 1,000 |
| Pro | 600 | 50,000 |
| Enterprise | Unlimited | Unlimited |

**Rate limit headers**:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699564800
```

---

## 🧪 Testing

### Devnet vs Mainnet

**Devnet** (for testing):
- Use devnet USDC
- Free SOL from faucet
- No real money

**Mainnet** (production):
- Real USDC required
- Real SOL for fees
- Real payments

### Test API Key

```
sk_test_OTk0YjJkNGQtNTY3Yi00MjJkLWI1OGYt
```

---

## 📖 Examples

See complete examples in:
- [Python SDK](../examples/python-sdk/x402_example.py)
- [Demo Agent](../examples/demo-agents/ai_analyst_agent.py)
- [Complete x402 Flow](../examples/demo_x402_complete_flow.py)

---

## 🆘 Support

- **Documentation**: [DataNexus Docs](/docs)
- **API Status**: [status.datanexus.io](#)
- **Discord**: [Join community](https://discord.gg/x402)
- **Email**: greennft.eth@gmail.com

---

**Happy building! 🚀**

