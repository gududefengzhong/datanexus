# EigenAI Integration Guide for DataNexus

## Overview

EigenAI provides verifiable AI inference with cryptographic guarantees. This guide shows how to integrate EigenAI into DataNexus while maintaining our Solana-first architecture.

## Grant Status

✅ **Approved**: 1M free inference tokens
🔗 **Portal**: http://determinal.eigenarcade.com

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        DataNexus                             │
│                     (Solana Native)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User (Solana Wallet)                                       │
│       │                                                      │
│       ├─► Search Datasets (Free)                            │
│       │                                                      │
│       ├─► Purchase Dataset (x402 + Solana USDC)             │
│       │                                                      │
│       └─► Request AI Analysis                               │
│              │                                               │
│              ├─► Check Payment (x402)                        │
│              │                                               │
│              └─► EigenAI Inference (Verifiable)             │
│                     │                                        │
│                     ├─► TEE Execution                        │
│                     │                                        │
│                     └─► Solana Verification                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Points

1. **Users**: Only need Solana wallets
2. **Payments**: All on Solana via x402
3. **EigenAI**: Backend service for verifiable inference
4. **Authentication**: One-time ETH signature for EigenAI access

## Setup Steps

### Step 1: Create ETH Wallet for EigenAI Authentication

```bash
# Install ethers.js
npm install ethers

# Generate ETH wallet (one-time)
node scripts/generate-eth-wallet.js
```

### Step 2: Sign Message for EigenAI

```javascript
// scripts/sign-eigenai-message.js
const { ethers } = require('ethers');

async function signEigenAIMessage() {
  // Load your ETH private key
  const privateKey = process.env.ETH_PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey);
  
  // Sign the authentication message
  const message = "Authenticate with EigenAI for DataNexus";
  const signature = await wallet.signMessage(message);
  
  console.log("Wallet Address:", wallet.address);
  console.log("Signature:", signature);
  console.log("\nAdd to .env.local:");
  console.log(`EIGENAI_ETH_ADDRESS="${wallet.address}"`);
  console.log(`EIGENAI_SIGNATURE="${signature}"`);
  
  return { address: wallet.address, signature };
}

signEigenAIMessage();
```

### Step 3: Configure Environment Variables

```bash
# .env.local

# EigenAI Configuration
EIGENAI_API_URL="http://determinal.eigenarcade.com"
EIGENAI_ETH_ADDRESS="0x..."  # From Step 2
EIGENAI_SIGNATURE="0x..."     # From Step 2
EIGENAI_MNEMONIC="..."        # Optional: for TEE Solana derivation
```

### Step 4: Create EigenAI Client

```typescript
// lib/eigenai-client.ts
import axios from 'axios';

export interface EigenAIInferenceRequest {
  model: string;
  prompt: string;
  data?: any;
  verifiable?: boolean;
}

export interface EigenAIInferenceResponse {
  result: string;
  proof?: string;
  txHash?: string;
  verified: boolean;
}

export class EigenAIClient {
  private apiUrl: string;
  private ethAddress: string;
  private signature: string;

  constructor() {
    this.apiUrl = process.env.EIGENAI_API_URL!;
    this.ethAddress = process.env.EIGENAI_ETH_ADDRESS!;
    this.signature = process.env.EIGENAI_SIGNATURE!;
  }

  async inference(request: EigenAIInferenceRequest): Promise<EigenAIInferenceResponse> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/inference`,
        {
          ...request,
          verifiable: request.verifiable ?? true,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.signature}`,
            'X-ETH-Address': this.ethAddress,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('EigenAI inference error:', error);
      throw new Error('Failed to perform verifiable inference');
    }
  }

  async analyzeDataset(datasetContent: string, prompt: string, model: string = 'gpt-4'): Promise<EigenAIInferenceResponse> {
    return this.inference({
      model,
      prompt: `${prompt}\n\nData:\n${datasetContent}`,
      verifiable: true,
    });
  }
}

export const eigenaiClient = new EigenAIClient();
```

### Step 5: Create AI Analysis API Endpoint

