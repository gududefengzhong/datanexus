#!/bin/bash

# 检查 DataNexus 环境配置
# 使用方法: bash scripts/check-environment.sh

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  DataNexus 环境检查${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 检查 Solana CLI
echo -e "${BLUE}1️⃣ 检查 Solana CLI${NC}"
if command -v solana &> /dev/null; then
  SOLANA_VERSION=$(solana --version)
  echo -e "${GREEN}✓ Solana CLI 已安装: $SOLANA_VERSION${NC}"
else
  echo -e "${RED}✗ Solana CLI 未安装${NC}"
  exit 1
fi
echo ""

# 2. 检查 Node.js
echo -e "${BLUE}2️⃣ 检查 Node.js${NC}"
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}✓ Node.js 已安装: $NODE_VERSION${NC}"
else
  echo -e "${RED}✗ Node.js 未安装${NC}"
  exit 1
fi
echo ""

# 3. 检查平台钱包文件
echo -e "${BLUE}3️⃣ 检查平台钱包文件${NC}"
if [ -f "platform-wallet.json" ]; then
  echo -e "${GREEN}✓ platform-wallet.json 存在${NC}"
  
  # 使用 Node.js 读取钱包地址
  PLATFORM_WALLET=$(node -e "
    const fs = require('fs');
    const { Keypair } = require('@solana/web3.js');
    const secretKey = JSON.parse(fs.readFileSync('platform-wallet.json', 'utf8'));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
    console.log(keypair.publicKey.toBase58());
  ")
  
  echo "  地址: $PLATFORM_WALLET"
else
  echo -e "${RED}✗ platform-wallet.json 不存在${NC}"
  echo "  请运行: node scripts/generate-platform-wallet.js"
  exit 1
fi
echo ""

# 4. 检查 SOL 余额
echo -e "${BLUE}4️⃣ 检查 SOL 余额${NC}"
SOL_BALANCE=$(solana balance $PLATFORM_WALLET 2>&1 || echo "0")
echo "  余额: $SOL_BALANCE"

if [[ "$SOL_BALANCE" == *"0 SOL"* ]] || [[ "$SOL_BALANCE" == "0" ]]; then
  echo -e "${YELLOW}⚠️  SOL 余额不足${NC}"
  echo "  获取测试 SOL: solana airdrop 2 $PLATFORM_WALLET"
else
  echo -e "${GREEN}✓ SOL 余额充足${NC}"
fi
echo ""

# 5. 检查 USDC Token 账户
echo -e "${BLUE}5️⃣ 检查 USDC Token 账户${NC}"
USDC_MINT="4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"

if command -v spl-token &> /dev/null; then
  USDC_BALANCE=$(spl-token balance $USDC_MINT --owner $PLATFORM_WALLET 2>&1 || echo "0")
  echo "  USDC 余额: $USDC_BALANCE"
  
  if [[ "$USDC_BALANCE" == "0" ]] || [[ "$USDC_BALANCE" == *"Error"* ]]; then
    echo -e "${YELLOW}⚠️  USDC Token 账户不存在或余额为 0${NC}"
    echo "  创建账户: spl-token create-account $USDC_MINT"
    echo "  获取测试 USDC: 访问 https://spl-token-faucet.com/"
  else
    echo -e "${GREEN}✓ USDC Token 账户存在${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  spl-token CLI 未安装${NC}"
  echo "  安装: cargo install spl-token-cli"
fi
echo ""

# 6. 检查环境变量文件
echo -e "${BLUE}6️⃣ 检查环境变量文件${NC}"
if [ -f ".env.local" ]; then
  echo -e "${GREEN}✓ .env.local 存在${NC}"
  
  # 检查关键环境变量
  if grep -q "PLATFORM_WALLET" .env.local; then
    echo -e "${GREEN}  ✓ PLATFORM_WALLET 已配置${NC}"
  else
    echo -e "${YELLOW}  ⚠️  PLATFORM_WALLET 未配置${NC}"
  fi
  
  if grep -q "PLATFORM_PRIVATE_KEY" .env.local; then
    echo -e "${GREEN}  ✓ PLATFORM_PRIVATE_KEY 已配置${NC}"
  else
    echo -e "${YELLOW}  ⚠️  PLATFORM_PRIVATE_KEY 未配置${NC}"
  fi
  
  if grep -q "DATABASE_URL" .env.local; then
    echo -e "${GREEN}  ✓ DATABASE_URL 已配置${NC}"
  else
    echo -e "${YELLOW}  ⚠️  DATABASE_URL 未配置${NC}"
  fi
  
  if grep -q "IRYS_PRIVATE_KEY" .env.local; then
    echo -e "${GREEN}  ✓ IRYS_PRIVATE_KEY 已配置${NC}"
  else
    echo -e "${YELLOW}  ⚠️  IRYS_PRIVATE_KEY 未配置${NC}"
  fi
else
  echo -e "${RED}✗ .env.local 不存在${NC}"
  echo "  请复制 .env.example 到 .env.local 并配置"
fi
echo ""

# 7. 检查数据库连接
echo -e "${BLUE}7️⃣ 检查数据库连接${NC}"
if [ -f "node_modules/.bin/prisma" ]; then
  echo -e "${GREEN}✓ Prisma 已安装${NC}"
  
  # 尝试连接数据库
  if npx prisma db push --skip-generate &> /dev/null; then
    echo -e "${GREEN}✓ 数据库连接成功${NC}"
  else
    echo -e "${YELLOW}⚠️  数据库连接失败或已是最新${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Prisma 未安装${NC}"
  echo "  安装依赖: npm install"
fi
echo ""

# 8. 检查 Redis
echo -e "${BLUE}8️⃣ 检查 Redis${NC}"
if command -v redis-cli &> /dev/null; then
  if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✓ Redis 运行中${NC}"
  else
    echo -e "${YELLOW}⚠️  Redis 未运行${NC}"
    echo "  启动 Redis: redis-server"
  fi
else
  echo -e "${YELLOW}⚠️  Redis CLI 未安装${NC}"
  echo "  安装: brew install redis"
fi
echo ""

# 9. 总结
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  环境检查总结${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}平台钱包信息:${NC}"
echo "  地址: $PLATFORM_WALLET"
echo "  SOL 余额: $SOL_BALANCE"
echo "  Solana Explorer: https://explorer.solana.com/address/$PLATFORM_WALLET?cluster=devnet"
echo ""

echo -e "${BLUE}下一步操作:${NC}"
echo "  1. 确保 SOL 余额充足: solana airdrop 2 $PLATFORM_WALLET"
echo "  2. 创建 USDC Token 账户: spl-token create-account $USDC_MINT"
echo "  3. 配置 .env.local 文件"
echo "  4. 启动开发服务器: npm run dev"
echo "  5. 运行测试: bash scripts/test-escrow.sh"
echo ""

echo -e "${GREEN}✓ 环境检查完成！${NC}"

