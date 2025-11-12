# x402 Purchase Flow

## Overview

DataNexus now implements the **HTTP 402 Payment Required** protocol (x402) for both web UI and API purchases.

## x402 Protocol Flow

### 1. Initial Request (No Payment)

**Request:**
```http
GET /api/products/{id}/download
Authorization: Bearer {auth_token}
```

**Response: HTTP 402 Payment Required**
```http
HTTP/1.1 402 Payment Required
x-payment-amount: 0.1
x-payment-currency: USDC
x-payment-recipient: 3RxgsquoKv6jgfLZoqbpZUpbV5uJsV7fxMqqKbgruatG
x-payment-network: solana-devnet
x-payment-facilitator: https://facilitator.payai.network

{
  "success": false,
  "error": {
    "code": "PAYMENT_REQUIRED",
    "message": "Purchase dataset: Dataset Name",
    "details": {
      "price": "0.1",
      "currency": "USDC",
      "network": "solana-devnet"
    }
  }
}
```

### 2. Make Payment on Solana

Client makes a Solana payment transaction:
- **Amount**: Value from `x-payment-amount` header
- **Recipient**: Address from `x-payment-recipient` header
- **Network**: Solana Devnet (from `x-payment-network` header)

**Result**: Transaction signature (e.g., `5jZb2xbnkXSTyS61hQh1LDPijeRSg5vvpMX55HZCxPSjfkBm78u2YsaAmmAcyvaN2RngL1jXtB1QRgn4j7XF6DQy`)

### 3. Retry Request with Payment Token

**Request:**
```http
GET /api/products/{id}/download
Authorization: Bearer {auth_token}
x-payment-token: 5jZb2xbnkXSTyS61hQh1LDPijeRSg5vvpMX55HZCxPSjfkBm78u2YsaAmmAcyvaN2RngL1jXtB1QRgn4j7XF6DQy
```

**Response: HTTP 200 OK**
```http
HTTP/1.1 200 OK
Content-Type: text/csv
Content-Disposition: attachment; filename="dataset.csv"
x-payment-verified: true
x-payment-signature: 5jZb2xbnkXSTyS61hQh1LDPijeRSg5vvpMX55HZCxPSjfkBm78u2YsaAmmAcyvaN2RngL1jXtB1QRgn4j7XF6DQy

[File content]
```

---

## Implementation

### Web UI (React/Next.js)

**File**: `app/products/[id]/page.tsx`

```typescript
const handlePurchase = async () => {
  // Step 1: Try to download (will receive HTTP 402)
  const downloadResponse = await fetch(`/api/products/${product.id}/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (downloadResponse.status === 402) {
    // Step 2: Parse x402 payment headers
    const paymentAmount = downloadResponse.headers.get('x-payment-amount')
    const paymentRecipient = downloadResponse.headers.get('x-payment-recipient')

    // Step 3: Make Solana payment
    const paymentResult = await initiatePayment({
      productId: product.id,
      productName: product.name,
      amount: parseFloat(paymentAmount),
      recipientAddress: paymentRecipient,
    }, publicKey, signTransaction)

    // Step 4: Retry download with payment token
    const downloadWithPaymentResponse = await fetch(`/api/products/${product.id}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-payment-token': paymentResult.txHash,
      },
    })

    // Success!
  }
}
```

### Python SDK

**File**: `hackathon-demo/datanexus_client.py`

```python
def download_dataset(self, dataset_id: str, auto_pay: bool = False):
    url = f"{self.base_url}/api/agent/datasets/{dataset_id}/download"
    
    try:
        response = self.session.get(url, stream=True)
        response.raise_for_status()
        
        # Success - already purchased
        return {
            "success": True,
            "data": response.content
        }
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 402:
            # HTTP 402 Payment Required
            headers = e.response.headers
            return {
                "paymentRequired": True,
                "statusCode": 402,
                "amount": headers.get("x-payment-amount"),
                "currency": headers.get("x-payment-currency", "USDC"),
                "recipient": headers.get("x-payment-recipient"),
                "network": headers.get("x-payment-network", "solana"),
                "message": "Payment required to access this dataset",
                "datasetId": dataset_id
            }
```

---

## Backend Endpoints

### Web UI Endpoint

**Endpoint**: `GET /api/products/[id]/download`
- **Authentication**: JWT token (Bearer)
- **x402 Protocol**: ✅ Enabled
- **Payment Verification**: Solana blockchain + Facilitator

### Agent API Endpoint

**Endpoint**: `GET /api/agent/datasets/[id]/download`
- **Authentication**: API key (Bearer)
- **x402 Protocol**: ✅ Enabled
- **Payment Verification**: Solana blockchain + Facilitator

Both endpoints use the same `requirePayment()` middleware from `lib/x402-middleware.ts`.

---

## Payment Verification

The `requirePayment()` middleware verifies payments using two methods:

### 1. Facilitator Verification (Recommended)

```typescript
POST https://facilitator.payai.network/verify
Content-Type: application/json

{
  "signature": "5jZb2xbnkXSTyS61hQh1...",
  "amount": "0.1",
  "recipient": "3RxgsquoKv6jgfLZoqbpZUpbV5uJsV7fxMqqKbgruatG",
  "network": "solana-devnet"
}
```

### 2. Solana Blockchain Verification (Fallback)

If facilitator fails, the middleware directly queries the Solana blockchain to verify the transaction.

---

## Benefits of x402 Protocol

1. ✅ **Standardized**: Uses HTTP 402 status code and standard headers
2. ✅ **Decentralized**: Payment verification on Solana blockchain
3. ✅ **Flexible**: Works with any Solana wallet
4. ✅ **Transparent**: All payment details in HTTP headers
5. ✅ **Secure**: Cryptographic verification of transactions
6. ✅ **Interoperable**: Compatible with x402 facilitators and tools

---

## Testing

### Test x402 Flow (Web UI)

1. Visit a dataset page: `http://localhost:3000/products/{id}`
2. Click "Purchase Dataset"
3. Open browser DevTools → Network tab
4. Observe:
   - First request: `402 Payment Required` with `x-payment-*` headers
   - Solana payment transaction
   - Second request: `200 OK` with file download

### Test x402 Flow (Python SDK)

```bash
cd hackathon-demo
python demo_test.py
```

Look for **Test 3: HTTP 402 Payment Required** output:

```
✅ ✅ Received HTTP 402 Payment Required

  💰 Amount: 0.1 USDC
  📍 Recipient: 3RxgsquoKv6jgfLZoqbp...
  🌐 Network: solana-devnet
  💬 Message: Payment required to access this dataset
```

---

## Environment Variables

```bash
# x402 Configuration
X402_NETWORK=solana-devnet
PAYMENT_WALLET_ADDRESS=3RxgsquoKv6jgfLZoqbpZUpbV5uJsV7fxMqqKbgruatG
FACILITATOR_URL=https://facilitator.payai.network

# Solana RPC
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

---

## Migration Notes

### Old Flow (Deprecated)

```
1. POST /api/orders (create pending order)
2. Make Solana payment
3. POST /api/orders/{id}/confirm (confirm order)
4. GET /api/decrypt (download file)
```

### New Flow (x402)

```
1. GET /api/products/{id}/download (receive 402)
2. Make Solana payment
3. GET /api/products/{id}/download with x-payment-token (receive file)
```

**Benefits**:
- ✅ Fewer API calls (3 → 2)
- ✅ Standard HTTP 402 protocol
- ✅ Automatic order creation on payment verification
- ✅ Consistent with Agent API flow