```typescript
// app/api/agent/datasets/[id]/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-auth';
import { requirePayment } from '@/lib/x402-middleware';
import { eigenaiClient } from '@/lib/eigenai-client';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify API Key
    const user = await verifyApiKey(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // 2. Get dataset
    const dataset = await prisma.dataset.findUnique({
      where: { id: params.id },
      include: { seller: true },
    });

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // 3. Check if user has purchased the dataset
    const purchase = await prisma.order.findFirst({
      where: {
        buyerId: user.id,
        datasetId: params.id,
        status: 'COMPLETED',
      },
    });

    if (!purchase) {
      // Return 402 Payment Required
      return requirePayment({
        amount: dataset.price.toString(),
        currency: 'USDC',
        recipient: dataset.seller.walletAddress,
        network: 'solana-devnet',
        description: `AI analysis for dataset: ${dataset.name}`,
      });
    }

    // 4. Get analysis request
    const { prompt, model = 'gpt-4' } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // 5. Get dataset content
    const datasetContent = await getDatasetContent(dataset.irysId);

    // 6. Perform verifiable AI inference with EigenAI
    const analysis = await eigenaiClient.analyzeDataset(
      datasetContent,
      prompt,
      model
    );

    // 7. Return analysis result
    return NextResponse.json({
      success: true,
      data: {
        datasetId: params.id,
        datasetName: dataset.name,
        analysis: analysis.result,
        verified: analysis.verified,
        proof: analysis.proof,
        txHash: analysis.txHash,
        model,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze dataset' },
      { status: 500 }
    );
  }
}

async function getDatasetContent(irysId: string): Promise<string> {
  // Fetch dataset from Irys
  const response = await fetch(`https://gateway.irys.xyz/${irysId}`);
  const content = await response.text();
  return content;
}
```

## Usage Example

### Python Agent

```python
# examples/demo-agents/ai_analyst_agent.py
from datanexus_client import DataNexusClient

class AIAnalystAgent:
    def __init__(self, api_key, solana_private_key):
        self.client = DataNexusClient(
            api_key=api_key,
            solana_private_key=solana_private_key
        )
    
    def analyze_market_sentiment(self):
        """
        Complete workflow:
        1. Search for Twitter sentiment dataset
        2. Purchase with x402 (Solana USDC)
        3. Analyze with EigenAI (verifiable)
        """
        
        # 1. Search datasets
        print("🔍 Searching for sentiment datasets...")
        datasets = self.client.search_datasets(
            query="Twitter crypto sentiment",
            category="social"
        )
        
        dataset = datasets[0]
        print(f"✅ Found: {dataset['name']} - ${dataset['price']}")
        
        # 2. Purchase dataset (x402 automatic payment)
        print(f"💰 Purchasing dataset...")
        purchase = self.client.purchase_dataset(dataset['id'])
        print(f"✅ Purchased! TX: {purchase['txHash']}")
        
        # 3. Analyze with EigenAI
        print(f"🤖 Analyzing with EigenAI...")
        analysis = self.client.analyze_dataset(
            dataset_id=dataset['id'],
            prompt="Analyze overall market sentiment and predict BTC price trend",
            model="gpt-4"
        )
        
        print(f"\n📊 Analysis Result:")
        print(f"   {analysis['result']}")
        print(f"\n🔐 Verification:")
        print(f"   Verified: {analysis['verified']}")
        print(f"   Proof: {analysis['proof'][:50]}...")
        print(f"   TX Hash: {analysis['txHash']}")
        
        return analysis

# Run the agent
if __name__ == "__main__":
    agent = AIAnalystAgent(
        api_key="sk_...",
        solana_private_key="..."
    )
    
    result = agent.analyze_market_sentiment()
```

## Benefits

### For DataNexus

1. **Verifiable AI**: Cryptographic proof of AI inference
2. **Free Credits**: 1M inference tokens grant
3. **Competitive Edge**: Only data marketplace with verifiable AI
4. **Multiple Prizes**: Qualify for 3-4 hackathon bounties

### For Users

1. **Trust**: Verifiable AI results on-chain
2. **Solana Native**: No need for ETH wallet
3. **Seamless**: x402 automatic payments
4. **Powerful**: AI analysis + data in one platform

## Hackathon Submission

### Eligible Bounties

1. ✅ **Best x402 Agent Application** ($10,000)
2. ✅ **Best AgentPay Demo** ($5,000)
3. ✅ **Machine Economy Prize** ($5,000 + credits) - Using EigenAI
4. ✅ **Best Multi-Protocol Agent** ($10,000 credits) - x402 + EigenAI

**Total Potential**: $20,000 cash + $10,000 credits

## Next Steps

1. [ ] Generate ETH wallet for EigenAI auth
2. [ ] Sign message and get signature
3. [ ] Add environment variables
4. [ ] Implement EigenAI client
5. [ ] Create `/analyze` API endpoint
6. [ ] Update Python SDK
7. [ ] Create demo agent
8. [ ] Record demo video

## Resources

- EigenAI Portal: http://determinal.eigenarcade.com
- EigenCloud Docs: https://docs.eigencloud.xyz
- DataNexus API: http://localhost:3000/docs/api

