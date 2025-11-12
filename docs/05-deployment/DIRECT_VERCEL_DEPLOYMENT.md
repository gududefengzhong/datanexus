# 🚀 Direct Vercel Deployment Guide

Deploy DataNexus directly to Vercel without using GitHub.

---

## 📋 Quick Start

We provide 3 deployment scripts for different needs:

### 1. **Quick Deploy** (Fastest)
```bash
./quick-deploy.sh
```
- ✅ Simple one-command deployment
- ✅ Best for quick testing
- ⚠️ You need to set env vars manually in Vercel Dashboard

### 2. **Standard Deploy** (Recommended)
```bash
./deploy-to-vercel.sh
```
- ✅ Interactive deployment wizard
- ✅ Pre-deployment checks
- ✅ Post-deployment instructions
- ⚠️ You need to set env vars manually in Vercel Dashboard

### 3. **Deploy with Environment Variables** (Most Complete)
```bash
./deploy-with-env.sh
```
- ✅ Interactive menu
- ✅ Creates .env.production template
- ✅ Helps set environment variables
- ✅ Full deployment workflow

---

## 🎯 Recommended Workflow

### First Time Deployment

**Step 1: Use the full deployment script**
```bash
./deploy-with-env.sh
```

**Step 2: Choose option 1 (Full deployment)**

**Step 3: Edit .env.production**
```bash
# The script will create .env.production template
# Edit it with your actual values:
nano .env.production
```

**Step 4: Continue deployment**
- The script will guide you through the rest

### Subsequent Deployments

**For quick updates:**
```bash
./quick-deploy.sh
```

**For full deployment:**
```bash
./deploy-to-vercel.sh
```

---

## 📝 Manual Deployment (Without Scripts)

If you prefer to deploy manually:

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Build the project
```bash
npm install
npx prisma generate
npm run build
```

### 4. Deploy

**Preview deployment:**
```bash
vercel
```

**Production deployment:**
```bash
vercel --prod
```

---

## 🔧 Environment Variables Setup

### Required Environment Variables

You need to set these in Vercel Dashboard after deployment:

#### Database
```bash
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

#### Solana
```bash
SOLANA_RPC_URL="https://api.devnet.solana.com"
SOLANA_NETWORK="devnet"
USDC_MINT_ADDRESS="Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
PLATFORM_WALLET_PRIVATE_KEY="[1,2,3,...]"
ESCROW_PROGRAM_ID="gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698"
```

#### Irys
```bash
IRYS_NETWORK="devnet"
IRYS_TOKEN="solana"
IRYS_RPC_URL="https://api.devnet.solana.com"
```

#### EigenAI
```bash
EIGENAI_API_KEY="your_eigenai_api_key"
EIGENAI_API_URL="https://api.eigenai.com"
```

#### Application
```bash
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

### How to Set Environment Variables

**Option 1: Via Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable
5. Select "Production", "Preview", and "Development"
6. Click "Save"

**Option 2: Via Vercel CLI**
```bash
# Set a single variable
vercel env add DATABASE_URL production

# Pull environment variables
vercel env pull .env.vercel
```

**Option 3: Use the deployment script**
```bash
./deploy-with-env.sh
# Choose option 3: Set environment variables only
```

---

## 🔐 Security Checklist

Before deploying:

- [ ] **Generate NEW production wallet**
  ```bash
  node scripts/generate-platform-wallet.js
  ```

- [ ] **Never commit private keys**
  ```bash
  # Make sure these are in .gitignore:
  platform-wallet.json
  test-wallet.json
  *-keypair.json
  .env
  .env.local
  .env.production
  ```

- [ ] **Use production database**
  - Don't use local database
  - Enable SSL: `?sslmode=require`

- [ ] **Set strong secrets**
  - Generate new JWT_SECRET
  - Generate new API_KEY_SECRET

---

## 📊 Post-Deployment Tasks

### 1. Run Database Migrations

```bash
# Pull production environment variables
vercel env pull .env.vercel

# Run migrations
npx prisma migrate deploy
```

### 2. Test Deployment

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Test API
curl https://your-app.vercel.app/api/datasets

# Test documentation
open https://your-app.vercel.app/docs
```

### 3. Monitor Logs

```bash
# View logs in real-time
vercel logs

# Or visit Vercel Dashboard → Your Project → Logs
```

---

## 🚨 Troubleshooting

### Build Fails

**Error**: `Module not found`
```bash
# Solution: Install dependencies
npm install
npx prisma generate
npm run build
```

### Environment Variables Not Working

**Error**: `process.env.XXX is undefined`
```bash
# Solution: Redeploy after setting env vars
vercel --prod
```

### Database Connection Fails

**Error**: `Can't reach database server`
```bash
# Solution: Check DATABASE_URL
# Make sure it includes: ?sslmode=require
# Whitelist Vercel IPs in database firewall
```

### Prisma Client Not Generated

**Error**: `@prisma/client did not initialize yet`
```bash
# Solution: Add postinstall script to package.json
"scripts": {
  "postinstall": "prisma generate"
}
```

---

## 📁 Deployment Scripts Comparison

| Script | Use Case | Env Vars | Complexity |
|--------|----------|----------|------------|
| `quick-deploy.sh` | Quick updates | Manual | Low |
| `deploy-to-vercel.sh` | Standard deployment | Manual | Medium |
| `deploy-with-env.sh` | First deployment | Automated | High |

---

## 🎯 Best Practices

### 1. Use Preview Deployments for Testing
```bash
# Deploy to preview first
vercel

# Test thoroughly
# Then deploy to production
vercel --prod
```

### 2. Keep Environment Variables Secure
- Never commit .env files
- Use different values for dev/staging/prod
- Rotate secrets regularly

### 3. Monitor Your Deployment
- Check Vercel logs regularly
- Set up error tracking (Sentry)
- Monitor performance metrics

### 4. Database Migrations
- Always run migrations after deployment
- Test migrations in preview first
- Keep backups

---

## 📞 Need Help?

### Documentation
- `VERCEL_DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- `PRE_DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- `.env.example` - Environment variables template

### Commands
```bash
# View deployment help
vercel --help

# View environment variables help
vercel env --help

# View logs
vercel logs --help
```

### Support
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support

---

## ✅ Deployment Checklist

Before deploying:

- [ ] All dependencies installed
- [ ] Build succeeds locally
- [ ] Environment variables prepared
- [ ] Production wallet generated
- [ ] Production database set up
- [ ] Private keys NOT in code
- [ ] .gitignore updated

After deploying:

- [ ] Environment variables set in Vercel
- [ ] Database migrations run
- [ ] Health endpoint tested
- [ ] API endpoints tested
- [ ] Documentation pages tested
- [ ] Logs checked for errors

---

## 🎉 Quick Reference

**Deploy to preview:**
```bash
./quick-deploy.sh
# Choose option 1
```

**Deploy to production:**
```bash
./quick-deploy.sh
# Choose option 2
```

**Full deployment with env setup:**
```bash
./deploy-with-env.sh
# Choose option 1
```

**Set environment variables only:**
```bash
./deploy-with-env.sh
# Choose option 3
```

---

**Happy Deploying! 🚀**

