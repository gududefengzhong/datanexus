# 💼 Seller's Guide - DataNexus

Welcome to DataNexus! This guide will help you monetize your data by selling datasets to AI agents and developers.

---

## 🎯 Quick Start

### 1. **Connect Your Wallet**
- Click "Connect Wallet" in the top right corner
- Select your Solana wallet (Phantom, Solflare, etc.)
- This wallet will receive all payments

### 2. **Create Your Profile**
- Add a display name
- Write a bio describing your expertise
- Build your reputation by delivering quality data

### 3. **Upload Your First Dataset**
- Visit [Upload Dataset](/dashboard/upload)
- Fill in dataset details
- Upload your data file
- Set your price

---

## 📤 Uploading Datasets

### **Step-by-Step Guide**

#### 1. Prepare Your Data

**Supported formats**:
- ✅ CSV (recommended)
- ✅ JSON
- ✅ Parquet
- ✅ Excel (.xlsx)

**Best practices**:
- Clean and validate data before upload
- Remove personal/sensitive information
- Include column headers
- Use consistent date formats (ISO 8601)
- Compress large files

**Example CSV structure**:
```csv
timestamp,token,price,volume,liquidity
2024-01-01T00:00:00Z,SOL,98.45,1234567,9876543
2024-01-01T01:00:00Z,SOL,98.52,1345678,9887654
```

#### 2. Fill in Dataset Information

**Required fields**:
- **Name**: Clear, descriptive title (e.g., "Solana DEX Trading Data - Q4 2024")
- **Description**: Detailed explanation of what's included
- **Category**: DeFi, Social, Market, NFT, Gaming, or Other
- **Price**: In USDC (minimum $0.01)
- **Tags**: Keywords for search (e.g., "solana", "dex", "trading")

**Optional but recommended**:
- **Sample data**: First 10 rows to preview
- **Data schema**: Column descriptions
- **Update frequency**: How often data is refreshed
- **Data source**: Where the data comes from

**Example description**:
```
Complete trading data from Solana DEX aggregators (Jupiter, Raydium, Orca)
for Q4 2024.

Includes:
- 2.5M+ transactions
- Timestamp, token pair, price, volume, liquidity
- Hourly aggregated data
- All major SOL trading pairs

Format: CSV, 45MB compressed
Updated: Daily
Source: On-chain data from Solana RPC nodes
```

#### 3. Upload & Encrypt

When you click "Upload":
1. **File is encrypted** with AES-256
2. **Uploaded to Irys** (decentralized storage on Arweave)
3. **Metadata stored** on-chain
4. **Encryption key** stored securely (only you and buyers can decrypt)

**What this means**:
- ✅ Your data is permanently stored (cannot be deleted)
- ✅ Only paying customers can decrypt and access it
- ✅ You don't need to host or maintain servers
- ✅ Data is censorship-resistant

#### 4. Set Your Price

**Pricing strategies**:

| Strategy | Price Range | Best For |
|----------|-------------|----------|
| **Micro-data** | $0.01 - $0.10 | Small datasets, API responses |
| **Standard** | $0.10 - $5.00 | Medium datasets, daily data |
| **Premium** | $5.00 - $50.00 | Large datasets, historical data |
| **Enterprise** | $50.00+ | Custom datasets, exclusive data |

**Tips**:
- Start with lower prices to build reputation
- Check competitor pricing
- Consider data freshness (newer = higher price)
- Offer discounts for bulk purchases (coming soon)

---

## 📋 Responding to Custom Requests

### **How It Works**

1. **Browse requests** at [Data Requests](/dashboard/requests)
2. **Submit a proposal** with your offer
3. **Buyer accepts** and creates Escrow
4. **Deliver the data** within deadline
5. **Get paid** when buyer confirms

### **Writing Winning Proposals**

**Include**:
- ✅ Estimated delivery time (be realistic!)
- ✅ Data format and structure
- ✅ Sample data or schema
- ✅ Your relevant experience
- ✅ Why you're the best choice

**Example proposal**:
```
I can deliver this Solana DEX trading data within 3 days.

Deliverables:
- CSV file with 2M+ transactions
- Columns: timestamp, pair, price, volume, liquidity, dex_name
- Data from Jupiter, Raydium, Orca, Meteora
- Covers last 30 days (Nov 1-30, 2024)
- Includes data validation report

Experience:
- 15+ successful deliveries on DataNexus
- 4.9/5.0 rating
- Specialized in Solana on-chain data

I'll provide a sample of 1000 rows for verification before final delivery.
```

### **Delivery Process**

#### 1. Prepare the Data
- Follow the buyer's requirements exactly
- Validate data quality
- Test file integrity
- Include documentation if needed

#### 2. Upload to Platform
- Go to the Escrow page
- Click "Upload Delivery"
- Upload your file (encrypted automatically)
- Add delivery notes

#### 3. Mark as Delivered
- Click "Mark as Delivered"
- Buyer receives notification
- Buyer has 7 days to review

#### 4. Get Paid
- If buyer confirms: Payment released immediately
- If buyer disputes: Platform reviews (24-48 hours)
- If buyer doesn't respond: Auto-release after 7 days

---

## 💰 Earnings & Payments

### **How You Get Paid**

**Direct purchases** (via x402):
- ✅ Instant payment to your wallet
- ✅ No escrow delay
- ✅ 0% platform fee (for now)
- ✅ Payment in USDC

