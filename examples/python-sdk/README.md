# DataNexus Python SDK

Complete x402 protocol client with EigenAI verifiable inference support.

## Installation

```bash
pip install requests solana spl-token base58
```

## Quick Start

### 1. Get Your API Key

1. Visit https://xdatanexus.vercel.app/settings/api-keys
2. Create a new API key
3. Copy the key (it won't be shown again!)

### 2. Initialize the Client

```python
from x402_example import SimpleX402Client

# Initialize with x402 support
client = SimpleX402Client(
    api_key="your_api_key_here",
    solana_private_key="your_solana_private_key",  # Base58 encoded
    base_url="https://xdatanexus.vercel.app"
)
```

### 3. Search for Datasets

```python
# Search for DeFi data
datasets = client.search_datasets(
    query="DeFi",
    category="defi",
    max_price=1.0
)

print(f"Found {len(datasets)} datasets")

for dataset in datasets:
    print(f"- {dataset['name']} (${dataset['price']})")
```

### 4. x402 Autonomous Purchase & Download

```python
# Autonomous x402 payment flow
if datasets:
    dataset_id = datasets[0]['id']

    # This will automatically:
    # 1. Attempt download → Receive HTTP 402
    # 2. Make Solana USDC payment
    # 3. Retry with payment proof
    # 4. Download dataset
    data = client.download_dataset(dataset_id)

    print(f"✅ Downloaded {len(data)} bytes")
```

### 5. EigenAI Verifiable Inference

```python
# Analyze dataset with EigenAI
analysis = client.analyze_dataset(
    dataset_id=dataset_id,
    prompt="Analyze this DeFi protocol data and provide trading insights",
    model="gpt-oss-120b-f16",
    analysis_type="trading-signals"  # or "sentiment", "general"
)

if analysis.get('success'):
    data = analysis['data']
    print(f"✅ Analysis: {data.get('analysis')}")
    print(f"Verified: {data.get('verified', False)}")

    # Cryptographic proof
    if data.get('proof'):
        print(f"Proof: {data['proof'][:40]}...")
```

### 6. View Purchase History

```python
purchases = client.get_purchases()

for purchase in purchases:
    print(f"- {purchase['datasetName']}")
    print(f"  Amount: ${purchase['amount']}")
    print(f"  Downloads: {purchase['downloadCount']}")
```

## Complete Example

```python
from x402_example import SimpleX402Client

# Initialize client
client = SimpleX402Client(
    api_key="your_api_key",
    solana_private_key="your_solana_private_key",
    base_url="https://xdatanexus.vercel.app"
)

# 1. Search for datasets
print("🔍 Searching for DeFi datasets...")
datasets = client.search_datasets(
    query="DeFi",
    category="defi",
    max_price=1.0
)

if not datasets:
    print("No datasets found")
    exit()

# 2. Select dataset
dataset = datasets[0]
print(f"\n📊 Selected: {dataset['name']}")
print(f"   Price: ${dataset['price']}")

# 3. Autonomous x402 purchase & download
print(f"\n💰 Purchasing with x402 protocol...")
data = client.download_dataset(dataset['id'])
print(f"✅ Downloaded {len(data)} bytes")

# 4. Analyze with EigenAI
print(f"\n🤖 Analyzing with EigenAI...")
analysis = client.analyze_dataset(
    dataset_id=dataset['id'],
    prompt="Analyze this DeFi data and provide insights",
    model="gpt-oss-120b-f16",
    analysis_type="trading-signals"
)

if analysis.get('success'):
    print(f"✅ Analysis: {analysis['data'].get('analysis')}")

print("\n✅ Done!")
```

## API Reference

### `SimpleX402Client(api_key, solana_private_key, base_url)`

Initialize the x402 client with EigenAI support.

**Parameters:**
- `api_key` (str): Your API key
- `solana_private_key` (str): Solana wallet private key (base58 encoded)
- `base_url` (str, optional): API base URL (default: https://xdatanexus.vercel.app)

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

### `download_dataset(dataset_id)`

Download a dataset with autonomous x402 payment.

**Parameters:**
- `dataset_id` (str): Dataset ID

**Returns:** bytes - Dataset content

**x402 Flow:**
1. Attempts download → Receives HTTP 402
2. Extracts payment details from headers
3. Makes Solana USDC payment to provider
4. Retries download with payment proof
5. Returns dataset content

### `analyze_dataset(dataset_id, prompt, model, analysis_type)`

Analyze dataset with EigenAI verifiable inference.

**Parameters:**
- `dataset_id` (str): Dataset ID
- `prompt` (str): Analysis prompt
- `model` (str, optional): AI model (default: "gpt-oss-120b-f16")
- `analysis_type` (str, optional): "general", "sentiment", or "trading-signals"

**Returns:** Dict with analysis result and cryptographic proof

**Features:**
- 1M free inference tokens (deTERMinal grant)
- Cryptographic proof of inference
- Auto-decryption for encrypted datasets

### `get_purchases()`

Get purchase history.

**Returns:** List of purchases with download counts

## Features

### ✅ x402 Protocol
- HTTP 402 Payment Required standard
- Autonomous payment handling
- Direct Solana USDC transfers
- PayAI Facilitator verification
- Blockchain fallback verification

### ✅ EigenAI Integration
- Verifiable AI inference
- 1M free tokens (deTERMinal grant)
- Cryptographic proof
- Multiple analysis types
- Auto-decryption support

### ✅ Developer Friendly
- Simple 3-line integration
- Automatic retry logic
- Detailed error messages
- Production-ready

## Support

- **Documentation**: https://xdatanexus.vercel.app/docs
- **GitHub**: https://github.com/gududefengzhong/datanexus
- **Email**: greennft.eth@gmail.com

