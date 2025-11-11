# DataNexus Python SDK

A simple Python client for the DataNexus AI Agent API.

## Installation

```bash
pip install requests
```

## Quick Start

### 1. Get Your API Key

1. Visit http://localhost:3000/dashboard/api-keys
2. Create a new API key
3. Copy the key (it won't be shown again!)

### 2. Initialize the Client

```python
from datanexus_client import DataNexusClient

client = DataNexusClient(api_key="your_api_key_here")
```

### 3. Search for Datasets

```python
# Search for Solana blockchain data
results = client.search_datasets(
    query="solana",
    category="blockchain",
    max_price=50
)

print(f"Found {results['data']['pagination']['total']} datasets")

for dataset in results['data']['datasets']:
    print(f"- {dataset['name']} (${dataset['price']})")
```

### 4. Preview a Dataset (Free!)

```python
# Preview first 10 rows
preview = client.preview_dataset(dataset_id="...")

print(f"Total rows: {preview['data']['totalRows']}")
print(f"Columns: {', '.join(preview['data']['columns'])}")
print(f"Preview data:")
for row in preview['data']['preview']:
    print(row)
```

### 5. Purchase a Dataset

#### Option A: Solana Payment

```python
# First, make a Solana payment to the provider's wallet
# Then confirm the purchase with the transaction hash

order = client.purchase_dataset(
    dataset_id="...",
    payment_method="solana",
    payment_tx_hash="your_solana_tx_hash"
)

print(f"Order ID: {order['data']['id']}")
print(f"Status: {order['data']['status']}")
```

#### Option B: x402 Micropayment

```python
# Create x402 payment
payment = client.create_x402_payment(
    product_id="...",
    amount=10.0
)

print(f"Payment URL: {payment['data']['x402Url']}")

# After payment is completed, verify it
verification = client.verify_x402_payment(
    payment_id=payment['data']['paymentId'],
    x402_token="your_x402_token"
)

print(f"Verified: {verification['data']['verified']}")
```

### 6. Download a Dataset

```python
# Download to local file
client.download_dataset(
    dataset_id="...",
    output_path="./data/my_dataset.csv"
)

print("✅ Dataset downloaded!")
```

### 7. View Purchase History

```python
purchases = client.get_purchases()

for purchase in purchases['data']['purchases']:
    print(f"- {purchase['product']['name']}")
    print(f"  Amount: ${purchase['amount']}")
    print(f"  Downloads: {purchase['downloadCount']}")
```

## Complete Example

```python
from datanexus_client import DataNexusClient

# Initialize client
client = DataNexusClient(api_key="your_api_key_here")

# 1. Search for datasets
print("🔍 Searching for datasets...")
results = client.search_datasets(
    query="transaction",
    category="blockchain",
    max_price=100,
    sort_by="purchases",
    order="desc"
)

if not results['data']['datasets']:
    print("No datasets found")
    exit()

# 2. Get the most popular dataset
dataset = results['data']['datasets'][0]
print(f"\n📊 Selected: {dataset['name']}")
print(f"   Price: ${dataset['price']}")
print(f"   Purchases: {dataset['purchases']}")

# 3. Preview the data
print(f"\n👁️ Previewing data...")
try:
    preview = client.preview_dataset(dataset['id'])
    print(f"   Columns: {', '.join(preview['data']['columns'])}")
    print(f"   Sample data:")
    for i, row in enumerate(preview['data']['preview'][:3], 1):
        print(f"   {i}. {row}")
except Exception as e:
    print(f"   Preview not available: {e}")

# 4. Purchase the dataset
print(f"\n💰 Purchasing dataset...")
# Note: Replace with actual Solana transaction hash
order = client.purchase_dataset(
    dataset_id=dataset['id'],
    payment_method="solana",
    payment_tx_hash="your_actual_tx_hash_here"
)
print(f"   Order ID: {order['data']['id']}")

# 5. Download the dataset
print(f"\n📥 Downloading dataset...")
client.download_dataset(
    dataset_id=dataset['id'],
    output_path=f"./{dataset['fileName']}"
)

print("\n✅ Done!")
```

## API Reference

### `DataNexusClient(api_key, base_url)`

Initialize the client.

**Parameters:**
- `api_key` (str): Your API key
- `base_url` (str, optional): API base URL (default: http://localhost:3000)

### `search_datasets(**kwargs)`

Search for datasets.

**Parameters:**
- `query` (str, optional): Search query
- `category` (str, optional): Filter by category
- `min_price` (float, optional): Minimum price
- `max_price` (float, optional): Maximum price
- `sort_by` (str, optional): Sort field (default: "createdAt")
- `order` (str, optional): Sort order (default: "desc")
- `page` (int, optional): Page number (default: 1)
- `limit` (int, optional): Items per page (default: 20, max: 100)

**Returns:** Dict with datasets and pagination info

### `get_dataset(dataset_id)`

Get dataset details.

**Parameters:**
- `dataset_id` (str): Dataset ID

**Returns:** Dict with dataset details

### `preview_dataset(dataset_id)`

Preview first 10 rows (free).

**Parameters:**
- `dataset_id` (str): Dataset ID

**Returns:** Dict with preview data

### `purchase_dataset(dataset_id, payment_method, **kwargs)`

Purchase a dataset.

**Parameters:**
- `dataset_id` (str): Dataset ID
- `payment_method` (str): "solana" or "x402"
- `payment_tx_hash` (str, optional): Solana transaction hash
- `x402_token` (str, optional): x402 payment token

**Returns:** Dict with order details

### `download_dataset(dataset_id, output_path)`

Download a purchased dataset.

**Parameters:**
- `dataset_id` (str): Dataset ID
- `output_path` (str): Path to save the file

### `get_purchases(page, limit)`

Get purchase history.

**Parameters:**
- `page` (int, optional): Page number (default: 1)
- `limit` (int, optional): Items per page (default: 20)

**Returns:** Dict with purchases and pagination info

### `create_x402_payment(product_id, amount)`

Create an x402 payment.

**Parameters:**
- `product_id` (str): Product ID
- `amount` (float): Payment amount

**Returns:** Dict with payment details

### `verify_x402_payment(payment_id, x402_token)`

Verify an x402 payment.

**Parameters:**
- `payment_id` (str): Payment ID
- `x402_token` (str): x402 payment token

**Returns:** Dict with verification result

## Error Handling

```python
try:
    results = client.search_datasets(query="test")
except Exception as e:
    print(f"Error: {e}")
```

## Rate Limits

- Free tier: 100 requests/hour
- Paid tier: 1000 requests/hour

## Support

- Documentation: http://localhost:3000/docs/api
- Issues: https://github.com/datanexus/datanexus/issues

