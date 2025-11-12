# 🚀 Vercel Deployment Guide - DataNexus

Complete guide for deploying DataNexus to Vercel with proper security.

---

## 🔒 Security Checklist (CRITICAL!)

### ✅ Before Deployment

1. **Verify .gitignore includes all private keys**:
   ```bash
   # Check .gitignore
   cat .gitignore | grep -E "(wallet|keypair|\.env|\.pem)"
   ```

2. **Remove private keys from git history** (if committed):
   ```bash
   # Check if private keys are in git
   git log --all --full-history -- platform-wallet.json
   git log --all --full-history -- test-wallet.json
   
   # If found, you MUST clean git history before deploying!
   # Use git-filter-repo or BFG Repo-Cleaner
   ```

3. **Never commit these files**:
   - ❌ `platform-wallet.json`
   - ❌ `test-wallet.json`
   - ❌ `*-keypair.json`
   - ❌ `.env`
   - ❌ `.env.local`

---

## 📋 Environment Variables for Vercel

### Required Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

#### **Database**
```bash
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```
- Use a production PostgreSQL database (e.g., Supabase, Neon, Railway)
- Enable SSL mode for security

#### **Solana**
```bash
SOLANA_RPC_URL="https://api.devnet.solana.com"
# For production, use mainnet:
# SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

SOLANA_NETWORK="devnet"
# For production: "mainnet-beta"

USDC_MINT_ADDRESS="Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
# Devnet USDC mint
# For mainnet: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
```

#### **Platform Wallet (CRITICAL!)**
```bash
# Generate a NEW wallet for production!
# DO NOT use the test wallet!

PLATFORM_WALLET_PRIVATE_KEY="[1,2,3,...]"
# This is the JSON array format of the private key
# Generate using: node scripts/generate-platform-wallet.js
# Copy the output and paste here
```

⚠️ **IMPORTANT**: 
- Generate a NEW wallet for production
- Fund it with SOL for transaction fees
- Keep the private key ONLY in Vercel environment variables
- NEVER commit it to git

#### **Irys/Arweave**
```bash
IRYS_NETWORK="devnet"
# For production: "mainnet"

IRYS_TOKEN="solana"
IRYS_RPC_URL="https://api.devnet.solana.com"
```

#### **EigenAI**
```bash
EIGENAI_API_KEY="your_eigenai_api_key"
EIGENAI_API_URL="https://api.eigenai.com"
```

#### **Redis (Optional but Recommended)**
```bash
REDIS_URL="redis://default:password@host:6379"
# Use Upstash Redis or Redis Cloud for production
```

#### **Application**
```bash
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

---

## 🛠️ Deployment Steps

### 1. Prepare Your Repository

```bash
# 1. Make sure all changes are committed
git status

# 2. Verify .gitignore is correct
cat .gitignore | grep -E "(wallet|keypair|\.env)"

# 3. Remove any private keys from working directory
rm -f platform-wallet.json test-wallet.json

# 4. Push to GitHub
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Set Up Production Database

**Option A: Supabase (Recommended)**
1. Go to https://supabase.com
2. Create a new project
3. Copy the connection string
4. Add to Vercel as `DATABASE_URL`

**Option B: Neon**
1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string
4. Add to Vercel as `DATABASE_URL`

**Option C: Railway**
1. Go to https://railway.app
2. Create a PostgreSQL database
3. Copy the connection string
4. Add to Vercel as `DATABASE_URL`

### 3. Generate Production Platform Wallet

```bash
# Run the wallet generator
node scripts/generate-platform-wallet.js

# Output will be:
# ✅ Platform wallet generated!
# Public Key: ABC123...
# Private Key (JSON array): [1,2,3,...]

# Copy the JSON array (including brackets)
# Save it securely - you'll add it to Vercel
```

### 4. Fund the Platform Wallet

```bash
# For Devnet (testing):
solana airdrop 2 <PUBLIC_KEY> --url devnet

# For Mainnet (production):
# Transfer SOL manually using Phantom or Solflare wallet
# Recommended: 0.5-1 SOL for transaction fees
```

