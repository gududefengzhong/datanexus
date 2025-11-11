#!/bin/bash

echo "🔍 DataNexus - Cleanup and Security Check"
echo "=========================================="
echo ""

# 1. 检查私钥文件
echo "1️⃣ Checking for private key files..."
echo "-----------------------------------"

PRIVATE_KEY_FILES=(
  "platform-wallet.json"
  "test-wallet.json"
  "target/deploy/datanexus_escrow-keypair.json"
)

for file in "${PRIVATE_KEY_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "⚠️  FOUND: $file"
    # 检查是否在 .gitignore 中
    if grep -q "$file" .gitignore 2>/dev/null; then
      echo "   ✅ Listed in .gitignore"
    else
      echo "   ❌ NOT in .gitignore - SECURITY RISK!"
    fi
  fi
done

echo ""

# 2. 检查 .env 文件
echo "2️⃣ Checking environment files..."
echo "-------------------------------"

if [ -f ".env" ]; then
  echo "⚠️  .env file exists"
  if grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo "   ✅ .env is in .gitignore"
  else
    echo "   ❌ .env NOT in .gitignore - SECURITY RISK!"
  fi
fi

if [ -f ".env.local" ]; then
  echo "⚠️  .env.local file exists"
  if grep -q "\.env\.local" .gitignore 2>/dev/null; then
    echo "   ✅ .env.local is in .gitignore"
  else
    echo "   ❌ .env.local NOT in .gitignore - SECURITY RISK!"
  fi
fi

echo ""

# 3. 检查代码中的硬编码私钥
echo "3️⃣ Scanning for hardcoded private keys in code..."
echo "------------------------------------------------"

# 搜索可疑的私钥模式
SUSPICIOUS_PATTERNS=(
  "PRIVATE_KEY.*=.*['\"]"
  "SECRET_KEY.*=.*['\"]"
  "WALLET_PRIVATE_KEY"
  "PLATFORM_WALLET_PRIVATE_KEY"
)

for pattern in "${SUSPICIOUS_PATTERNS[@]}"; do
  echo "Searching for: $pattern"
  grep -r "$pattern" --include="*.ts" --include="*.tsx" --include="*.js" app/ lib/ components/ 2>/dev/null | grep -v "process.env" | head -5
done

echo ""

# 4. 列出所有临时/过期文档
echo "4️⃣ Listing temporary/outdated documentation..."
echo "---------------------------------------------"

TEMP_DOCS=(
  "ANCHOR_*.md"
  "AUTH_AND_DATE_FIXES_COMPLETE.md"
  "CLEANUP_*.md"
  "COMPLETE_SUMMARY.md"
  "DATABASE_CLEANUP_COMPLETE.md"
  "DEMO_QA_CHEATSHEET.md"
  "DOCS_PAGES_COMPLETE.md"
  "DOCUMENTATION_COMPLETE.md"
  "E2E_TEST_GUIDE.md"
  "ESCROW_TECHNICAL_DECISION.md"
  "FINAL_*.md"
  "FRONTEND_*.md"
  "HACKATHON_*.md"
  "IMPLEMENTATION_*.md"
  "MARKETPLACE_INTEGRATION_COMPLETE.md"
  "MY_REQUESTS_FIX_COMPLETE.md"
  "REFUND_SCENARIOS.md"
  "REPUTATION_REFUND_SOLUTIONS.md"
  "REQUEST_DETAIL_FIXES_COMPLETE.md"
  "SUBMIT_PROPOSAL_COMPLETE.md"
  "TEST_SUCCESS_SUMMARY.md"
  "UI_*.md"
  "VIDEO_SCRIPT.md"
  "X402_ISSUES_ANALYSIS.md"
)

echo "Root directory temporary docs:"
for pattern in "${TEMP_DOCS[@]}"; do
  ls -1 $pattern 2>/dev/null
done

