# DataNexus Python SDK Testing Guide

## 🧪 测试脚本说明

### `demo_test.py` - 完整测试套件

这是主要的测试脚本，包含以下测试：

#### Test 1: API Connectivity
- 测试 API 连接是否正常
- 验证 API key 是否有效

#### Test 2: Get Dataset Details
- 获取数据集详细信息
- 显示名称、价格、描述、提供者等

#### Test 3: HTTP 402 Payment Required (x402 Protocol)
- **模拟完整的 x402 购买流程**
- 显示详细的请求/响应日志
- 展示支付详情（金额、接收方、网络）

#### Test 4: Purchase History
- 获取购买历史记录
- 显示已购买的数据集

#### Test 5: Demo Simulation
- **模拟实际的 demo 视频流程**
- 搜索 → 查看详情 → 尝试下载 → 收到 402 → 支付 → 下载成功

---

## 🚀 运行测试

### 1. 设置环境变量

```bash
# 在 examples/python-sdk 目录下创建 .env 文件
cd examples/python-sdk

# 添加以下内容到 .env
DATANEXUS_BASE_URL=http://localhost:3000
DATANEXUS_API_KEY=your_api_key_here
```

### 2. 运行测试

```bash
python demo_test.py
```

### 3. 预期输出

```
╔════════════════════════════════════════════════════════════╗
║         DataNexus Demo Test Suite                         ║
║         Solana x402 Hackathon 2025                         ║
╚════════════════════════════════════════════════════════════╝

ℹ️  Test started at: 2025-01-12 10:30:00

============================================================
              Testing Environment Setup
============================================================

✅ Python version: 3.11.x
✅ Required packages installed
✅ Environment variables configured

============================================================
                Test 1: API Connectivity
============================================================

ℹ️  Testing API connection...
✅ API is reachable and responding

============================================================
                Test 2: Search Datasets
============================================================

ℹ️  Searching for datasets with query: 'DeFi'
✅ Found 5 datasets

  1. DeFi Protocol TVL Rankings - Multi-Chain
     💰 Price: 0.1 USDC
     📝 Category: defi

============================================================
                Test 2: Get Dataset Details
============================================================

ℹ️  Fetching details for dataset: 3c616f99-203f-4617-bad4-5377667a5e62
✅ Dataset details retrieved

  📊 Name: DeFi Protocol TVL Rankings - Multi-Chain
  💰 Price: 0.1 USDC
  📝 Description: Comprehensive dataset tracking Total Value Locked (TVL) across major DeFi protocols...
  👤 Provider: 3RxgsquoKv6jgfLZoqbp...
  📥 Purchases: 5
  👁️  Views: 42

============================================================
     Test 3: HTTP 402 Payment Required (x402 Protocol)
============================================================

ℹ️  🛒 Starting x402 purchase flow simulation...
ℹ️  📋 Dataset ID: 3c616f99-203f-4617-bad4-5377667a5e62

ℹ️  📥 Step 1: Requesting download without payment...
ℹ️     GET /api/agent/datasets/3c616f99-203f-4617-bad4-5377667a5e62/download
ℹ️     Headers: { Authorization: Bearer <API_KEY> }

✅ 💰 Step 2: Received HTTP 402 Payment Required

ℹ️  📋 Payment Details:
   Amount: 0.1 USDC
   Recipient: 3RxgsquoKv6jgfLZoqbpZUpbV5uJsV7fxMqqKbgruatG
   Network: solana-devnet
   Message: Purchase dataset: DeFi Protocol TVL Rankings - Multi-Chain

ℹ️  💳 Step 3: User needs to make Solana payment
ℹ️     This can be done via:
ℹ️     - Web UI (recommended)
ℹ️     - Solana CLI
ℹ️     - Phantom wallet

ℹ️  📥 Step 4: After payment, retry download with x-payment-token
ℹ️     GET /api/agent/datasets/3c616f99-203f-4617-bad4-5377667a5e62/download
ℹ️     Headers: {
ℹ️       Authorization: Bearer <API_KEY>,
ℹ️       x-payment-token: <TRANSACTION_SIGNATURE>
ℹ️     }

✅ ✅ x402 protocol flow verified!

============================================================
                  Test 4: Purchase History
============================================================

ℹ️  Fetching purchase history...
✅ Found 3 total purchases

ℹ️  Showing 3 recent purchases:

  1. DeFi Protocol TVL Rankings - Multi-Chain
     💰 Amount: 0.1 USDC
     📅 Date: 2025-01-12
     ✅ Status: completed
     🔗 TX: 5j7s8k2pQm3nR4tY6u...

============================================================
       Demo Simulation (What You'll Show in Video)
============================================================

This simulates the exact flow for the demo video:

🔍 Step 1: Agent searches for DeFi datasets...
✅ Found 5 datasets

📊 Step 2: Agent examines dataset details...
  Name: DeFi Protocol TVL Rankings - Multi-Chain
  Price: 0.1 USDC
  Category: defi

💳 Step 3: Agent attempts download...
⚠️  HTTP 402: Payment Required
  Amount: 0.1 USDC
  Recipient: 3RxgsquoKv6jgfLZoqbpZUpbV5uJsV7f...

💸 Step 4: Agent pays on Solana...
ℹ️  Creating Solana transaction...
ℹ️  Waiting for confirmation (400ms)...
✅ Payment confirmed: 5j7s8k2p... (simulated)

📥 Step 5: Agent retries download with payment proof...
✅ Dataset downloaded successfully (simulated)
✅ Decryption key received

✅ Complete Flow Demonstrated!

Total time: ~2 seconds
Total cost: $0.00025 (Solana fee)

============================================================
                    Test Summary
============================================================

Total Tests: 6
Passed: 6
Failed: 0
Success Rate: 100.0%

  CONNECTIVITY: ✅ PASS
  SEARCH: ✅ PASS
  DETAILS: ✅ PASS
  HTTP_402: ✅ PASS
  HISTORY: ✅ PASS
  DEMO: ✅ PASS

Test completed at: 2025-01-12 10:30:15

🎉 All tests passed! Ready to record demo video!
```

