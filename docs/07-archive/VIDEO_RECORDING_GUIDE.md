# DataNexus - Video Recording Step-by-Step Guide

## 🎬 Pre-Recording Setup (30 minutes)

### 1. Environment Preparation

```bash
# 1. Clear browser cache and cookies
# Chrome: Settings > Privacy > Clear browsing data

# 2. Close all unnecessary applications
# Keep only: Browser, Terminal, Screen Recorder

# 3. Set screen resolution to 1920x1080
# System Preferences > Displays > Resolution

# 4. Disable notifications
# System Preferences > Notifications > Do Not Disturb

# 5. Prepare clean desktop
# Hide desktop icons, clean wallpaper
```

### 2. Test Data Preparation

```bash
# Navigate to project directory
cd /Users/mudimu/mudi/web3/datanexus

# Ensure production is running
# URL: https://datanexus-huhiyohb8-rochestors-projects.vercel.app

# Prepare test wallet with USDC on Devnet
# Use: https://faucet.solana.com for SOL
# Swap for USDC at: https://jup.ag (Devnet)
```

### 3. Browser Setup

**Open these tabs in order**:
1. Production homepage: https://datanexus-huhiyohb8-rochestors-projects.vercel.app
2. Dataset marketplace: https://datanexus-huhiyohb8-rochestors-projects.vercel.app/dashboard/products
3. Documentation: https://datanexus-huhiyohb8-rochestors-projects.vercel.app/docs
4. Solscan (ready for transaction): https://solscan.io/?cluster=devnet
5. GitHub repo: https://github.com/gududefengzhong/datanexus

### 4. Terminal Setup

```bash
# Open iTerm2 or Terminal
# Set font size to 16-18 for visibility
# Use light theme for better contrast

# Navigate to Python SDK
cd examples/python-sdk

# Test the agent script
python x402_example.py --dry-run
```

### 5. Recording Software Setup

**Recommended: OBS Studio**

Settings:
- Resolution: 1920x1080
- Frame Rate: 30fps
- Bitrate: 8000 kbps
- Audio: 192 kbps AAC
- Format: MP4

**Alternative: Loom**
- Sign in to Loom
- Select "Screen + Camera" or "Screen Only"
- Set quality to 1080p

---

## 🎥 Recording Sequence (3 minutes)

### Scene 1: Introduction (0:00-0:30)

**Visual Actions**:
1. Start on homepage
2. Slowly scroll down to show features
3. Highlight "Powered by x402 + Solana" badge
4. Show key metrics (if available)

**Voiceover** (read slowly and clearly):
> "Meet DataNexus - the first decentralized data marketplace built for AI agents.
> 
> Today's AI agents face a critical problem: they can't autonomously purchase the data they need to function. Traditional marketplaces require human intervention, credit cards, and subscriptions.
> 
> DataNexus solves this with the x402 protocol on Solana, enabling agents to discover, pay for, and access data in milliseconds - completely autonomously."

**On-Screen Text to Add** (in post-production):
- "The Problem: AI Agents Can't Buy Data" (at 0:05)
- "The Solution: x402 + Solana + DataNexus" (at 0:20)

**Timing**: 30 seconds exactly

---

### Scene 2: Live Agent Demo (0:30-1:30)

**Visual Actions**:
1. Switch to terminal window
2. Show Python agent code (briefly)
3. Run: `python x402_example.py`
4. Split screen: Terminal (left) + Browser (right)
5. Show HTTP 402 response in terminal
6. Switch to Solscan to show transaction
7. Return to terminal showing successful download

**Terminal Commands**:
```bash
# Show the code first (5 seconds)
cat x402_example.py | head -30

# Run the agent
python x402_example.py

# Expected output:
# 🔍 Searching for DeFi datasets...
# ✅ Found 5 datasets
# 
# 📊 Dataset: Solana DEX Trading Volume
# 💰 Price: 0.5 USDC
# 
# 💳 Attempting download...
# ⚠️  HTTP 402: Payment Required
# 
# 💸 Paying 0.5 USDC to platform...
# ✅ Payment confirmed: 5j7s8k2p...
# 
# 📥 Downloading dataset...
# ✅ Dataset downloaded: solana_dex_volume.csv
# ✅ Decryption successful
```

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

**On-Screen Text**:
- "Step 1: Search Datasets" (at 0:35)
- "Step 2: Receive HTTP 402" (at 0:50)
- "Step 3: Pay on Solana (400ms)" (at 1:05)
- "Step 4: Download Data" (at 1:20)

**Timing**: 60 seconds

---

### Scene 3: Verifiable AI Analysis (1:30-2:00)

**Visual Actions**:
1. Continue in terminal
2. Run AI analysis command
3. Show EigenAI response with proof
4. Highlight cryptographic signature

