# DataNexus 支付流程详解

## 💰 USDC 流转过程

### 架构图

```
┌─────────────┐                    ┌─────────────┐
│   买家钱包   │                    │   卖家钱包   │
│   (Buyer)   │                    │  (Provider) │
└──────┬──────┘                    └──────▲──────┘
       │                                  │
       │  ① USDC 直接转账                 │
       │     (SPL Token Transfer)         │
       └──────────────────────────────────┘
                      │
                      │ ② 交易签名
                      ▼
       ┌──────────────────────────┐
       │   Solana 区块链          │
       │   (Transaction Record)   │
       └──────────────┬───────────┘
                      │
                      │ ③ 验证交易
                      ▼
       ┌──────────────────────────┐
       │  PayAI Facilitator       │
       │  (验证服务，不参与资金)   │
       └──────────────┬───────────┘
                      │
                      │ ④ 验证结果
                      ▼
       ┌──────────────────────────┐
       │  DataNexus 后端          │
       │  (创建订单，授权下载)     │
       └──────────────────────────┘
```

### 详细流程

#### 1️⃣ 前端发起支付 (`lib/x402.ts`)

```typescript
// 创建 USDC SPL Token 转账交易
const transaction = new Transaction()

// 如果接收方没有 USDC token account，先创建
if (!recipientAccountInfo) {
  transaction.add(
    createAssociatedTokenAccountInstruction(
      walletPublicKey,      // 买家支付创建费用
      recipientTokenAccount, // 卖家的 USDC account
      recipientPubkey,       // 卖家地址
      usdcMintAddress,       // USDC mint
    )
  )
}

// 添加 USDC 转账指令
transaction.add(
  createTransferInstruction(
    senderTokenAccount,    // 买家的 USDC account
    recipientTokenAccount, // 卖家的 USDC account
    walletPublicKey,       // 买家钱包（签名者）
    usdcAmount,            // 金额（最小单位，6 位小数）
  )
)

// 买家签名并发送交易
const signedTx = await signTransaction(transaction)
const signature = await connection.sendRawTransaction(signedTx.serialize())
```

**关键点：**
- ✅ USDC **直接**从买家转到卖家
- ✅ 没有中间托管
- ✅ 没有平台抽成（可以在未来添加）
- ✅ 卖家地址来自数据库 (`product.provider.walletAddress`)

#### 2️⃣ 后端验证支付 (`lib/x402-middleware.ts`)

**方法 1: 使用 PayAI Facilitator（推荐）**

```typescript
POST https://facilitator.payai.network/verify
{
  "token": "交易签名",
  "network": "solana-devnet",
  "recipient": "卖家钱包地址",
  "amount": "0.1",
  "currency": "USDC"
}

// 响应
{
  "valid": true,
  "signature": "交易签名",
  "amount": 0.1,
  "recipient": "卖家地址"
}
```

**方法 2: 直接查询 Solana 区块链（Fallback）**

```typescript
// 获取交易详情
const tx = await connection.getTransaction(signature)

// 验证：
// 1. 交易成功
// 2. 包含 Token Program
// 3. 转账金额正确
// 4. 接收方地址正确
```

**PayAI Facilitator 的作用：**
- ❌ **不参与资金流转**（USDC 已经直接转账完成）
- ✅ **只验证交易真实性**（防止伪造交易签名）
- ✅ **提供统一的验证接口**（支持多条链）
- ✅ **缓存验证结果**（提高性能）

#### 3️⃣ 创建订单并授权下载

```typescript
// 验证通过后，创建订单
const order = await prisma.order.create({
  data: {
    productId,
    buyerId,
    amount: product.price,
    status: 'completed',
    paymentTxHash: signature,
    paymentNetwork: 'solana-devnet',
  },
})

// 返回文件数据
return new Response(fileBuffer, {
  headers: {
    'Content-Type': product.fileType,
    'Content-Disposition': `attachment; filename="${product.fileName}"`,
  },
})
```

---

## 🔄 完整的 x402 购买流程

### 网页端购买流程

```
用户点击 "Purchase Dataset"
    ↓
① 第一次请求下载
    GET /api/products/{id}/download
    Headers: { Authorization: "Bearer {JWT}" }
    ↓
② 收到 HTTP 402 Payment Required
    Status: 402
    Headers: {
      x-payment-amount: "0.1",
      x-payment-currency: "USDC",
      x-payment-recipient: "卖家地址",
      x-payment-network: "solana-devnet",
      x-payment-message: "Payment required"
    }
    ↓
③ 前端发起 Solana USDC 支付
    - 连接 Phantom 钱包
    - 创建 USDC 转账交易
    - 用户签名
    - 发送到 Solana 区块链
    - 获得交易签名
    ↓
④ 带着交易签名重新请求下载
    GET /api/products/{id}/download
    Headers: {
      Authorization: "Bearer {JWT}",
      x-payment-token: "交易签名"
    }
    ↓
⑤ 后端验证支付
    - 调用 PayAI Facilitator 验证
    - 或直接查询 Solana 区块链
    ↓
⑥ 验证通过，创建订单
    - 保存订单到数据库
    - 标记为 completed
    ↓
⑦ 解密并返回文件
    - 从 Irys 获取加密文件
    - 解密加密密钥
    - 解密文件数据
    - 返回原始文件
    ↓
⑧ 前端自动下载文件
    - 创建 Blob
    - 触发浏览器下载
    ↓
✅ 购买完成！
```