**Custom requests** (via Escrow):
- ✅ Funds locked in smart contract
- ✅ Released when buyer confirms
- ✅ 5% platform fee
- ✅ Payment in USDC

**Example earnings**:
```
Dataset sold for: $10.00 USDC
Platform fee (5%): -$0.50 USDC
You receive:       $9.50 USDC
```

### **Tracking Earnings**

Visit [My Sales](/dashboard/sales) to see:
- Total revenue
- Number of sales
- Active escrows
- Pending deliveries
- Transaction history

---

## 📊 Building Your Reputation

### **Reputation Score**

Your reputation is calculated from:
- ✅ Number of successful deliveries (40%)
- ✅ Average rating from buyers (30%)
- ✅ On-time delivery rate (20%)
- ✅ Dispute resolution (10%)

**Benefits of high reputation**:
- 🏆 Featured in search results
- 🏆 Higher proposal acceptance rate
- 🏆 Ability to charge premium prices
- 🏆 Verified seller badge

### **Getting 5-Star Reviews**

**Do**:
- ✅ Deliver on time (or early!)
- ✅ Exceed expectations
- ✅ Communicate proactively
- ✅ Provide clean, validated data
- ✅ Include documentation
- ✅ Respond quickly to questions

**Don't**:
- ❌ Miss deadlines
- ❌ Deliver incomplete data
- ❌ Ignore buyer messages
- ❌ Provide low-quality data
- ❌ Make false claims

---

## 🛡️ Seller Protection

### **Escrow Smart Contract**

For custom requests, you're protected by:
- ✅ Funds locked upfront (buyer can't cancel without penalty)
- ✅ Automatic release if buyer doesn't respond
- ✅ Fair dispute resolution
- ✅ Cannot lose payment after delivery

### **Dispute Resolution**

If buyer raises a dispute:
1. **You're notified** immediately
2. **Provide evidence** of delivery
3. **Platform reviews** within 24-48 hours
4. **Decision made**: Refund OR Release payment

**Tips for winning disputes**:
- Keep all communication on-platform
- Document your work process
- Provide proof of delivery
- Show you met requirements
- Be professional

---

## 📈 Growing Your Sales

### **Optimization Tips**

#### 1. **SEO for Datasets**
- Use descriptive, keyword-rich titles
- Add relevant tags
- Write detailed descriptions
- Update regularly

#### 2. **Competitive Pricing**
- Research similar datasets
- Start low, increase as reputation grows
- Offer "early bird" discounts

#### 3. **Quality Over Quantity**
- One great dataset > Ten mediocre ones
- Focus on your expertise area
- Validate data thoroughly

#### 4. **Marketing**
- Share on Twitter/X with #DataNexus
- Write blog posts about your data
- Engage in Discord community
- Offer free samples

---

## 🔒 Data Security & Privacy

### **Encryption**

All uploaded data is:
- ✅ Encrypted with AES-256
- ✅ Stored on Arweave (permanent, decentralized)
- ✅ Only accessible to paying customers
- ✅ Cannot be accessed by platform admins

### **Best Practices**

**Do**:
- ✅ Remove personal identifiable information (PII)
- ✅ Anonymize sensitive data
- ✅ Comply with data regulations (GDPR, CCPA)
- ✅ Only sell data you have rights to

**Don't**:
- ❌ Upload copyrighted data without permission
- ❌ Include private keys or credentials
- ❌ Sell personal data without consent
- ❌ Violate terms of service of data sources

---

## 📊 Analytics & Insights

### **Track Your Performance**

**Key metrics**:
- Total sales volume
- Average sale price
- Conversion rate (views → purchases)
- Customer retention rate
- Most popular datasets

**Use insights to**:
- Identify trending data categories
- Optimize pricing
- Improve dataset quality
- Plan future datasets

---

## ❓ FAQ

### **Q: How long does it take to get paid?**
A: Direct purchases are instant. Custom requests are released when buyer confirms (or auto-release after 7 days).

### **Q: What if buyer never confirms delivery?**
A: Payment automatically releases to you after 7 days of no response.

### **Q: Can I update a dataset after uploading?**
A: Yes! You can upload new versions. Buyers who purchased get free updates.

### **Q: What happens if I miss a deadline?**
A: Buyer can cancel and get refunded. This hurts your reputation score.

### **Q: Can I delete a dataset?**
A: You can delist it (hide from marketplace), but data on Arweave is permanent.

### **Q: How do I handle refund requests?**
A: For direct purchases, contact support. For custom requests, buyer can dispute before confirming.

---

## 🆘 Support

- **Documentation**: [DataNexus Docs](/docs)
- **Discord**: [Join seller community](https://discord.gg/x402)
- **Email**: greennft.eth@gmail.com
- **GitHub**: [Report issues](https://github.com/gududefengzhong/datanexus/issues)
- **X (Twitter)**: [@rochestor_mu](https://x.com/rochestor_mu)

---

## 🎓 Next Steps

1. ✅ [Upload your first dataset](/dashboard/upload)
2. ✅ [Browse data requests](/dashboard/requests)
3. ✅ [Read user stories](./USER_STORIES.md)
4. ✅ [Join Discord community](https://discord.gg/x402)

---

**Start earning from your data today! 💰**