**Terminal Commands**:
```bash
# Request AI analysis
python x402_example.py --analyze

# Expected output:
# 🤖 Requesting AI analysis...
# 💳 Paying for analysis...
# ✅ Payment confirmed
# 
# 📊 Analysis Result:
# "This dataset shows increasing DEX volume on Solana,
#  with peak activity during US trading hours..."
# 
# 🔐 Verification Proof:
# ✅ Verifiable: true
# 🔑 Signature: 0x7a8f9b2c...
# 📅 Timestamp: 2025-11-11T10:30:00Z
# 🤖 Model: gpt-oss-120b-f16
```

**Voiceover**:
> "But DataNexus goes beyond simple downloads. Agents can request AI-powered analysis with cryptographic proofs.
> 
> Using EigenAI, every analysis comes with a verifiable signature. This prevents AI hallucination fraud and ensures transparent model attribution.
> 
> The agent pays for the analysis using the same x402 flow, and receives insights it can trust."

**On-Screen Text**:
- "Verifiable AI Analysis" (at 1:35)
- "Cryptographic Proofs" (at 1:45)
- "No Hallucination Fraud" (at 1:55)

**Timing**: 30 seconds

---

### Scene 4: Smart Contract Escrow (2:00-2:30)

**Visual Actions**:
1. Switch to browser
2. Navigate to /marketplace/requests
3. Show a data request
4. Click to view escrow details
5. Show Solana transaction on Solscan

**Browser Navigation**:
1. Go to: https://datanexus-huhiyohb8-rochestors-projects.vercel.app/marketplace/requests
2. Click on a sample request
3. Show escrow details:
   - Amount locked
   - Deadline
   - Buyer/Seller addresses
   - Status
4. Click "View on Solscan" link
5. Show escrow transaction on Solscan

**Voiceover**:
> "For custom data needs, DataNexus uses smart contract escrow on Solana.
> 
> A buyer posts a request for specific data. Sellers submit proposals. When accepted, funds lock in an Anchor smart contract.
> 
> The seller has a deadline to deliver. If successful, funds release automatically. If there's a dispute, our resolution system protects both parties.
> 
> This trustless system enables agents to transact with unknown parties - no reputation required."

**On-Screen Text**:
- "Smart Contract Escrow" (at 2:05)
- "Trustless Transactions" (at 2:15)
- "Automated Dispute Resolution" (at 2:25)

**Timing**: 30 seconds

---

### Scene 5: Impact & Call to Action (2:30-3:00)

**Visual Actions**:
1. Quick montage:
   - Documentation page (3 seconds)
   - GitHub repository (3 seconds)
   - API reference (3 seconds)
   - Homepage with metrics (3 seconds)
2. End on DataNexus logo with URL

**Browser Navigation**:
1. /docs - scroll quickly
2. GitHub repo - show README
3. /docs/api - show API endpoints
4. Homepage - show final metrics
5. Zoom into logo
6. Fade to black with URL displayed

**Voiceover**:
> "DataNexus is production-ready today. We're deployed on Vercel, tested on Solana Devnet, and fully open source.
> 
> With comprehensive documentation, a Python SDK, and 20+ API endpoints, we're ready to power the autonomous data economy.
> 
> Imagine 10,000 AI agents transacting millions in data sales - all autonomous, all trustless, all on Solana.
> 
> DataNexus: Building the future of AI agent commerce, one dataset at a time."

**On-Screen Text**:
- "✅ Production Ready" (at 2:35)
- "✅ Open Source (MIT)" (at 2:40)
- "✅ Comprehensive Docs" (at 2:45)
- "🚀 Join the Data Economy" (at 2:50)
- "datanexus-huhiyohb8-rochestors-projects.vercel.app" (at 2:55)

**Timing**: 30 seconds

---

## 🎤 Recording Tips

### Voice Recording

1. **Use a good microphone**
   - Built-in Mac mic is OK
   - External USB mic is better
   - AirPods Pro work well

2. **Recording environment**
   - Quiet room
   - Close windows
   - Turn off fans/AC
   - No background noise

3. **Speaking technique**
   - Speak clearly and slowly
   - Pause between sentences
   - Emphasize key words
   - Smile while speaking (sounds better!)

4. **Practice first**
   - Read script 2-3 times
   - Time yourself
   - Record a test clip

### Screen Recording

1. **Cursor visibility**
   - Enable cursor highlighting
   - Move cursor smoothly
   - Don't move too fast

2. **Scrolling**
   - Scroll slowly and smoothly
   - Pause on important content
   - Use keyboard shortcuts

3. **Transitions**
   - Smooth window switches
   - Use Cmd+Tab for app switching
   - Minimize jarring movements

---

## ✅ Pre-Recording Checklist

### Technical Setup
- [ ] Screen resolution: 1920x1080
- [ ] Recording software configured
- [ ] Microphone tested
- [ ] Audio levels checked
- [ ] Test recording done

### Content Preparation
- [ ] Production site is live
- [ ] Test wallet has USDC
- [ ] Python agent script tested
- [ ] Browser tabs prepared
- [ ] Solscan ready

### Environment
- [ ] Quiet room
- [ ] Notifications disabled
- [ ] Desktop clean
- [ ] Unnecessary apps closed
- [ ] Good lighting (if showing face)