### Python SDK 购买流程

```python
# 1. 尝试下载（会收到 HTTP 402）
result = client.download_dataset(dataset_id, auto_pay=False)

if result.get('paymentRequired'):
    print(f"需要支付: {result['amount']} {result['currency']}")
    print(f"接收方: {result['recipient']}")
    
    # 2. 用户需要通过网页 UI 完成支付
    # （Python SDK 暂不支持自动支付）
    
# 3. 支付完成后，再次下载
client.download_dataset(dataset_id, "output.csv")
```

---

## 🔐 文件加密/解密流程

### 上传时加密

```
原始文件
    ↓
① 生成随机 AES-256 密钥
    encryptionKey = randomBytes(32)
    ↓
② 用 encryptionKey 加密文件
    encryptedFile = AES-256-GCM(file, encryptionKey)
    → 得到: encryptedData, IV, AuthTag
    ↓
③ 用 Master Key 加密 encryptionKey
    encryptedKey = AES-256-GCM(encryptionKey, masterKey)
    → 得到: keyCiphertext, keyIV, keyAuthTag
    ↓
④ 上传到 Irys
    - 上传 encryptedData
    - Metadata: IV, AuthTag
    ↓
⑤ 保存到数据库
    - keyCiphertext
    - keyIV
    - keyAuthTag
```

### 下载时解密

```
用户购买后下载
    ↓
① 从数据库获取加密的密钥
    - keyCiphertext
    - keyIV
    - keyAuthTag
    ↓
② 用 Master Key 解密密钥
    encryptionKey = AES-256-GCM-Decrypt(
      keyCiphertext, keyIV, keyAuthTag, masterKey
    )
    ↓
③ 从 Irys 获取加密文件和元数据
    - encryptedData
    - IV (from Irys metadata)
    - AuthTag (from Irys metadata)
    ↓
④ 用 encryptionKey 解密文件
    originalFile = AES-256-GCM-Decrypt(
      encryptedData, IV, AuthTag, encryptionKey
    )
    ↓
⑤ 返回原始文件给用户
```

---

## ❓ 常见问题

### Q1: 为什么不使用平台托管支付？

**A:** 去中心化理念
- ✅ 资金直接从买家到卖家，无需信任平台
- ✅ 降低平台风险（不持有用户资金）
- ✅ 降低监管风险
- ✅ 提高透明度（所有交易在链上可查）

### Q2: 平台如何收取手续费？

**A:** 可以在未来添加：
```typescript
// 方案 1: 在转账时添加平台费用指令
transaction.add(
  createTransferInstruction(
    senderTokenAccount,
    platformFeeAccount,  // 平台手续费账户
    walletPublicKey,
    platformFee,         // 例如 2% 手续费
  )
)

// 方案 2: 卖家提现时扣除
// 卖家需要通过平台提现，平台在提现时扣除手续费
```

### Q3: PayAI Facilitator 是否必需？

**A:** 不是必需的，但强烈推荐
- ✅ 提供统一的验证接口
- ✅ 支持多条链（Solana, Ethereum, etc.）
- ✅ 缓存验证结果，提高性能
- ✅ 如果 facilitator 失败，会自动回退到直接查询区块链

### Q4: 购买后为什么还要点击下载？

**A:** 已修复！现在购买成功后会自动下载文件。

### Q5: Python SDK 支持自动支付吗？

**A:** 暂不支持
- Python SDK 目前只能检测 HTTP 402
- 用户需要通过网页 UI 完成支付
- 未来可以添加 Solana Python SDK 集成

---

## 📋 相关文件

- `lib/x402.ts` - 前端支付逻辑
- `lib/x402-middleware.ts` - 后端验证逻辑
- `app/products/[id]/page.tsx` - 网页购买流程
- `app/api/products/[id]/download/route.ts` - 网页下载端点
- `app/api/agent/datasets/[id]/download/route.ts` - Agent API 下载端点
- `examples/python-sdk/datanexus_client.py` - Python SDK
- `examples/python-sdk/demo_test.py` - Python SDK 测试脚本

