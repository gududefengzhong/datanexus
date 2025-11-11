# DataNexus Demo Agents

This directory contains demonstration AI agents that showcase the complete DataNexus workflow:

1. **x402 Automatic Payments** - Agents autonomously pay for datasets
2. **EigenAI Verifiable Inference** - Cryptographically verified AI analysis
3. **End-to-End Automation** - Search → Purchase → Analyze

## 🚀 Quick Start

### Prerequisites

```bash
# Install Python dependencies
pip install requests solana spl-token base58

# Set environment variables
export DATANEXUS_API_KEY="your-api-key"
export SOLANA_PRIVATE_KEY="your-solana-private-key"
```

### Run the AI Analyst Agent

```bash
python examples/demo-agents/ai_analyst_agent.py
```

## 🤖 Available Agents

### 1. AI Analyst Agent (`ai_analyst_agent.py`)

**Purpose**: Autonomous market analysis and trading signal generation

**Capabilities**:
- Market sentiment analysis from social data
- Trading signal generation from DeFi data
- Price trend prediction from historical data

**Use Cases**:

#### Use Case 1: Market Sentiment Analysis
```python
from ai_analyst_agent import AIAnalystAgent

agent = AIAnalystAgent(
    api_key="your-api-key",
    solana_private_key="your-private-key"
)

# Analyze Twitter sentiment
result = agent.analyze_market_sentiment()

# Output:
# {
#   "sentiment": "Bullish",
#   "score": 75,
#   "prediction": "BTC likely to rise 5-10% in next 24h",
#   "confidence": 85,
#   "verified": true,
#   "txHash": "5x..."
# }
```

#### Use Case 2: Trading Signal Generation
```python
# Generate trading signals
signals = agent.generate_trading_signals()

# Output:
# {
#   "signal": "BUY",
#   "entry": 145.50,
#   "stopLoss": 140.00,
#   "takeProfit": [150.00, 155.00, 160.00],
#   "riskReward": 2.5,
#   "confidence": 78,
#   "verified": true
# }
```

#### Use Case 3: Price Prediction
```python
# Predict future prices
prediction = agent.predict_price_trends()

# Output:
# {
#   "prediction_7d": [145, 148, 152, 155, 158, 160, 162],
#   "confidence_interval": [140, 165],
#   "trend": "Uptrend",
#   "volatility": "Medium",
#   "verified": true
# }
```

## 🔧 How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Analyst Agent                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─► 1. Search Datasets
                            │      (DataNexus API)
                            │
                            ├─► 2. Detect 402 Payment Required
                            │      (x402 Protocol)
                            │
                            ├─► 3. Make Solana Payment
                            │      (USDC Transfer)
                            │
                            ├─► 4. Request AI Analysis
                            │      (with payment token)
                            │
                            └─► 5. Receive Verified Result
                                   (EigenAI + Solana Proof)
```

### Payment Flow (x402)

1. **Agent requests dataset analysis**
   ```
   POST /api/agent/datasets/{id}/analyze
   Authorization: Bearer {api_key}
   ```

2. **Server returns 402 if not purchased**
   ```
   HTTP/1.1 402 Payment Required
   x-payment-amount: 0.5
   x-payment-currency: USDC
   x-payment-recipient: 3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC1prcxcN8BD
   x-payment-network: solana-devnet
   ```

3. **Agent makes Solana payment**
   ```python
   signature = transfer_usdc(
       recipient="3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC1prcxcN8BD",
       amount=0.5
   )
   ```

4. **Agent retries with payment token**
   ```
   POST /api/agent/datasets/{id}/analyze
   Authorization: Bearer {api_key}
   x-payment-token: {solana_signature}
   ```

5. **Server verifies and returns analysis**
   ```json
   {
     "success": true,
     "data": {
       "analysis": "...",
       "verified": true,
       "proof": "0x...",
       "txHash": "5x..."
     }
   }
   ```

### Verifiable AI (EigenAI)

Every AI analysis is cryptographically verified:

1. **Request sent to EigenAI**
   ```typescript
   const analysis = await eigenai.analyzeDataset(
     datasetContent,
     prompt,
     model
   )
   ```

2. **EigenAI executes in TEE**
   - Trusted Execution Environment
   - Isolated computation
   - Tamper-proof execution

3. **Proof generated on Solana**
   - Transaction hash for verification
   - Cryptographic proof of inference
   - On-chain verification available

4. **Result returned with proof**
   ```json
   {
     "result": "Analysis text...",
     "verified": true,
     "proof": "0x1234...",
     "txHash": "5xABC..."
   }
   ```

## 📊 Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 AI ANALYST AGENT - COMPLETE DEMO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 USE CASE 1: MARKET SENTIMENT ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Step 1: Searching for sentiment datasets...
✅ Found dataset: Twitter Crypto Sentiment - $0.50

💰 Payment Required:
   Amount: 0.5 USDC
   Recipient: 3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC1prcxcN8BD

🔄 Making real Solana payment...
✅ Payment successful!
   Transaction: 5xABC123...

🤖 Step 2: Analyzing sentiment with EigenAI...
✅ Analysis completed successfully!
   Verified: True
   Tokens Used: 1250
   Verification TX: 2yDEF456...

📊 Analysis Result:
{
  "sentiment": "Bullish",
  "score": 75,
  "themes": ["Bitcoin ETF", "Institutional Adoption", "DeFi Growth"],
  "prediction": "BTC likely to rise 5-10% in next 24 hours",
  "confidence": 85
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Demo Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🔐 Security Features

### x402 Payment Security
- ✅ Atomic payments on Solana blockchain
- ✅ Transaction verification via PayAI Facilitator
- ✅ No double-spending
- ✅ Instant settlement

### EigenAI Verification
- ✅ Cryptographic proof of inference
- ✅ TEE (Trusted Execution Environment)
- ✅ On-chain verification
- ✅ Tamper-proof results

## 🏆 Hackathon Bounties

This demo qualifies for multiple x402 Hackathon bounties:

1. **Best x402 Agent Application** ($10,000)
   - ✅ Full x402 protocol implementation
   - ✅ Autonomous agent payments
   - ✅ Real Solana transactions

2. **Best AgentPay Demo** ($5,000)
   - ✅ Seamless payment experience
   - ✅ Automatic payment handling
   - ✅ Clear demonstration

3. **Machine Economy Prize** ($5,000 + credits)
   - ✅ Uses EigenAI for verifiable inference
   - ✅ Autonomous agent economy
   - ✅ Cryptographic guarantees

**Total Potential**: $20,000 + credits

## 📚 Additional Resources

- **Integration Guide**: `docs/EIGENAI_INTEGRATION_GUIDE.md`
- **API Documentation**: http://localhost:3000/docs/api
- **EigenAI Portal**: http://determinal.eigenarcade.com
- **x402 Spec**: https://docs.payai.network/x402

## 🐛 Troubleshooting

### "No Solana private key provided"
```bash
export SOLANA_PRIVATE_KEY="your_base58_or_json_array_private_key"
```

### "EigenAI authentication failed"
```bash
# Re-run the signing script
node scripts/sign-eigenai-message.js

# Update .env.local with new signature
```

### "Dataset not found"
```bash
# Make sure dev server is running
npm run dev

# Check if datasets exist
curl http://localhost:3000/api/agent/datasets
```

## 🤝 Contributing

Want to add more demo agents? Follow this structure:

1. Create new agent file: `examples/demo-agents/your_agent.py`
2. Inherit from `SimpleX402Client`
3. Implement your use case methods
4. Add documentation to this README

## 📝 License

MIT License - See LICENSE file for details

