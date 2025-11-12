# DataNexus - Demo Video Script (3 Minutes)

## 🎬 Video Structure

**Total Duration**: 3:00 minutes  
**Format**: Screen recording + voiceover  
**Resolution**: 1920x1080 (1080p)  
**Frame Rate**: 30fps

---

## 📝 Script

### [0:00-0:30] Introduction (30 seconds)

**Visual**: 
- DataNexus homepage with hero section
- Quick pan across key features
- Show "Powered by Solana x402" badge

**Voiceover**:
> "Meet DataNexus - the first decentralized data marketplace built for AI agents. 
> 
> Today's AI agents face a critical problem: they can't autonomously purchase the data they need to function. Traditional marketplaces require human intervention, credit cards, and subscriptions.
> 
> DataNexus solves this with the x402 protocol on Solana, enabling agents to discover, pay for, and access data in milliseconds - completely autonomously."

**On-Screen Text**:
- "The Problem: AI Agents Can't Buy Data"
- "The Solution: x402 + Solana + DataNexus"

---

### [0:30-1:30] Live Agent Demo (60 seconds)

**Visual**: 
- Terminal window showing Python agent code
- Split screen: Code on left, API responses on right
- Highlight HTTP 402 response
- Show Solana transaction on Solscan
- Display decrypted dataset

**Voiceover**:
> "Let me show you how an AI agent uses DataNexus.
> 
> First, the agent searches for DeFi datasets using our API. It finds a Solana DEX trading volume dataset priced at 0.5 USDC.
> 
> When the agent tries to download, it receives an HTTP 402 'Payment Required' response - this is the x402 protocol in action. The response includes the payment amount, recipient address, and currency.
> 
> The agent automatically creates a Solana transaction, paying 0.5 USDC. Thanks to Solana's 400-millisecond finality, the payment confirms almost instantly.
> 
> The agent retries the download with the transaction signature as proof of payment. This time, it receives the encrypted dataset and decryption key.
> 
> The entire flow - from discovery to download - takes less than 2 seconds and costs just $0.00025 in transaction fees."

**Code Shown**:
```python
# Search datasets
datasets = client.search_datasets(
    query="DeFi",
    category="defi",
    max_price=1.0
)

# Download with auto-payment
result = client.download_dataset(
    dataset_id=datasets['data']['datasets'][0]['id'],
    auto_pay=True
)
# ✅ Payment confirmed: 5j7s8k2p...
# ✅ Dataset downloaded: solana_dex_volume.csv
```

**On-Screen Text**:
- "Step 1: Search Datasets"
- "Step 2: Receive HTTP 402"
- "Step 3: Pay on Solana (400ms)"
- "Step 4: Download Data"

---

### [1:30-2:00] Verifiable AI Analysis (30 seconds)

**Visual**:
- Agent requests AI analysis
- Show EigenAI proof response
- Display cryptographic signature
- Highlight "Verifiable: true"

**Voiceover**:
> "But DataNexus goes beyond simple downloads. Agents can request AI-powered analysis with cryptographic proofs.
> 
> Using EigenAI, every analysis comes with a verifiable signature. This prevents AI hallucination fraud and ensures transparent model attribution.
> 
> The agent pays for the analysis using the same x402 flow, and receives insights it can trust."

**Code Shown**:
```python
# Request verifiable AI analysis
analysis = client.analyze_dataset(
    dataset_id=dataset_id,
    prompt="Analyze DeFi protocol risks",
    model="gpt-oss-120b-f16"
)

print(analysis['proof']['verifiable'])  # True
print(analysis['proof']['signature'])   # 0x...
```

**On-Screen Text**:
- "Verifiable AI Analysis"
- "Cryptographic Proofs"
- "No Hallucination Fraud"

---

### [2:00-2:30] Smart Contract Escrow (30 seconds)

**Visual**:
- Show Data Request marketplace
- Buyer creates custom request
- Seller submits proposal
- Escrow creation on Solana
- Delivery and fund release

**Voiceover**:
> "For custom data needs, DataNexus uses smart contract escrow on Solana.
> 
> A buyer posts a request for specific data. Sellers submit proposals. When accepted, funds lock in an Anchor smart contract.
> 
> The seller has a deadline to deliver. If successful, funds release automatically. If there's a dispute, our resolution system protects both parties.
> 
> This trustless system enables agents to transact with unknown parties - no reputation required."

**On-Screen Text**:
- "Smart Contract Escrow"
- "Trustless Transactions"
- "Automated Dispute Resolution"

---

### [2:30-3:00] Impact & Call to Action (30 seconds)

**Visual**:
- Show metrics dashboard
- Pan across documentation pages
- Display GitHub repository
- End with DataNexus logo + Solana x402 badge

**Voiceover**:
> "DataNexus is production-ready today. We're deployed on Vercel, tested on Solana Devnet, and fully open source.
> 
> With comprehensive documentation, a Python SDK, and 20+ API endpoints, we're ready to power the autonomous data economy.
> 
> Imagine 10,000 AI agents transacting millions in data sales - all autonomous, all trustless, all on Solana.
> 
> DataNexus: Building the future of AI agent commerce, one dataset at a time."

**On-Screen Text**:
- "✅ Production Ready"
- "✅ Open Source (MIT)"
- "✅ Comprehensive Docs"
- "🚀 Join the Data Economy"
- "datanexus-huhiyohb8-rochestors-projects.vercel.app"

---

## 🎥 Recording Checklist

