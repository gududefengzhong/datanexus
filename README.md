# DataNexus

> Autonomous Data Marketplace for AI Agents
> Solana × x402 × Irys × EigenAI

**Live Demo**: [https://xdatanexus.vercel.app/](https://xdatanexus.vercel.app/)

---

## Solana x402 Hackathon 2025

**Tracks**: x402 Agent Application | Trustless Agent | x402 API Integration

---

## What It Does

**Decentralized Data Marketplace for AI Agents**

DataNexus enables AI agents to autonomously trade data on Solana blockchain:

- **Autonomous Trading**: Agents search, purchase, and download datasets automatically via HTTP 402 protocol
- **Custom Data Requests**: Buyers post requirements, sellers bid, smart contract escrow ensures trustless delivery
- **Data Protection**: AES-256 encryption prevents leaks, only buyers get decryption keys
- **Reputation System**: On-chain trust scores (0-100) prevent rug pulls and fraud

**Key Technologies**: HTTP 402 protocol | Solana USDC payments | Irys storage | EigenAI inference (1M tokens) | Smart contract escrow

---

## Core Features

**For Buyers**
- Search datasets by category, price, provider reputation
- Purchase with USDC (one-time payment, unlimited downloads)
- Post custom data requests with budget and deadline
- Rate providers and dispute low-quality data

**For Sellers**
- Upload encrypted datasets to Irys (permanent storage)
- Set pricing and receive USDC payments directly
- Bid on custom data requests
- Build reputation score (0-100) and earn badges

**For AI Agents**
- Python SDK (3-line integration)
- HTTP 402 auto-detection and payment
- Automatic search, purchase, download, decrypt
- EigenAI verifiable inference integration

---

## How It Works

**x402 Flow**:
```
1. Agent requests dataset → HTTP 402 (payment required)
2. Agent pays USDC to provider's wallet
3. Agent retries with tx signature
4. Server verifies payment → returns data
```

**Reputation Flow**:
```
1. Provider uploads data → Irys (permanent storage)
2. System calculates score → 0-100 (sales, ratings, disputes)
3. High score (≥80) → SAS attestation (on-chain proof)
4. Agents verify provider → autonomous trust
```

---

## Quick Start

```bash
git clone https://github.com/gududefengzhong/datanexus.git
cd datanexus
npm install
cp .env.example .env.local
# Edit .env.local with your keys
npx prisma generate && npx prisma db push
npm run dev
```

**Test x402 flow**:
```bash
python examples/demo_x402_complete_flow.py
```

---

## Tech Stack

**Frontend**: Next.js 16, React 18, TypeScript, TailwindCSS
**Backend**: Next.js API, PostgreSQL (Prisma), Redis
**Blockchain**: Solana Devnet, Irys, SPL Token (USDC)
**AI**: EigenAI (grant-based auth)
**Smart Contract**: Anchor (PDA-based escrow)

---

## Architecture

```
AI Agent (Python SDK)
    ↓ HTTP 402
Next.js API + x402 Middleware
    ↓
Business Logic (Dataset | Payment | Reputation | AI)
    ↓
Data Layer (PostgreSQL | Redis | Solana)
    ↓
External (Irys | EigenAI | SAS | Helius RPC)
```

**Hybrid On-chain/Off-chain**:
- PostgreSQL: Fast queries (<100ms)
- Irys: Permanent storage (detailed data)
- Solana: Immutable proof (data hash)
- SAS: On-chain attestation (score ≥80)

---

## Project Structure

```
app/api/
  ├── agent/          # Agent endpoints (datasets, purchases)
  ├── datasets/       # Dataset management
  ├── disputes/       # Dispute resolution
  ├── ratings/        # Provider ratings
  └── providers/      # Reputation system
lib/
  ├── x402-middleware.ts      # HTTP 402 handler
  ├── reputation.ts           # Score calculation
  ├── onchain-sync.ts         # Irys + SAS sync
  └── eigenai-client.ts       # EigenAI integration
examples/
  ├── python-sdk/x402_example.py
  └── demo_x402_complete_flow.py
programs/escrow/              # Anchor smart contract
```

---

## Live Accounts

**Smart Contract**: `gxDTeSCzk9kFbKTKVrWo4Ey1RZJ3K9698` (Solana Devnet)
**Irys**: Permanent storage for datasets and reputation data
**SAS**: On-chain attestation for providers with score ≥80

---

## Reputation System

**Score** (0-100): Base 50 + Rating + Sales - Disputes - Refunds

**Badges**: Verified | Top Seller | Trusted | High Quality | Reliable

**On-chain Proof**: Irys (storage) + Solana (hash) + SAS (attestation for score ≥80)

**Anti-Fraud**: Automatic refunds for failed downloads, dispute resolution for low-quality data

---

## Python SDK

**3-line integration for AI agents**:

```python
from x402_example import SimpleX402Client

client = SimpleX402Client(api_key="...", solana_private_key="...")
datasets = client.search_datasets(query="DeFi", max_price=1.0)
result = client.download_dataset(dataset_id, auto_pay=True)  # Auto x402 payment
```

**Test the complete flow**:

```bash
python examples/demo_x402_complete_flow.py
```

---

## Documentation

See `/docs` for complete documentation including architecture, API reference, and deployment guides.

---

## Acknowledgments

Built with: [Solana](https://solana.com) | [Irys](https://irys.xyz) | [EigenAI](https://eigenai.network) | [x402](https://x402.io) | [Helius](https://helius.dev)

---

## Contact

**X**: [@rochestor_mu](https://x.com/rochestor_mu) | **Email**: greennft.eth@gmail.com | **GitHub**: [gududefengzhong/datanexus](https://github.com/gududefengzhong/datanexus)

**License**: MIT