---

## 📝 修复的问题

### 1. ✅ Test 2: Dataset Details 显示 None
**问题**: API 返回 `{ success: true, data: dataset }`，但代码期望 `{ success: true, data: { dataset: ... } }`

**修复**: 
```python
# 之前
dataset = result.get('data', {}).get('dataset', {})

# 现在
dataset = result.get('data', {})  # data 就是 dataset
```

### 2. ✅ Test 3: HTTP 402 - 添加详细日志
**问题**: 输出太简单，不够详细

**修复**: 添加了完整的 x402 流程说明：
- Step 1: 请求下载（显示 HTTP 请求）
- Step 2: 收到 402（显示支付详情）
- Step 3: 用户支付（说明支付方式）
- Step 4: 重试下载（显示带 token 的请求）

### 3. ✅ Test 4: Purchase History 方法名错误
**问题**: 调用了不存在的 `get_purchase_history()` 方法

**修复**:
```python
# 之前
result = client.get_purchase_history(limit=5)

# 现在
result = client.get_purchases(limit=5)
```

### 4. ✅ Agent API 使用错误的接收地址
**问题**: Agent API 使用 `PAYMENT_WALLET_ADDRESS` 环境变量

**修复**: 使用数据提供者的钱包地址
```typescript
// 之前
recipient: process.env.PAYMENT_WALLET_ADDRESS!

// 现在
recipient: dataset.provider.walletAddress
```

---

## 🎬 Demo Simulation

Demo Simulation 会自动运行，模拟完整的购买流程：

1. **搜索数据集** - 搜索 "DeFi" 相关数据集
2. **查看详情** - 显示数据集名称、价格、类别
3. **尝试下载** - 收到 HTTP 402 Payment Required
4. **模拟支付** - 显示 Solana 支付过程（模拟）
5. **重试下载** - 带着支付凭证重新下载
6. **成功** - 显示总时间和成本

这个流程可以直接用于录制 demo 视频！

---

## 🔧 故障排除

### 问题: API 连接失败
```bash
# 检查服务器是否运行
curl http://localhost:3000/api/health

# 检查环境变量
echo $DATANEXUS_BASE_URL
echo $DATANEXUS_API_KEY
```

### 问题: API Key 无效
```bash
# 在网页 UI 中重新生成 API key
# 访问: http://localhost:3000/dashboard/api-keys
```

### 问题: 找不到数据集
```bash
# 确保数据库中有数据集
# 运行: npm run seed (在主项目目录)
```

---

## 📚 相关文件

- `demo_test.py` - 主测试脚本
- `datanexus_client.py` - Python SDK
- `x402_example.py` - 完整的 x402 + Solana 支付示例
- `README.md` - SDK 使用文档