echo ""
echo "docs/ directory temporary docs:"
DOCS_TEMP=(
  "docs/AI_AGENT_API_COMPLETE.md"
  "docs/AI_AGENT_API_DESIGN.md"
  "docs/AI_AGENT_SCENARIOS.md"
  "docs/CORRECT_ARCHITECTURE.md"
  "docs/CRITICAL_HACKATHON_ANALYSIS.md"
  "docs/DEMO_DATA_PLAN.md"
  "docs/EIGENAI_INTEGRATION_STATUS.md"
  "docs/HACKATHON_STRATEGY.md"
  "docs/MVP_CHECKLIST.md"
  "docs/PRD_SUMMARY.md"
  "docs/PROJECT_SUMMARY.md"
  "docs/X402_INTEGRATION_COMPLETE.md"
  "docs/X402_INTEGRATION_PLAN.md"
)

for doc in "${DOCS_TEMP[@]}"; do
  if [ -f "$doc" ]; then
    echo "  - $doc"
  fi
done

echo ""

# 5. 检查未使用的脚本
echo "5️⃣ Checking for potentially unused scripts..."
echo "--------------------------------------------"

POTENTIALLY_UNUSED=(
  "scripts/check-api-keys.ts"
  "scripts/check-purchases.ts"
  "scripts/check-usdc-balance.py"
  "scripts/clear-database.ts"
  "scripts/clear-redis-cache.js"
  "scripts/create-mock-purchases.ts"
  "scripts/create-sample-datasets.ts"
  "scripts/create-test-api-key.ts"
  "scripts/create-test-user.js"
  "scripts/create-usdc-account.py"
  "scripts/deploy-anchor-escrow.sh"
  "scripts/generate-eth-wallet.js"
  "scripts/sign-eigenai-message.js"
  "scripts/test-*.js"
  "scripts/test-*.ts"
  "scripts/test-*.sh"
  "scripts/transfer-authority.js"
)

for script in "${POTENTIALLY_UNUSED[@]}"; do
  ls -1 $script 2>/dev/null
done

echo ""

# 6. 检查 datanexus_escrow 目录
echo "6️⃣ Checking datanexus_escrow directory..."
echo "---------------------------------------"

if [ -d "datanexus_escrow" ]; then
  echo "⚠️  datanexus_escrow directory exists (duplicate?)"
  echo "   This might be a duplicate of programs/escrow"
  echo "   Size: $(du -sh datanexus_escrow | cut -f1)"
fi

echo ""

# 7. 生成建议
echo "7️⃣ Recommendations..."
echo "-------------------"

cat << 'EOF'

📋 CLEANUP RECOMMENDATIONS:

1. DELETE temporary documentation files:
   - All ANCHOR_*.md files
   - All FINAL_*.md files
   - All *_COMPLETE.md files
   - All HACKATHON_*.md files (keep only essential ones)

2. KEEP these important docs:
   - README.md
   - PROJECT_STATUS.md
   - QUICK_START.md
   - ROADMAP.md
   - docs/API_DOCUMENTATION.md
   - docs/BUYER_GUIDE.md
   - docs/SELLER_GUIDE.md
   - docs/USER_STORIES.md
   - docs/ARCHITECTURE.md
   - docs/PRD.md
   - docs/REQUIREMENTS.md
   - docs/EIGENAI_INTEGRATION_GUIDE.md
   - docs/HYBRID_ENCRYPTION_GUIDE.md
   - docs/X402_IMPLEMENTATION_GUIDE.md

3. DELETE test scripts (keep only essential ones):
   - Keep: scripts/create-real-datasets.ts
   - Keep: scripts/generate-platform-wallet.js
   - Delete: All test-*.js, test-*.ts, test-*.sh files

4. DELETE duplicate directories:
   - datanexus_escrow/ (if it's a duplicate)

🔒 SECURITY RECOMMENDATIONS:

1. VERIFY .gitignore includes:
   - .env
   - .env.local
   - .env*.local
   - platform-wallet.json
   - test-wallet.json
   - *-keypair.json
   - *.pem

2. BEFORE deploying to Vercel:
   - Set all secrets as Vercel Environment Variables
   - Never commit private keys to git
   - Use Vercel's secret management

3. REMOVE from repository (if committed):
   - platform-wallet.json
   - test-wallet.json
   - Any files with private keys

4. FOR PRODUCTION:
   - Generate new platform wallet
   - Use Vercel's environment variables
   - Enable Vercel's secret scanning

EOF

echo ""
echo "✅ Security check complete!"
echo ""