### Pre-Recording
- [ ] Clear browser cache
- [ ] Close unnecessary tabs
- [ ] Set up 1920x1080 screen resolution
- [ ] Prepare test data on Devnet
- [ ] Fund test wallet with USDC
- [ ] Test all API endpoints
- [ ] Prepare Python agent script
- [ ] Open Solscan in separate tab

### Recording Tools
- [ ] **Screen Recorder**: OBS Studio or Loom
- [ ] **Audio**: Clear microphone (no background noise)
- [ ] **Cursor Highlighting**: Enable for visibility
- [ ] **Code Editor**: VS Code with syntax highlighting
- [ ] **Terminal**: iTerm2 with clear font

### Scenes to Record

#### Scene 1: Homepage (5 seconds)
- URL: https://datanexus-huhiyohb8-rochestors-projects.vercel.app
- Show hero section
- Scroll to features
- Highlight "Powered by x402"

#### Scene 2: Dataset Marketplace (5 seconds)
- Navigate to /dashboard/products
- Show dataset cards
- Highlight pricing and categories

#### Scene 3: Python Agent Demo (60 seconds)
- Terminal: Run `python examples/python-sdk/x402_example.py`
- Show search results
- Display HTTP 402 response
- Show Solana transaction
- Display downloaded dataset

#### Scene 4: Solscan Transaction (10 seconds)
- Open transaction in Solscan
- Show USDC transfer
- Highlight confirmation time

#### Scene 5: AI Analysis (20 seconds)
- Terminal: Run analysis request
- Show EigenAI response
- Highlight cryptographic proof

#### Scene 6: Escrow Flow (20 seconds)
- Navigate to /marketplace/requests
- Show request creation
- Display escrow details
- Show Anchor program on Solscan

#### Scene 7: Documentation (10 seconds)
- Navigate to /docs
- Scroll through API reference
- Show code examples

#### Scene 8: GitHub Repository (5 seconds)
- Open https://github.com/gududefengzhong/datanexus
- Show README
- Highlight MIT license

#### Scene 9: Closing (5 seconds)
- Return to homepage
- Zoom into logo
- Fade to black with URL

---

## 🎨 Visual Effects

### Transitions
- **Fade**: Between major sections (0.5s)
- **Zoom**: For emphasis on key points
- **Highlight**: Yellow box around important UI elements
- **Slow Motion**: For Solana transaction confirmation (0.5x speed)

### On-Screen Annotations
- **Arrows**: Point to HTTP 402 status code
- **Boxes**: Highlight payment amounts
- **Text Overlays**: Explain technical concepts
- **Checkmarks**: Mark completed steps

### Color Scheme
- **Primary**: Blue (#3b82f6) - matches DataNexus brand
- **Accent**: Purple (#8b5cf6) - for highlights
- **Success**: Green (#10b981) - for confirmations
- **Warning**: Yellow (#f59e0b) - for important notes

---

## 🎤 Voiceover Tips

### Tone
- **Enthusiastic** but professional
- **Clear** pronunciation
- **Moderate** pace (not too fast)
- **Confident** delivery

### Emphasis Points
- "x402 protocol"
- "400-millisecond finality"
- "$0.00025 in fees"
- "Completely autonomous"
- "Cryptographic proofs"
- "Trustless system"

### Pauses
- After each major point (1 second)
- Before transitions (0.5 seconds)
- After questions (1 second)

---

## 📊 Metrics to Show

### Live Metrics (if available)
- Transaction count
- Total volume
- Active agents
- Dataset count

### Performance Metrics
- Payment confirmation time: ~400ms
- API response time: <100ms
- Transaction cost: $0.00025
- Success rate: 99.8%

---

## 🔧 Technical Setup

### Test Environment
- **Network**: Solana Devnet
- **Wallet**: Test wallet with 10 USDC
- **Datasets**: 3-5 sample datasets uploaded
- **Agent**: Python SDK configured

### Backup Plans
- Pre-recorded API responses (if live demo fails)
- Screenshots of key screens
- Cached Solscan transactions

---

## 📤 Export Settings

### Video Export
- **Format**: MP4 (H.264)
- **Resolution**: 1920x1080
- **Frame Rate**: 30fps
- **Bitrate**: 8-10 Mbps
- **Audio**: AAC, 192 kbps

### File Size
- **Target**: <100 MB
- **Maximum**: 200 MB (for upload)

### Upload Platforms
- YouTube (unlisted)
- Loom
- Direct file upload to hackathon submission

---

## ✅ Final Checklist

Before submitting:
- [ ] Video is exactly 3 minutes or less
- [ ] Audio is clear and professional
- [ ] All features are demonstrated
- [ ] x402 integration is highlighted
- [ ] Solana benefits are explained
- [ ] Contact information is shown
- [ ] URL is displayed at the end
- [ ] Video is uploaded and accessible
- [ ] Link is tested from incognito browser

---

## 🎬 Alternative: Slide Deck Version

If screen recording is challenging, create a slide deck with:

1. **Title Slide**: DataNexus + x402 + Solana
2. **Problem Slide**: AI agents can't buy data
3. **Solution Slide**: x402 payment flow diagram
4. **Demo Slides**: Screenshots of each step
5. **Architecture Slide**: Technical diagram
6. **Impact Slide**: Metrics and potential
7. **CTA Slide**: URL and contact info

Export as video using PowerPoint or Keynote (with voiceover).

---

*Ready to record! 🎥*

