# 🚀 Pre-Deployment Checklist - DataNexus

Complete this checklist before deploying to Vercel.

---

## ✅ Code Cleanup (COMPLETED)

- [x] Temporary documentation removed (49 files)
- [x] Test scripts removed (31 files)
- [x] Duplicate directories removed (datanexus_escrow/)
- [x] .gitignore updated with private keys
- [x] Button styles updated (blue background, white text)
- [x] Dependencies installed (swagger-ui-react)

---

## 🔒 Security Checklist (CRITICAL!)

### 1. Private Keys Protection

- [ ] **Verify .gitignore includes**:
  ```bash
  cat .gitignore | grep -E "(wallet|keypair|\.env|\.pem)"
  ```
  Should show:
  - ✅ `platform-wallet.json`
  - ✅ `test-wallet.json`
  - ✅ `*-keypair.json`
  - ✅ `.env`
  - ✅ `.env.local`

- [ ] **Remove private keys from working directory**:
  ```bash
  # These files should NOT be committed
  rm -f platform-wallet.json
  rm -f test-wallet.json
  rm -f target/deploy/*-keypair.json
  ```

- [ ] **Generate NEW production wallet**:
  ```bash
  node scripts/generate-platform-wallet.js
  # Save the output securely!
  ```

### 2. Environment Variables

- [ ] **Create .env.local for local development**:
  ```bash
  cp .env.example .env.local
  # Fill in your local values
  ```

- [ ] **Prepare Vercel environment variables**:
  - [ ] `DATABASE_URL` (production database)
  - [ ] `PLATFORM_WALLET_PRIVATE_KEY` (NEW wallet!)
  - [ ] `SOLANA_RPC_URL`
  - [ ] `EIGENAI_API_KEY`
  - [ ] `IRYS_NETWORK`
  - [ ] `NEXT_PUBLIC_APP_URL`

### 3. Code Review

- [ ] **No hardcoded secrets**:
  ```bash
  # Search for potential hardcoded secrets
  grep -r "sk_" app/ lib/ components/ --include="*.ts" --include="*.tsx"
  grep -r "PRIVATE_KEY.*=.*['\"]" app/ lib/ components/ --include="*.ts" --include="*.tsx"
  ```

- [ ] **All secrets use environment variables**:
  ```typescript
  // ✅ GOOD
  const apiKey = process.env.EIGENAI_API_KEY
  
  // ❌ BAD
  const apiKey = "sk_1234567890"
  ```

---

## 🗄️ Database Setup

### 1. Choose Database Provider

- [ ] **Option A: Supabase** (Recommended)
  - Go to https://supabase.com
  - Create new project
  - Copy connection string
  - Enable SSL mode

- [ ] **Option B: Neon**
  - Go to https://neon.tech
  - Create new project
  - Copy connection string

- [ ] **Option C: Railway**
  - Go to https://railway.app
  - Create PostgreSQL database
  - Copy connection string

### 2. Configure Database

- [ ] **Connection string format**:
  ```
  postgresql://user:password@host:5432/database?sslmode=require
  ```

- [ ] **SSL enabled**: `?sslmode=require`

- [ ] **Test connection locally**:
  ```bash
  # Add DATABASE_URL to .env.local
  npx prisma db push
  ```

---

## 🔧 Build & Test

### 1. Local Build Test

- [ ] **Install dependencies**:
  ```bash
  npm install
  ```

- [ ] **Run Prisma generate**:
  ```bash
  npx prisma generate
  ```

- [ ] **Build the project**:
  ```bash
  npm run build
  ```
  Should complete without errors.

- [ ] **Test the build**:
  ```bash
  npm start
  # Visit http://localhost:3000
  ```

### 2. Test Critical Features

- [ ] **Health endpoint**:
  ```bash
  curl http://localhost:3000/api/health
  # Should return: {"status":"ok"}
  ```

- [ ] **Datasets API**:
  ```bash
  curl http://localhost:3000/api/datasets
  # Should return dataset list
  ```

- [ ] **Documentation pages**:
  - [ ] http://localhost:3000/docs
  - [ ] http://localhost:3000/docs/buyer-guide
  - [ ] http://localhost:3000/docs/seller-guide
  - [ ] http://localhost:3000/docs/user-stories
  - [ ] http://localhost:3000/docs/api-reference

---

## 📦 Git Repository Setup

### 1. Initialize Git (if not already)

- [ ] **Initialize repository**:
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  ```

- [ ] **Create GitHub repository**:
  - Go to https://github.com/new
  - Create new repository
  - Don't initialize with README (you already have one)

- [ ] **Push to GitHub**:
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/datanexus.git
  git branch -M main
  git push -u origin main
  ```

### 2. Verify .gitignore

- [ ] **Check what will be committed**:
  ```bash
  git status
  ```

- [ ] **Verify private keys are NOT listed**:
  - ❌ Should NOT see: `platform-wallet.json`
  - ❌ Should NOT see: `test-wallet.json`
  - ❌ Should NOT see: `.env` or `.env.local`
  - ✅ Should see: `.gitignore`

---

## 🚀 Vercel Deployment

### 1. Vercel Account Setup

- [ ] **Create Vercel account**: https://vercel.com/signup
- [ ] **Connect GitHub account**
- [ ] **Install Vercel CLI** (optional):
  ```bash
  npm i -g vercel
  vercel login
  ```

