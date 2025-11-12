# USDC Mint Address Fix

## 问题

在 Solana Devnet 上有多个 USDC token，使用不同的 mint address。我们之前使用的 mint address 与 Circle Faucet 提供的不一致，导致用户无法使用从 Circle Faucet 获取的 USDC。

## 错误信息

```
Simulation failed. Message: Transaction simulation failed: Error processing Instruction 1: invalid account data for instruction.
Program log: Error: InvalidAccountData
```

## 根本原因

**之前的配置：**
```bash
NEXT_PUBLIC_USDC_MINT="Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
```

**Circle Faucet 使用的 USDC：**
```bash
NEXT_PUBLIC_USDC_MINT="4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
```

当用户从 Circle Faucet 获取 USDC 时，会创建一个基于 `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` mint 的 token account。但我们的代码尝试使用 `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr` mint 创建转账，导致 "invalid account data" 错误。

## 解决方案

### 1. 更新环境变量

**`.env.example`:**
```bash
# USDC Token Mint Address
# Devnet USDC (Circle Official): 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
# Mainnet USDC (Circle Official): EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
NEXT_PUBLIC_USDC_MINT="4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
```

**`.env.local`:**
```bash
NEXT_PUBLIC_USDC_MINT="4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
```

### 2. 更新脚本

- `scripts/check-usdc-account.mjs` - 使用 Circle 官方 USDC mint
- `scripts/create-usdc-account.mjs` - 使用 Circle 官方 USDC mint

### 3. 更新文档

- `docs/USDC_PAYMENT_SETUP.md` - 更新 USDC mint address

## Solana Devnet USDC Tokens

| Mint Address | 来源 | 推荐 | 说明 |
|-------------|------|------|------|
| `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` | Circle 官方 | ✅ 是 | 与 Mainnet 一致，Circle Faucet 支持 |
| `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr` | 社区/测试 | ❌ 否 | 不推荐使用 |

## 如何获取 Devnet USDC

### 方法 1: Circle USDC Faucet（推荐）

1. 访问: https://faucet.circle.com/
2. 选择 "Solana Devnet"
3. 输入钱包地址
4. 点击 "Get USDC"

**优点：**
- ✅ 自动创建 USDC token account
- ✅ 自动发送 10 USDC
- ✅ 使用官方 USDC mint

### 方法 2: Phantom 钱包

1. 打开 Phantom 钱包
2. 切换到 Devnet 网络
3. 点击 "Receive"
4. 搜索 "USDC"
5. 点击 "Add Token"
6. 使用内置 faucet 获取 USDC

### 方法 3: Solana CLI

```bash
# 1. 设置 Devnet
solana config set --url https://api.devnet.solana.com

# 2. 获取 SOL (用于交易费)
solana airdrop 2

# 3. 创建 USDC token account
spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

## 验证

运行检查脚本验证你的钱包有正确的 USDC token account：

```bash
node scripts/check-usdc-account.mjs <YOUR_WALLET_ADDRESS>
```

**预期输出：**
```
✅ USDC token account EXISTS
💰 Balance: 10 USDC
✅ Token account data structure is correct (165 bytes)
```

## 测试

1. 更新 `.env.local` 中的 `NEXT_PUBLIC_USDC_MINT`
2. 重启开发服务器: `npm run dev`
3. 访问数据集页面
4. 点击 "Purchase Dataset"
5. 确认支付成功

## 相关文件

- `.env.example` - 环境变量模板
- `lib/x402.ts` - 前端支付逻辑
- `lib/x402-middleware.ts` - 后端验证逻辑
- `scripts/check-usdc-account.mjs` - USDC account 检查脚本
- `scripts/create-usdc-account.mjs` - USDC account 创建指南
- `docs/USDC_PAYMENT_SETUP.md` - USDC 支付设置文档

## 注意事项

1. **Mainnet vs Devnet**: 确保在生产环境使用 Mainnet USDC mint (`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`)

2. **Token Account 创建**: 第一次接收 USDC 时会自动创建 token account，但需要支付一小笔 SOL 作为 rent

3. **不同的 USDC tokens**: Devnet 上可能有多个 USDC token，确保使用 Circle 官方的

4. **PayAI Facilitator**: 使用 Circle 官方 USDC 确保与 PayAI facilitator 兼容

## 参考

- Circle USDC Faucet: https://faucet.circle.com/
- PayAI Documentation: https://docs.payai.network/
- Solana SPL Token: https://spl.solana.com/token

