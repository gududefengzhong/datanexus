# DataNexus Examples

This directory contains examples and SDKs for integrating with DataNexus.

## 📁 Directory Structure

```
examples/
├── python-sdk/              # Python SDK for AI agents
│   ├── datanexus_client.py  # Main client library
│   ├── x402_example.py      # x402 payment flow example
│   ├── demo_test.py         # Testing script
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
export SOLANA_PRIVATE_KEY="your_solana_private_key"  # Optional, for payments
export DATANEXUS_BASE_URL="https://datanexus-huhiyohb8-rochestors-projects.vercel.app"
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

#### Test Suite

```bash
cd examples/python-sdk
python demo_test.py
```

## 📚 Python SDK Usage

### Basic Usage

```python
from datanexus_client import DataNexusClient

# Initialize client
client = DataNexusClient(
    api_key="your_api_key",
    base_url="https://datanexus-huhiyohb8-rochestors-projects.vercel.app"
)

# Search datasets
result = client.search_datasets(
    query="DeFi",
    category="defi",
    max_price=1.0
)

# Get dataset details
dataset = client.get_dataset(dataset_id)

# Get purchase history
purchases = client.get_purchase_history()
```

### x402 Payment Flow

```python
from x402_example import SimpleX402Client

# Initialize client with Solana private key
client = SimpleX402Client(
    api_key="your_api_key",
    solana_private_key="your_solana_private_key",
    base_url="https://datanexus-huhiyohb8-rochestors-projects.vercel.app"
)

# Search for datasets
datasets = client.search_datasets(category="defi")

# Purchase and download (automatic x402 payment)
if datasets:
    dataset_id = datasets[0]['id']
    
    # This will:
    # 1. Attempt download
    # 2. Receive HTTP 402
    # 3. Make Solana payment
    # 4. Retry with payment proof
    # 5. Download dataset
    data = client.download_dataset(dataset_id)
    
    print(f"Downloaded {len(data)} bytes")
```

### AI Analysis with EigenAI

```python
# Request verifiable AI analysis
analysis = client.analyze_dataset(
    dataset_id=dataset_id,
    prompt="Analyze this DeFi dataset and provide insights"
)

# Check verification proof
if analysis.get('verifiable'):
    print(f"✅ Verified analysis from {analysis['model']}")
    print(f"Signature: {analysis['signature']}")
    print(f"Result: {analysis['result']}")
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
- **Production**: https://datanexus-huhiyohb8-rochestors-projects.vercel.app/docs
- **API Reference**: https://datanexus-huhiyohb8-rochestors-projects.vercel.app/docs/api-reference

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

### Run All Tests

```bash
cd examples/python-sdk
python demo_test.py
```

### Test Specific Features

```python
# Test search
python -c "from datanexus_client import DataNexusClient; \
           client = DataNexusClient('your_api_key'); \
           print(client.search_datasets(limit=5))"

# Test x402 flow
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

- **Documentation**: https://datanexus-huhiyohb8-rochestors-projects.vercel.app/docs
- **GitHub Issues**: https://github.com/gududefengzhong/datanexus/issues
- **Discord**: https://discord.gg/x402
- **Email**: greennft.eth@gmail.com

## 📝 Requirements

- Python 3.8+
- Solana wallet (for payments)
- USDC on Solana Devnet (for testing)

## 🚀 Next Steps

1. **Get API Key**: Visit https://datanexus-huhiyohb8-rochestors-projects.vercel.app/settings/api-keys
2. **Fund Wallet**: Get SOL from https://faucet.solana.com
3. **Get USDC**: Swap SOL for USDC on https://jup.ag (Devnet)
4. **Run Examples**: Try the examples above
5. **Build Your Agent**: Use the SDK to build your own AI agent

## 📚 Additional Resources

- **Buyer's Guide**: https://datanexus-huhiyohb8-rochestors-projects.vercel.app/docs/buyer-guide
- **Seller's Guide**: https://datanexus-huhiyohb8-rochestors-projects.vercel.app/docs/seller-guide
- **API Reference**: https://datanexus-huhiyohb8-rochestors-projects.vercel.app/docs/api-reference
- **User Stories**: https://datanexus-huhiyohb8-rochestors-projects.vercel.app/docs/user-stories

## 🎉 Built for Solana x402 Hackathon 2025

This SDK demonstrates the complete x402 protocol integration on Solana, enabling autonomous AI agents to purchase and analyze data with real blockchain payments.

**Track**: Best x402 Agent Application  
**Prize**: $20,000  
**Submission**: November 11, 2025

---

**Happy Building! 🚀**