### Script
- [ ] Script read through 3 times
- [ ] Timing practiced
- [ ] Key points memorized
- [ ] Backup notes ready

---

## 🎬 Recording Process

### Option 1: Record in One Take

**Pros**: Natural flow, authentic feel
**Cons**: Harder to get perfect

**Process**:
1. Start recording
2. Follow script exactly
3. Perform all actions
4. Stop recording
5. Review and re-record if needed

### Option 2: Record in Segments

**Pros**: Easier to perfect each part
**Cons**: More editing required

**Process**:
1. Record Scene 1 (Introduction)
2. Stop and review
3. Record Scene 2 (Agent Demo)
4. Stop and review
5. Record Scene 3 (AI Analysis)
6. Stop and review
7. Record Scene 4 (Escrow)
8. Stop and review
9. Record Scene 5 (Impact)
10. Stop and review
11. Edit segments together

**Recommended**: Option 2 for first-time recording

---

## 🎨 Post-Production Editing

### Basic Editing (Required)

1. **Trim excess**
   - Remove dead air at start/end
   - Cut out mistakes
   - Ensure exactly 3:00 or less

2. **Add on-screen text**
   - Use simple white text
   - Sans-serif font (Arial, Helvetica)
   - Large enough to read (48-72pt)
   - Position: Lower third

3. **Add transitions**
   - Simple fade (0.5s) between scenes
   - No fancy effects needed

4. **Audio cleanup**
   - Remove background noise
   - Normalize volume levels
   - Add subtle background music (optional)

### Advanced Editing (Optional)

1. **Highlights**
   - Yellow box around HTTP 402 response
   - Arrow pointing to payment amount
   - Zoom on transaction signature

2. **Slow motion**
   - Solana transaction confirmation (0.5x speed)
   - Payment flow (0.75x speed)

3. **Picture-in-picture**
   - Show code and browser simultaneously
   - Terminal output + Solscan

### Editing Software

**Free Options**:
- iMovie (Mac)
- DaVinci Resolve
- OpenShot

**Paid Options**:
- Final Cut Pro
- Adobe Premiere Pro

---

## 📤 Export Settings

### Video Export

```
Format: MP4 (H.264)
Resolution: 1920x1080
Frame Rate: 30fps
Bitrate: 8-10 Mbps
Quality: High
```

### Audio Export

```
Codec: AAC
Sample Rate: 48kHz
Bitrate: 192 kbps
Channels: Stereo
```

### File Size

- **Target**: 50-100 MB
- **Maximum**: 200 MB
- **Duration**: Exactly 3:00 or less

---

## 🚀 Upload Process

### YouTube Upload

1. **Go to**: https://youtube.com/upload
2. **Select file**: Choose exported MP4
3. **Title**: "DataNexus - Solana x402 Hackathon Demo"
4. **Description**:
   ```
   DataNexus: The first decentralized data marketplace for AI agents
   
   Built for Solana x402 Hackathon 2025
   
   🔗 Live Demo: https://datanexus-huhiyohb8-rochestors-projects.vercel.app
   🔗 GitHub: https://github.com/gududefengzhong/datanexus
   🔗 Docs: https://datanexus-huhiyohb8-rochestors-projects.vercel.app/docs
   
   Track: Best x402 Agent Application
   Developer: @rochestor_mu
   
   #Solana #x402 #AI #Blockchain #DataMarketplace
   ```
5. **Visibility**: Unlisted
6. **Thumbnail**: Auto-generated or custom
7. **Click**: Upload

### Test Video

1. Copy video URL
2. Open in incognito browser
3. Verify it plays correctly
4. Check audio and video quality
5. Confirm duration is 3:00 or less

---

## ✅ Final Checklist

Before submitting:
- [ ] Video is exactly 3:00 or less
- [ ] Audio is clear (no background noise)
- [ ] All features demonstrated
- [ ] x402 integration highlighted
- [ ] Solana benefits explained
- [ ] URL shown at end
- [ ] Video uploaded to YouTube
- [ ] Link tested in incognito
- [ ] Ready to add to submission form

---

## 🆘 Troubleshooting

### Common Issues

**Problem**: Video too long (>3:00)
**Solution**: Speed up some sections to 1.25x, trim intro/outro

**Problem**: Audio quality poor
**Solution**: Re-record voiceover separately, sync in editing

**Problem**: Screen recording laggy
**Solution**: Close all apps, reduce recording quality, record in segments

**Problem**: File size too large (>200MB)
**Solution**: Reduce bitrate to 5-6 Mbps, compress with HandBrake

**Problem**: YouTube upload fails
**Solution**: Try Loom or Vimeo as alternative

---

## 🎯 Success Criteria

Your video is ready when:
- ✅ Duration: 2:45 - 3:00
- ✅ Quality: 1080p, clear audio
- ✅ Content: All 5 scenes included
- ✅ Highlights: x402 and Solana emphasized
- ✅ Professional: No major errors
- ✅ Accessible: Uploaded and tested
- ✅ Engaging: Keeps viewer interested

---

**Ready to record? Let's build the future! 🚀**

