# DataNexus 购买模型说明

## 💰 购买模型：一次购买，永久使用

### 核心设计

DataNexus 采用 **"Buy Once, Download Forever"** 模型：

```
用户购买数据集
    ↓
创建 Order 记录（status: 'completed'）
    ↓
用户可以无限次下载该数据集
    ↓
每次下载都会更新 downloadCount 和 lastDownloadAt
    ↓
无需额外支付
```

---

## 🔍 技术实现

### 1. 购买检查逻辑

```typescript
// 检查用户是否已购买
const order = await prisma.order.findFirst({
  where: {
    productId,
    buyerId: user.id,
    status: 'completed',  // 只要有完成的订单
  },
})

const hasPurchased = !!order

// 如果已购买，直接允许下载
if (hasPurchased || isProvider) {
  return handleDownload(product, order, user.id, false)
}

// 如果未购买，返回 HTTP 402 Payment Required
return requirePayment(paymentConfig)(request, async () => {
  // 支付验证通过后，创建订单并下载
  const newOrder = await prisma.order.create({
    data: {
      productId,
      buyerId: user.id,
      amount: product.price,
      status: 'completed',
      paymentTxHash: request.headers.get('x-payment-token'),
      paymentNetwork: 'solana-devnet',
    },
  })
  
  return handleDownload(product, newOrder, user.id, false)
})
```

### 2. 下载追踪

每次下载都会更新订单记录：

```typescript
// 更新下载统计
await prisma.order.update({
  where: { id: order.id },
  data: {
    downloadCount: { increment: 1 },
    lastDownloadAt: new Date(),
  },
})
```

### 3. Order 模型字段

```prisma
model Order {
  id              String   @id @default(uuid())
  productId       String
  buyerId         String
  
  // 支付信息
  amount          Float
  status          String   @default("pending")  // 'pending' | 'completed' | 'failed' | 'refunded'
  paymentTxHash   String?
  paymentNetwork  String?
  
  // 下载追踪 ✅
  downloadCount   Int      @default(0)
  lastDownloadAt  DateTime?
  
  // 退款设置
  canRefund       Boolean  @default(true)
  refundDeadline  DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## ✅ 为什么选择这个模型？

### 1. 符合数据产品特性
- 数据不是消耗品，一次购买应该永久拥有
- 类似于购买电子书、软件许可证

### 2. 用户体验好
- 不需要每次下载都支付
- 降低使用门槛
- 符合 Web2 用户习惯（Kaggle、AWS Data Exchange）

### 3. 降低交易成本
- 减少 Solana 交易费用
- 减少 PayAI facilitator 验证次数
- 提高系统性能

### 4. 支持多次下载
- 用户可能需要在不同设备上下载
- 支持数据备份和恢复
- 允许重新下载（如果本地文件丢失）

### 5. 便于追踪和分析
- `downloadCount` - 了解数据集的实际使用情况
- `lastDownloadAt` - 了解用户活跃度
- 可以用于推荐系统和数据分析

---

## 🆚 与其他模型对比

| 模型 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **一次购买，永久使用** ✅ | 用户体验好，交易成本低 | 提供者收入有限 | 静态数据集、历史数据 |
| 按次下载 | 提供者收入高 | 用户体验差，交易成本高 | 高价值数据、API 调用 |
| 订阅模式 | 持续收入 | 实现复杂 | 实时数据、定期更新的数据 |
| 下载次数限制 | 平衡收入和体验 | 需要额外逻辑 | 中等价值数据 |

---

## 🔮 未来扩展选项

如果需要支持更多定价模式，可以添加以下字段：

### 选项 1: 订阅模式

```prisma
model Order {
  // ... 现有字段
  
  // 订阅相关
  subscriptionType String?  // 'one-time' | 'monthly' | 'yearly'
  expiresAt        DateTime?  // 订阅到期时间
}

model DataProduct {
  // ... 现有字段
  
  // 定价模式
  pricingModel     String @default("one-time")  // 'one-time' | 'subscription'
  subscriptionPrice Float?  // 订阅价格（月费）
}
```

### 选项 2: 下载次数限制

```prisma
model DataProduct {
  // ... 现有字段
  
  maxDownloads Int?  // 最大下载次数（null = 无限制）
}

// 检查逻辑
if (product.maxDownloads && order.downloadCount >= product.maxDownloads) {
  return NextResponse.json(
    { error: 'Download limit reached. Please purchase again.' },
    { status: 403 }
  )
}
```

### 选项 3: 时间限制

```prisma
model Order {
  // ... 现有字段
  
  accessExpiresAt DateTime?  // 访问到期时间
}

model DataProduct {
  // ... 现有字段
  
  accessDuration Int?  // 访问时长（天数，null = 永久）
}

// 创建订单时设置到期时间
const expiresAt = product.accessDuration
  ? new Date(Date.now() + product.accessDuration * 24 * 60 * 60 * 1000)
  : null

// 检查逻辑
if (order.accessExpiresAt && new Date() > order.accessExpiresAt) {
  return NextResponse.json(
    { error: 'Access expired. Please purchase again.' },
    { status: 403 }
  )
}
```

---

## 🎯 推荐策略

### 现阶段（Hackathon）
✅ **保持 "一次购买，永久使用"**

**原因**：
- 最简单，最容易演示
- 符合大多数数据集的特性
- 用户体验最好
- 降低 demo 复杂度

### 未来（生产环境）
🔮 **让数据提供者选择定价模式**

```typescript
// 数据提供者上传时选择
interface PricingOptions {
  model: 'one-time' | 'subscription' | 'pay-per-download'
  price: number
  subscriptionPrice?: number  // 如果是订阅模式
  maxDownloads?: number  // 如果是限次数模式
  accessDuration?: number  // 如果是时间限制模式
}
```

**示例**：
- **历史数据集**：一次购买，永久使用（$0.1）
- **实时数据流**：月度订阅（$5/月）
- **高价值报告**：限 3 次下载（$10）
- **时效性数据**：30 天访问（$2）

---

## 📊 当前实现状态

| 功能 | 状态 | 说明 |
|------|------|------|
| 一次购买，永久使用 | ✅ 已实现 | 核心功能 |
| 下载次数追踪 | ✅ 已实现 | `downloadCount` 字段 |
| 最后下载时间 | ✅ 已实现 | `lastDownloadAt` 字段 |
| 订阅模式 | ❌ 未实现 | 未来扩展 |
| 下载次数限制 | ❌ 未实现 | 未来扩展 |
| 时间限制 | ❌ 未实现 | 未来扩展 |

---

## 🔗 相关文档

- [X402_PURCHASE_FLOW.md](./X402_PURCHASE_FLOW.md) - x402 购买流程
- [PAYMENT_FLOW_EXPLAINED.md](./PAYMENT_FLOW_EXPLAINED.md) - 支付流程详解
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API 文档

---

**总结**：DataNexus 的 "Buy Once, Download Forever" 模型是经过深思熟虑的设计，完美平衡了用户体验、交易成本和系统复杂度。对于 Hackathon 演示和大多数数据集场景，这是最佳选择。

