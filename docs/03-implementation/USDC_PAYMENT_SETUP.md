# USDC 支付设置指南

## 概述

DataNexus 现在使用 **USDC SPL Token** 进行支付，完全符合 x402 协议标准。

## 🔧 环境配置

### 1. 更新 `.env.local` 文件

```bash
# x402 Payment Protocol
X402_NETWORK="solana-devnet"

# PayAI Facilitator (用于支付验证)
# 支持 Mainnet 和 Devnet (由 X402_NETWORK 指定)
FACILITATOR_URL="https://facilitator.payai.network"

# USDC Token Mint Address
# Devnet USDC (Circle Official): 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
# Mainnet USDC (Circle Official): EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
NEXT_PUBLIC_USDC_MINT="4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"

# Solana RPC (可选，使用 Helius 获得更好性能)
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.devnet.solana.com"
# 或者使用 Helius:
# NEXT_PUBLIC_SOLANA_RPC_URL="https://devnet.helius-rpc.com/?api-key=YOUR_KEY"

# 注意：支付接收地址存储在数据库中
# 每个数据提供者在 User 表中有自己的 walletAddress
# 买家不需要在这里配置任何钱包地址
```

### 2. 重启开发服务器

```bash
npm run dev
```

## 💰 获取 Devnet USDC

在 Devnet 上测试之前，你需要获取一些 USDC 测试币。

### 方法 1: 使用 SPL Token Faucet

```bash
# 1. 安装 Solana CLI (如果还没安装)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# 2. 设置为 Devnet
solana config set --url https://api.devnet.solana.com

# 3. 获取 SOL (用于交易费)
solana airdrop 2

# 4. 创建 USDC Token Account
spl-token create-account Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr

# 5. 铸造 USDC (需要 mint authority)
# 注意: Devnet USDC 可能需要特殊权限
```

### 方法 2: 使用在线 Faucet

访问以下网站获取 Devnet USDC:
- https://spl-token-faucet.com/ (如果可用)
- https://faucet.circle.com/ (Circle 官方 faucet)

### 方法 3: 使用 Phantom 钱包

1. 打开 Phantom 钱包
2. 切换到 Devnet 网络
3. 在设置中启用 "Developer Mode"
4. 使用内置的 Devnet faucet

## 🧪 测试支付流程

### 网页端测试

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **访问数据集页面**
   ```
   http://localhost:3000/products/{product_id}
   ```

3. **连接钱包**
   - 确保钱包已切换到 Devnet
   - 确保钱包中有 USDC 和 SOL (用于交易费)

4. **点击 "Purchase Dataset"**

5. **查看控制台日志**
   
   **前端日志 (浏览器 Console):**
   ```
   💰 Initiating USDC payment...
      Amount: 0.1 USDC
      Recipient: 3RxgsquoKv6jgfLZoqbp...
      Sender Token Account: ABC...
      Recipient Token Account: XYZ...
      Creating recipient token account... (如果需要)
      Transfer amount (raw): 100000
      Signing transaction...
      Sending transaction...
      Transaction sent: 3BZaGC13rRH5u7Y1...
      Waiting for confirmation...
   ✅ Payment successful!
      Signature: 3BZaGC13rRH5u7Y1...
   ```

   **后端日志 (Terminal):**
   ```
   🔍 Verifying payment with PayAI facilitator...
      Token: 3BZaGC13rRH5u7Y1...
      Network: solana-devnet
      Recipient: 3RxgsquoKv6jgfLZoqbp...
      Amount: 0.1 USDC
   ✅ Payment verified by facilitator
   ```

### Python SDK 测试

```bash
cd hackathon-demo
python demo_test.py
```

**预期输出:**
```
============================================================
             Test 3: HTTP 402 Payment Required
============================================================

ℹ️  Attempting to download dataset without payment...
✅ Received HTTP 402 Payment Required

  💰 Amount: 0.1 USDC
  📍 Recipient: 3RxgsquoKv6jgfLZoqbp...
  🌐 Network: solana-devnet
  💬 Message: Payment required to access this dataset
```

## 🔍 验证流程

### 双重验证机制

1. **PayAI Facilitator (首选)**
   - 快速验证
   - 支持多种支付方式
   - 自动处理网络费用

2. **Solana 区块链直接验证 (备用)**
   - 如果 facilitator 失败，自动回退
   - 直接在链上验证 USDC 转账
   - 验证金额和接收方

### 验证步骤

```typescript
// 1. 用户发起支付
const paymentResult = await initiatePayment(...)

// 2. 后端收到带有 x-payment-token 的请求
const paymentToken = request.headers.get('x-payment-token')

// 3. 验证支付
const verification = await verifyPaymentToken(paymentToken, config)

// 4. 如果验证成功，创建订单并允许下载
if (verification.valid) {
  const order = await createOrder(...)
  return downloadFile(...)
}
```

## 🐛 常见问题

### 问题 1: "Insufficient funds"

**原因:** 钱包中没有足够的 USDC 或 SOL

**解决方案:**
```bash
# 获取 SOL (用于交易费)
solana airdrop 2

# 获取 USDC (使用 faucet)
# 见上面的 "获取 Devnet USDC" 部分
```

### 问题 2: "Token account does not exist"

**原因:** 接收方没有 USDC token account

**解决方案:** 
- 代码会自动创建接收方的 token account
- 确保钱包中有足够的 SOL 支付创建费用 (~0.002 SOL)

### 问题 3: "Not a token transfer transaction"

**原因:** 使用了 SOL 转账而不是 USDC token 转账

**解决方案:**
- 确保 `.env.local` 中设置了 `NEXT_PUBLIC_USDC_MINT`
- 清除浏览器缓存并重新加载页面
- 检查前端代码是否使用了最新版本

### 问题 4: "Facilitator verification failed"

**原因:** PayAI facilitator 无法验证支付

**解决方案:**
- 系统会自动回退到 Solana 区块链直接验证
- 检查后端日志查看详细错误信息
- 确保交易已确认 (等待几秒钟)

### 问题 5: "Amount mismatch"

**原因:** 发送的 USDC 金额与要求的不符

**解决方案:**
- 检查数据集价格
- 确保前端正确计算了金额 (USDC 有 6 位小数)
- 查看交易详情确认实际转账金额

## 📊 监控和调试

### 查看交易详情

```bash
# 在 Solana Explorer 中查看
https://explorer.solana.com/tx/{TRANSACTION_SIGNATURE}?cluster=devnet
```

### 查看 Token Account 余额

```bash
# 使用 Solana CLI
spl-token accounts

# 查看特定 token account
spl-token balance Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
```

### 后端日志

查看 Next.js 开发服务器的终端输出，所有验证步骤都有详细日志。

## 🚀 生产环境部署

### 切换到 Mainnet

1. **更新环境变量**
   ```bash
   X402_NETWORK="solana"
   NEXT_PUBLIC_SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
   NEXT_PUBLIC_USDC_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
   ```

2. **使用生产 RPC**
   - 推荐使用 Helius、QuickNode 或 Alchemy
   - 免费的公共 RPC 可能有速率限制

3. **测试**
   - 先用小额测试
   - 确认所有验证流程正常
   - 监控交易成功率

## 📚 相关文档

- [x402 协议规范](./X402_PURCHASE_FLOW.md)
- [Solana SPL Token 文档](https://spl.solana.com/token)
- [PayAI Facilitator 文档](https://docs.payai.network/)
- [USDC on Solana](https://www.circle.com/en/usdc-multichain/solana)

