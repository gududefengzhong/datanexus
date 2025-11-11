# 📖 Buyer's Guide - DataNexus

Welcome to DataNexus! This guide will help you discover, purchase, and use high-quality datasets for your AI agents and applications.

---

## 🎯 Quick Start

### 1. **Connect Your Wallet**
- Click "Connect Wallet" in the top right corner
- Select your Solana wallet (Phantom, Solflare, etc.)
- Make sure you have SOL and USDC on Solana Devnet

### 2. **Get USDC on Devnet** (for testing)
```bash
# Visit Solana Faucet
https://faucet.solana.com/

# Get devnet SOL first
# Then swap some SOL for USDC at:
https://spl-token-faucet.com/
```

### 3. **Browse Datasets**
- Visit the [Datasets page](http://localhost:3000/datasets)
- Filter by category: DeFi, Social, Market, NFT, Gaming
- Sort by price, downloads, or rating

---

## 🛒 Two Ways to Purchase Data

DataNexus offers **two purchasing methods** for different use cases:

### **Method 1: Direct Purchase (for AI Agents)** 🤖

**Best for**: Autonomous AI agents, automated workflows, API integrations

**How it works**:
1. **Search** for datasets via API
2. **Attempt download** → Receive HTTP 402 Payment Required
3. **Auto-pay** with x402 protocol
4. **Download** data immediately
5. **Analyze** with EigenAI (optional)

**Example** (Python):
```python
from x402_example import SimpleX402Client

# Initialize client
client = SimpleX402Client(
    api_key="your_api_key",
    solana_private_key="your_private_key"
)

# Search datasets
datasets = client.search_datasets(query="DeFi", category="defi")

# Download with automatic payment
result = client.download_dataset(
    dataset_id=datasets['data']['datasets'][0]['id'],
    auto_pay=True  # Automatically pay if needed
)

# Analyze with EigenAI
analysis = client.analyze_dataset(
    dataset_id=dataset_id,
    prompt="Analyze this DeFi data...",
    model="gpt-oss-120b-f16"
)
```

**Advantages**:
- ✅ Fully autonomous (no human intervention)
- ✅ Instant payment and download
- ✅ Perfect for AI agents
- ✅ Micro-payments (as low as $0.01)

**Use cases**:
- AI trading bots buying market data
- Research agents collecting datasets
- Automated data pipelines

---

### **Method 2: Custom Data Requests (for Complex Needs)** 📋

**Best for**: Custom datasets, large projects, specific requirements

**How it works**:
1. **Post a request** describing your data needs
2. **Receive proposals** from data providers
3. **Accept a proposal** and create Escrow
4. **Provider delivers** the custom dataset
5. **Confirm & release** payment (or dispute if needed)

**Step-by-step**:

#### Step 1: Post a Data Request
```
Title: "Solana DEX Trading Data - Last 30 Days"
Description: "Need complete trading data from Jupiter, Raydium, and Orca
             for the last 30 days. Must include: timestamp, pair, volume,
             price, liquidity."
Budget: $50 USDC
Deadline: 7 days
```

#### Step 2: Review Proposals
Providers will submit proposals with:
- Estimated delivery time
- Data format and structure
- Sample data (if available)
- Their reputation score

#### Step 3: Accept & Create Escrow
- Click "Accept Proposal"
- Funds are locked in smart contract
- Provider cannot access funds until you confirm delivery

#### Step 4: Review Delivery
- Provider marks as "Delivered"
- Download and verify the data
- If satisfied: Click "Confirm & Release Payment"
- If not satisfied: Click "Raise Dispute"

**Advantages**:
- ✅ Escrow protection (funds locked until delivery)
- ✅ Dispute resolution by platform
- ✅ Custom data tailored to your needs
- ✅ Provider reputation system

**Use cases**:
- Custom datasets not available in marketplace
- Large-scale data collection projects
- Specific data formats or structures

---

## 🔍 Finding the Right Dataset

### **Search Tips**

1. **Use specific keywords**
   - ❌ Bad: "crypto"
   - ✅ Good: "Solana DEX trading volume"

2. **Filter by category**
   - DeFi: Protocol data, TVL, yields
   - Social: Twitter sentiment, Discord activity
   - Market: Prices, volumes, market cap
   - NFT: Sales, floor prices, collections
   - Gaming: Player stats, in-game economies

3. **Check provider reputation**
   - Look for providers with high ratings (4.5+)
   - Check number of successful deliveries
   - Read reviews from other buyers

4. **Verify data quality**
   - Check file size (larger = more data)
   - Look at download count (popular = trusted)
   - Read the description carefully

---

## 💰 Payment & Pricing

### **Understanding Costs**

| Item | Cost | Notes |
|------|------|-------|
| Dataset purchase | $0.01 - $100 | Set by provider |
| Escrow creation | ~$0.01 SOL | Blockchain fee |
| Transaction fees | ~$0.0001 SOL | Solana network fee |
| Platform fee | 5% | Only on custom requests |

### **Automatic Refunds**

DataNexus automatically refunds your payment if:
- ✅ Payment succeeded but download failed
- ✅ You paid but didn't download within 5 minutes
- ✅ Duplicate payment for same dataset
- ✅ Provider fails to deliver (custom requests)

---

## 🤖 Using Data with AI Agents

### **Python SDK Example**

```python
# 1. Search for datasets
datasets = client.search_datasets(
    query="Twitter crypto sentiment",
    category="social",
    max_price=1.0
)

# 2. Download with auto-payment
data = client.download_dataset(
    dataset_id=datasets['data']['datasets'][0]['id'],
    auto_pay=True
)

# 3. Analyze with EigenAI
analysis = client.analyze_dataset(
    dataset_id=dataset_id,
    prompt="Analyze sentiment and predict market trend",
    model="gpt-oss-120b-f16"
)

# 4. Get verifiable proof
print(f"Analysis verified: {analysis['data']['verified']}")
print(f"Proof TX: {analysis['data']['txHash']}")
```

### **API Integration**

See [API Documentation](./API_DOCUMENTATION.md) for complete API reference.

---

## 🛡️ Buyer Protection

### **Escrow Smart Contract**

For custom data requests, your funds are protected by a Solana smart contract:

1. **Funds locked** until delivery confirmed
2. **Cannot be stolen** by provider
3. **Automatic refund** if provider cancels
4. **Dispute resolution** by platform if needed

### **Dispute Process**

If you're not satisfied with delivered data:

1. Click "Raise Dispute" (before confirming)
2. Provide evidence (screenshots, description)
3. Platform reviews within 24-48 hours
4. Decision: Refund to buyer OR Release to provider

**Tips for successful disputes**:
- Be specific about what's wrong
- Provide clear evidence
- Reference the original request requirements
- Be professional and factual

---

## 📊 Tracking Your Purchases

### **Web Dashboard**

Visit [My Purchases](http://localhost:3000/orders) to see:
- All purchased datasets
- Download history
- Transaction signatures
- Escrow status (for custom requests)

### **API Access**

```python
# Get purchase history
purchases = client.get_purchase_history(limit=50)

for purchase in purchases['data']:
    print(f"Dataset: {purchase['datasetName']}")
    print(f"Amount: ${purchase['amount']}")
    print(f"Status: {purchase['status']}")
    print(f"Downloads: {purchase['downloadCount']}")
    print(f"TX: {purchase['explorerUrl']}")
```

---

## ❓ FAQ

### **Q: What if I accidentally pay twice?**
A: The system automatically detects duplicate payments and refunds the extra payment.

### **Q: Can I download a dataset multiple times?**
A: Yes! Once purchased, you can download unlimited times.

### **Q: What if the data is not what I expected?**
A: For direct purchases, contact support. For custom requests, raise a dispute before confirming delivery.

### **Q: How do I know the AI analysis is trustworthy?**
A: All EigenAI analyses include cryptographic proofs stored on-chain. You can verify the proof using the transaction hash.

### **Q: Can I resell datasets I purchased?**
A: No, datasets are licensed for personal/business use only. Reselling violates the terms of service.

---

## 🆘 Support

- **Documentation**: [docs.datanexus.io](http://localhost:3000/docs)
- **Discord**: [Join our community](#)
- **Email**: support@datanexus.io
- **GitHub**: [Report issues](https://github.com/gududefengzhong/datanexus/issues)
- **X (Twitter)**: [@rochestor_mu](https://x.com/rochestor_mu)

---

## 🎓 Next Steps

1. ✅ [Set up your API key](./API_DOCUMENTATION.md#authentication)
2. ✅ [Run the demo agent](../examples/demo-agents/ai_analyst_agent.py)
3. ✅ [Explore the Python SDK](../examples/python-sdk/x402_example.py)
4. ✅ [Read user stories](./USER_STORIES.md)

---

**Happy data hunting! 🚀**

