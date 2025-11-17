# DataNexus Examples

This directory contains examples and SDKs for integrating with DataNexus.

## 📁 Directory Structure

```
examples/
├── python-sdk/              # Python SDK for AI agents
│   ├── x402_example.py      # Complete x402 + EigenAI client
│   └── README.md            # SDK documentation
├── demo_x402_complete_flow.py  # Complete x402 demo (for hackathon)
└── requirements.txt         # Python dependencies
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file or set environment variables:

```bash
export DATANEXUS_API_KEY="your_api_key"
export SOLANA_PRIVATE_KEY="your_solana_private_key"  # For x402 payments
export DATANEXUS_BASE_URL="https://xdatanexus.vercel.app"
```

### 3. Run Examples

#### Complete x402 Flow Demo (Recommended for Hackathon Judges)

```bash
python examples/demo_x402_complete_flow.py
```

This demonstrates:
- ✅ Dataset search
- ✅ HTTP 402 Payment Required detection
- ✅ Automatic Solana USDC payment
- ✅ Payment verification
- ✅ Dataset download
- ✅ EigenAI verifiable analysis
- ✅ Purchase history

#### Python SDK Example

```bash
cd examples/python-sdk
python x402_example.py
```

## 📚 Python SDK Usage

### Basic Usage

```python
from x402_example import SimpleX402Client

# Initialize client with x402 support
client = SimpleX402Client(
    api_key="your_api_key",
    solana_private_key="your_solana_private_key",
    base_url="https://xdatanexus.vercel.app"
)

# Search datasets
datasets = client.search_datasets(
    query="DeFi",
    category="defi",
    max_price=1.0
)

# Get dataset details
dataset = client.get_dataset(dataset_id)

# Get purchase history
purchases = client.get_purchases()
```

### x402 Autonomous Payment Flow

```python
from x402_example import SimpleX402Client

# Initialize client
client = SimpleX402Client(
    api_key="your_api_key",
    solana_private_key="your_solana_private_key",
    base_url="https://xdatanexus.vercel.app"
)

# Search for datasets
datasets = client.search_datasets(category="defi")

# Autonomous purchase and download (x402 protocol)
if datasets:
    dataset_id = datasets[0]['id']

    # x402 Protocol Flow:
    # 1. Attempt download → Receive HTTP 402 Payment Required
    # 2. Extract payment details from headers
    # 3. Make DIRECT Solana USDC payment to provider
    # 4. Retry download with payment proof (tx signature)
    # 5. Server verifies payment via PayAI Facilitator
    # 6. Download dataset
    data = client.download_dataset(dataset_id)

    print(f"✅ Downloaded {len(data)} bytes")
```

### EigenAI Verifiable Inference

```python
# Request verifiable AI analysis with cryptographic proof
analysis = client.analyze_dataset(
    dataset_id=dataset_id,
    prompt="Analyze this DeFi protocol data and provide trading insights",
    model="gpt-oss-120b-f16",  # EigenAI model
    analysis_type="trading-signals"  # or "sentiment", "general"
)

# Check verification proof
if analysis.get('success'):
    data = analysis['data']
    print(f"✅ Verified analysis from {data.get('model')}")
    print(f"Analysis: {data.get('analysis')}")

    # Cryptographic proof
    if data.get('proof'):
        print(f"Proof Hash: {data['proof'][:40]}...")
        print(f"Verified: {data.get('verified', False)}")

# EigenAI Features:
# - 1M free inference tokens (deTERMinal grant)
# - Cryptographic proof of inference
# - Multiple analysis types (general, sentiment, trading-signals)
# - Support for encrypted datasets (auto-decryption)
```

## 🔑 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATANEXUS_API_KEY` | Your API key from DataNexus | Yes | - |
| `SOLANA_PRIVATE_KEY` | Solana wallet private key (base58) | For payments | - |
| `DATANEXUS_BASE_URL` | API base URL | No | Production URL |
| `SOLANA_RPC_URL` | Solana RPC endpoint | No | Devnet |

## 📖 API Documentation

Full API documentation is available at:
- **Production**: https://xdatanexus.vercel.app/docs
- **API Reference**: https://xdatanexus.vercel.app/docs/api-reference

## 🎯 Use Cases

### 1. AI Trading Bot

```python
# Search for market data
datasets = client.search_datasets(category="defi", query="trading volume")

# Purchase and analyze
for dataset in datasets[:3]:
    data = client.download_dataset(dataset['id'])
    analysis = client.analyze_dataset(
        dataset['id'],
        prompt="Identify trading opportunities"
    )
    # Use analysis for trading decisions
```

### 2. Research Agent

```python
# Search for research data
datasets = client.search_datasets(category="social", query="sentiment")

# Download and process
for dataset in datasets:
    data = client.download_dataset(dataset['id'])
    # Process data for research
```

### 3. Data Aggregator

```python
# Collect multiple datasets
categories = ["defi", "nft", "social"]
all_data = []

for category in categories:
    datasets = client.search_datasets(category=category, limit=10)
    for dataset in datasets:
        data = client.download_dataset(dataset['id'])
        all_data.append(data)

# Aggregate and analyze
```

## 🧪 Testing

### Run Complete x402 Flow Demo

```bash
# Recommended: Complete hackathon demo
python examples/demo_x402_complete_flow.py
```

### Test x402 Client Directly

```bash
cd examples/python-sdk
python x402_example.py
```

## 🔧 Troubleshooting

### Common Issues

**1. API Key Invalid**
```
Error: Invalid API key
Solution: Check your DATANEXUS_API_KEY environment variable
```

**2. Payment Failed**
```
Error: Insufficient USDC balance
Solution: Fund your Solana wallet with USDC on Devnet
```

**3. Connection Error**
```
Error: Connection refused
Solution: Check DATANEXUS_BASE_URL is correct
```

### Get Help

- **Documentation**: https://xdatanexus.vercel.app/docs
- **GitHub Issues**: https://github.com/gududefengzhong/datanexus/issues
- **Email**: greennft.eth@gmail.com

## 📝 Requirements

- Python 3.8+
- Solana wallet (for payments)
- USDC on Solana Devnet (for testing)

## 🚀 Next Steps

1. **Get API Key**: Visit https://xdatanexus.vercel.app/settings/api-keys
2. **Fund Wallet**: Get SOL from https://faucet.solana.com
3. **Get USDC**: Swap SOL for USDC on https://jup.ag (Devnet)
4. **Run Demo**: `python examples/demo_x402_complete_flow.py`
5. **Build Your Agent**: Use the SDK to build your own AI agent

## 📚 Additional Resources

- **Documentation**: https://xdatanexus.vercel.app/docs
- **API Reference**: https://xdatanexus.vercel.app/docs/api-reference
- **GitHub**: https://github.com/gududefengzhong/datanexus

## 🎉 Built for Solana x402 Hackathon 2025

This SDK demonstrates the complete x402 protocol integration on Solana, enabling autonomous AI agents to purchase and analyze data with real blockchain payments.

**Tracks**:
- 🥇 Best x402 Agent Application ($20,000)
- 🏆 Best Trustless Agent ($10,000)
- 💎 Best x402 API Integration ($10,000)

**Key Features**:
- ✅ HTTP 402 Payment Required protocol
- ✅ Direct Solana USDC payments (no intermediary)
- ✅ EigenAI verifiable inference
- ✅ Provider reputation system
- ✅ Hybrid encryption (AES-256 + RSA)

---

**Happy Building! 🚀**