### 2. Import Project

- [ ] **Via Vercel Dashboard**:
  1. Click "Add New" → "Project"
  2. Import your GitHub repository
  3. Select "datanexus" repository

- [ ] **Configure Build Settings**:
  - Framework Preset: **Next.js**
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`

### 3. Environment Variables

- [ ] **Add all required variables**:
  
  **Database**:
  - [ ] `DATABASE_URL`
  
  **Solana**:
  - [ ] `SOLANA_RPC_URL`
  - [ ] `SOLANA_NETWORK`
  - [ ] `USDC_MINT_ADDRESS`
  - [ ] `PLATFORM_WALLET_PRIVATE_KEY` (NEW wallet!)
  - [ ] `ESCROW_PROGRAM_ID`
  
  **Irys**:
  - [ ] `IRYS_NETWORK`
  - [ ] `IRYS_TOKEN`
  - [ ] `IRYS_RPC_URL`
  
  **EigenAI**:
  - [ ] `EIGENAI_API_KEY`
  - [ ] `EIGENAI_API_URL`
  
  **Application**:
  - [ ] `NEXT_PUBLIC_APP_URL` (your Vercel URL)
  - [ ] `NODE_ENV=production`

- [ ] **Select environments**:
  - [x] Production
  - [x] Preview
  - [x] Development

### 4. Deploy

- [ ] **Click "Deploy"**
- [ ] **Wait for build to complete** (2-5 minutes)
- [ ] **Check deployment logs** for errors

---

## 🔍 Post-Deployment Verification

### 1. Database Migrations

- [ ] **Run migrations**:
  ```bash
  # Option 1: Via Vercel CLI
  vercel env pull .env.production
  npx prisma migrate deploy
  
  # Option 2: Via Vercel Dashboard
  # Settings → Functions → Add one-time function
  ```

### 2. Test Deployment

- [ ] **Health check**:
  ```bash
  curl https://your-app.vercel.app/api/health
  ```

- [ ] **Test API endpoints**:
  ```bash
  curl https://your-app.vercel.app/api/datasets
  ```

- [ ] **Visit website**:
  - [ ] https://your-app.vercel.app
  - [ ] https://your-app.vercel.app/docs
  - [ ] https://your-app.vercel.app/datasets

### 3. Check Logs

- [ ] **Vercel Dashboard → Logs**:
  - Look for errors
  - Check function execution times
  - Verify database connections

### 4. Monitor Performance

- [ ] **Enable Vercel Analytics**:
  - Dashboard → Analytics → Enable

- [ ] **Check response times**:
  - Should be < 1s for most requests

---

## 🎯 Production Readiness

### Security

- [ ] All private keys in Vercel env vars only
- [ ] No secrets in code
- [ ] SSL enabled on database
- [ ] CORS configured correctly
- [ ] Rate limiting enabled

### Performance

- [ ] Build completes successfully
- [ ] No console errors
- [ ] Images optimized
- [ ] API responses < 1s

### Monitoring

- [ ] Vercel Analytics enabled
- [ ] Error tracking set up (optional: Sentry)
- [ ] Uptime monitoring (optional: UptimeRobot)

### Documentation

- [ ] README.md updated
- [ ] API documentation complete
- [ ] User guides available
- [ ] Deployment guide available

---

## 🚨 Common Issues & Solutions

### Issue: Build Fails

**Error**: `Module not found`

**Solution**:
```bash
# Check tsconfig.json paths
# Verify all imports
# Run build locally first
npm run build
```

### Issue: Database Connection Fails

**Error**: `Can't reach database server`

**Solution**:
- Verify `DATABASE_URL` is correct
- Check SSL mode: `?sslmode=require`
- Whitelist Vercel IPs in database firewall

### Issue: Environment Variables Not Working

**Error**: `process.env.XXX is undefined`

**Solution**:
- Redeploy after adding env vars
- Check variable names (case-sensitive)
- Verify variable is set for "Production"

### Issue: Prisma Client Not Generated

**Error**: `@prisma/client did not initialize yet`

**Solution**:
```json
// Add to package.json
"scripts": {
  "postinstall": "prisma generate"
}
```

---

## ✅ Final Checklist

Before clicking "Deploy":

- [ ] All code cleanup completed
- [ ] All security checks passed
- [ ] Database set up and tested
- [ ] Build succeeds locally
- [ ] All tests pass
- [ ] Environment variables prepared
- [ ] Git repository pushed to GitHub
- [ ] .gitignore verified
- [ ] No private keys in code
- [ ] Documentation complete

---

## 🎉 Ready to Deploy!

If all checkboxes are checked, you're ready to deploy to Vercel!

**Next Steps**:
1. Go to https://vercel.com
2. Import your GitHub repository
3. Add environment variables
4. Click "Deploy"
5. Wait for build to complete
6. Test your deployment
7. Celebrate! 🎊

---

**Need Help?**

- 📖 Read: `VERCEL_DEPLOYMENT_GUIDE.md`
- 🔒 Review: `CLEANUP_AND_SECURITY_SUMMARY.md`
- 🚀 Check: `.env.example` for environment variables

**Good luck with your deployment! 🚀**