### 5. Deploy to Vercel

#### Via Vercel Dashboard:

1. **Import Repository**:
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Import your GitHub repository

2. **Configure Build Settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add all variables from the list above
   - Make sure to select "Production", "Preview", and "Development"

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

#### Via Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Follow prompts to set environment variables
```

### 6. Run Database Migrations

After first deployment:

```bash
# Option 1: Via Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy

# Option 2: Via Vercel Dashboard
# Go to your project → Settings → Functions
# Add a one-time function to run migrations
```

### 7. Verify Deployment

1. **Check Health Endpoint**:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **Test API**:
   ```bash
   curl https://your-app.vercel.app/api/datasets
   ```

3. **Check Logs**:
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for any errors

---

## 🔐 Security Best Practices

### 1. Environment Variables

✅ **DO**:
- Use Vercel's environment variable management
- Encrypt sensitive data
- Use different keys for dev/staging/prod
- Rotate keys regularly

❌ **DON'T**:
- Commit `.env` files
- Share environment variables in chat/email
- Use the same keys across environments
- Hardcode secrets in code

### 2. API Keys

```typescript
// ✅ GOOD: Use environment variables
const apiKey = process.env.EIGENAI_API_KEY

// ❌ BAD: Hardcoded
const apiKey = "sk_1234567890abcdef"
```

### 3. Database

✅ **DO**:
- Use SSL connections
- Enable connection pooling
- Set up read replicas for scaling
- Regular backups

❌ **DON'T**:
- Expose database publicly
- Use weak passwords
- Skip migrations

### 4. Wallet Security

✅ **DO**:
- Generate new wallet for production
- Store private key only in Vercel env vars
- Use hardware wallet for large amounts
- Monitor wallet balance

❌ **DON'T**:
- Reuse test wallets
- Store private keys in code
- Share wallet private keys
- Keep large amounts in hot wallet

---

## 🚨 Common Issues

### Issue 1: Build Fails

**Error**: `Module not found: Can't resolve '@/lib/...'`

**Solution**:
```bash
# Check tsconfig.json paths
# Verify all imports use correct paths
# Run build locally first: npm run build
```

### Issue 2: Database Connection Fails

**Error**: `Can't reach database server`

**Solution**:
```bash
# Verify DATABASE_URL is correct
# Check SSL mode: ?sslmode=require
# Whitelist Vercel IPs in database firewall
```

### Issue 3: Environment Variables Not Working

**Error**: `process.env.XXX is undefined`

**Solution**:
- Redeploy after adding env vars
- Check variable names (case-sensitive)
- Verify variable is set for "Production"

### Issue 4: Prisma Client Not Generated

**Error**: `@prisma/client did not initialize yet`

**Solution**:
```bash
# Add postinstall script to package.json
"scripts": {
  "postinstall": "prisma generate"
}
```

---

## 📊 Monitoring

### 1. Vercel Analytics

Enable in Vercel Dashboard:
- Go to your project
- Click "Analytics"
- Enable Web Analytics

### 2. Error Tracking

Add Sentry (optional):
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 3. Uptime Monitoring

Use:
- Vercel's built-in monitoring
- UptimeRobot (free)
- Pingdom

---

## 🎯 Production Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] New production wallet generated and funded
- [ ] Database migrations run successfully
- [ ] SSL enabled on database
- [ ] Redis configured (if using)
- [ ] Health endpoint returns 200
- [ ] API endpoints tested
- [ ] Error tracking enabled
- [ ] Monitoring set up
- [ ] Domain configured (if custom)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Backup strategy in place

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Development
git push origin dev
# → Deploys to preview URL

# Production
git push origin main
# → Deploys to production URL
```

---

## 📞 Support

If you encounter issues:

1. Check Vercel logs
2. Review environment variables
3. Test locally first
4. Check Vercel status page
5. Contact Vercel support

---

**🎉 You're ready to deploy to Vercel!**

Remember: Security first! Never commit private keys.

