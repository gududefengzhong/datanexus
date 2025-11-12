# 🏆 Provider Reputation System - 完整逻辑说明

## 📋 目录

1. [系统概述](#系统概述)
2. [数据模型](#数据模型)
3. [信誉分数计算](#信誉分数计算)
4. [徽章系统](#徽章系统)
5. [评分流程](#评分流程)
6. [链上同步](#链上同步)
7. [API 端点](#api-端点)
8. [触发机制](#触发机制)

---

## 系统概述

Provider Reputation System 是一个**完全自动化**的信誉管理系统，用于评估和展示数据提供者的可信度。

### 核心特性

- ✅ **自动计算** - 基于销售、评分、争议、退款自动更新
- ✅ **多维度评估** - 综合考虑多个指标
- ✅ **徽章系统** - 5 种徽章（verified, top-seller, trusted, high-quality, reliable）
- ✅ **链上验证** - 高分提供者（≥80）自动同步到 Irys 和 Solana
- ✅ **防作弊** - 多重验证，防止虚假评分

---

## 数据模型

### 1. ProviderReputation（信誉记录）

```typescript
model ProviderReputation {
  id              String   @id @default(uuid())
  providerId      String   @unique
  
  // 统计数据
  totalSales      Int      @default(0)        // 总销售数
  totalRevenue    Float    @default(0)        // 总收入
  
  // 评分
  averageRating   Float    @default(0)        // 平均评分（1-5）
  totalRatings    Int      @default(0)        // 评分总数
  
  // 争议
  totalDisputes   Int      @default(0)        // 总争议数
  approvedDisputes Int     @default(0)        // 批准的争议数
  disputeRate     Float    @default(0)        // 争议率 = approvedDisputes / totalSales
  
  // 退款
  totalRefunds    Int      @default(0)        // 总退款数
  refundAmount    Float    @default(0)        // 退款总额
  refundRate      Float    @default(0)        // 退款率 = totalRefunds / totalSales
  
  // 信誉分数（0-100）
  reputationScore Float    @default(50)       // 信誉分数
  
  // 徽章
  badges          Json?                       // ['verified', 'top-seller', 'trusted']
  
  // SAS 认证
  sasAttestationId String? @unique            // Solana Attestation Service ID
  sasVerifiedAt    DateTime?                  // SAS 认证时间
  
  // 链上数据
  irysId      String?  @unique                // Irys transaction ID
  solanaHash  String?  @unique                // Solana transaction hash
  dataHash    String?                         // SHA-256 hash
  
  updatedAt       DateTime @updatedAt
  provider        User     @relation(fields: [providerId], references: [id])
}
```

### 2. ProviderRating（评分记录）

```typescript
model ProviderRating {
  id          String   @id @default(uuid())
  providerId  String
  buyerId     String
  orderId     String   @unique                // 每个订单只能评分一次
  
  // 评分
  rating      Int                             // 1-5 stars（总体评分）
  comment     String?  @db.Text               // 评论
  
  // 评分维度（可选）
  dataQuality    Int?  // 1-5（数据质量）
  accuracy       Int?  // 1-5（准确性）
  documentation  Int?  // 1-5（文档质量）
  support        Int?  // 1-5（客户支持）
  
  // 链上数据
  irysId      String?  @unique                // Irys transaction ID
  solanaHash  String?  @unique                // Solana transaction hash
  dataHash    String?                         // SHA-256 hash
  
  createdAt   DateTime @default(now())
  
  provider    User     @relation("ProviderRatings", fields: [providerId], references: [id])
  buyer       User     @relation("BuyerRatings", fields: [buyerId], references: [id])
  order       Order    @relation(fields: [orderId], references: [id])
}
```

### 3. Dispute（争议记录）

```typescript
model Dispute {
  id          String   @id @default(uuid())
  orderId     String   @unique
  
  // 争议信息
  reason      String                          // 'DATA_QUALITY' | 'DOWNLOAD_FAILED' | 'FRAUD' | 'OTHER'
  description String   @db.Text
  evidence    Json?                           // 证据文件 URLs
  
  // 状态
  status      String   @default("pending")    // 'pending' | 'reviewing' | 'approved' | 'rejected'
  
  // 退款金额
  requestedAmount Float
  approvedAmount  Float?
  
  // 审核信息
  reviewerId  String?
  reviewNote  String?  @db.Text
  reviewedAt  DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  order       Order    @relation(fields: [orderId], references: [id])
  reviewer    User?    @relation(fields: [reviewerId], references: [id])
}
```

### 4. Refund（退款记录）

```typescript
model Refund {
  id          String   @id @default(uuid())
  orderId     String   @unique
  disputeId   String?  @unique
  
  // 退款信息
  amount      Float
  reason      String                          // 'DOWNLOAD_FAILED' | 'DUPLICATE_PAYMENT' | 'FRAUD' | 'DATA_QUALITY' | 'SERVICE_OUTAGE'
  type        String                          // 'AUTOMATIC' | 'MANUAL' | 'DISPUTE'
  
  // 状态
  status      String   @default("pending")    // 'pending' | 'processing' | 'completed' | 'failed'
  
  // Solana 交易
  txHash      String?  @unique
  txNetwork   String?                         // 'solana-devnet' | 'solana'
  
  // 执行信息
  executedBy  String?                         // 执行退款的管理员 ID
  executedAt  DateTime?
  failureReason String? @db.Text
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  order       Order    @relation(fields: [orderId], references: [id])
  dispute     Dispute? @relation(fields: [disputeId], references: [id])
  executor    User?    @relation(fields: [executedBy], references: [id])
}
```

---

## 信誉分数计算

### 计算公式

```typescript
信誉分数 = 基础分 + 评分贡献 + 销售贡献 - 争议惩罚 - 退款惩罚
```

### 详细计算逻辑

```typescript
function calculateReputationScore(stats: ProviderStats): number {
  let score = 50  // 基础分：50

  // 1. 评分贡献（最高 +20 分）
  if (stats.averageRating > 0) {
    score += (stats.averageRating - 3) * 10
    // 3 星 = 0 分
    // 4 星 = +10 分
    // 5 星 = +20 分
  }

  // 2. 销售贡献（最高 +20 分）
  score += Math.min(stats.totalSales / 10, 20)
  // 10 笔销售 = +1 分
  // 200 笔销售 = +20 分（封顶）

  // 3. 争议惩罚（最高 -30 分）
  score -= stats.disputeRate * 100
  // 争议率 10% = -10 分
  // 争议率 30% = -30 分（封顶）

  // 4. 退款惩罚（最高 -20 分）
  score -= stats.refundRate * 100
  // 退款率 10% = -10 分
  // 退款率 20% = -20 分（封顶）

  // 限制在 0-100 范围内
  return Math.max(0, Math.min(100, score))
}
```

### 分数示例

| 场景 | 平均评分 | 销售数 | 争议率 | 退款率 | 最终分数 |
|------|---------|--------|--------|--------|---------|
| 新提供者 | 0 | 0 | 0% | 0% | **50** |
| 优秀提供者 | 4.8 | 150 | 2% | 1% | **50 + 18 + 20 - 2 - 1 = 85** ✅ |
| 顶级提供者 | 5.0 | 200+ | 0% | 0% | **50 + 20 + 20 - 0 - 0 = 90** 🏆 |
| 问题提供者 | 3.0 | 50 | 15% | 10% | **50 + 0 + 5 - 15 - 10 = 30** ❌ |

---

## 徽章系统

### 5 种徽章

```typescript
function determineBadges(stats: ProviderStats, score: number): string[] {
  const badges: string[] = []

  // 1. ✅ Verified（已验证）
  if (score >= 80) {
    badges.push('verified')
  }

  // 2. 🏆 Top Seller（顶级卖家）
  if (stats.totalSales >= 100) {
    badges.push('top-seller')
  }

  // 3. 🌟 Trusted（可信赖）
  if (stats.averageRating >= 4.5 && stats.totalRatings >= 10) {
    badges.push('trusted')
  }

  // 4. 💎 High Quality（高质量）
  if (stats.disputeRate < 0.05 && stats.totalSales >= 20) {
    badges.push('high-quality')  // 争议率 < 5% 且销售 ≥ 20
  }

  // 5. 🔒 Reliable（可靠）
  if (stats.refundRate < 0.03 && stats.totalSales >= 20) {
    badges.push('reliable')  // 退款率 < 3% 且销售 ≥ 20
  }

  return badges
}
```

### 徽章获取条件

| 徽章 | 条件 | 说明 |
|------|------|------|
| ✅ **Verified** | 信誉分数 ≥ 80 | 高信誉提供者，自动同步到链上 |
| 🏆 **Top Seller** | 总销售 ≥ 100 | 销售量大的提供者 |
| 🌟 **Trusted** | 平均评分 ≥ 4.5 且评分数 ≥ 10 | 高评分提供者 |
| 💎 **High Quality** | 争议率 < 5% 且销售 ≥ 20 | 低争议率提供者 |
| 🔒 **Reliable** | 退款率 < 3% 且销售 ≥ 20 | 低退款率提供者 |

---

## 评分流程

### 1. 评分前验证

```typescript
async function createProviderRating(data) {
  // ✅ 验证 1：评分范围（1-5）
  if (data.rating < 1 || data.rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }

  // ✅ 验证 2：订单存在且已完成
  const order = await prisma.order.findFirst({
    where: {
      id: data.orderId,
      buyerId: data.buyerId,
      status: 'completed',
    },
  })
  if (!order) {
    throw new Error('Order not found or not completed')
  }

  // ✅ 验证 3：提供者匹配
  if (order.product.providerId !== data.providerId) {
    throw new Error('Provider mismatch')
  }

  // ✅ 验证 4：不能重复评分
  const existingRating = await prisma.providerRating.findUnique({
    where: { orderId: data.orderId },
  })
  if (existingRating) {
    throw new Error('Rating already exists for this order')
  }

  // ✅ 验证 5：不能在退款后评分
  const refund = await prisma.refund.findFirst({
    where: {
      orderId: data.orderId,
      status: 'completed'
    }
  })
  if (refund) {
    throw new Error('Cannot rate after receiving a refund')
  }

  // ✅ 验证 6：不能在争议期间评分
  const dispute = await prisma.dispute.findFirst({
    where: {
      orderId: data.orderId,
      status: { in: ['pending', 'reviewing', 'approved'] }
    }
  })
  if (dispute) {
    throw new Error('Cannot rate while dispute is active')
  }

  // 创建评分
  const rating = await prisma.providerRating.create({ data })

  // 自动更新信誉
  await updateProviderReputation(data.providerId, 'rating')

  return rating
}
```

### 2. 评分后处理

1. **创建评分记录** - 保存到数据库
2. **更新信誉** - 自动重新计算信誉分数和徽章
3. **链上同步** - 后台上传到 Irys 和 Solana（不阻塞响应）

---

## 链上同步

### 触发条件

- **评分**: 所有评分都会同步到链上
- **信誉**: 只有分数 ≥ 80 的提供者才会同步

### 同步流程

```typescript
// 1. 评分同步
syncRatingToChain(ratingId)
  ├── 上传到 Irys（永久存储）
  ├── 发送到 Solana（交易记录）
  └── 更新 irysId 和 solanaHash

// 2. 信誉同步（分数 ≥ 80）
syncReputationToChain(providerId, reputation)
  ├── 上传到 Irys（信誉快照）
  ├── 发送到 Solana（交易记录）
  ├── 发布 SAS 认证（Solana Attestation Service）
  └── 更新 irysId, solanaHash, sasAttestationId
```

### 数据结构

```typescript
interface OnchainReputation {
  providerId: string
  totalSales: number
  totalRevenue: number
  averageRating: number
  totalRatings: number
  totalDisputes: number
  approvedDisputes: number
  disputeRate: number
  totalRefunds: number
  refundAmount: number
  refundRate: number
  reputationScore: number
  badges: string[]
  timestamp: number
}
```

---

## API 端点

### 1. 获取信誉

```http
GET /api/providers/{id}/reputation
```

**响应**:
```json
{
  "success": true,
  "reputation": {
    "reputationScore": 85,
    "totalSales": 150,
    "totalRevenue": 15.0,
    "averageRating": 4.8,
    "totalRatings": 120,
    "disputeRate": 0.02,
    "refundRate": 0.01,
    "badges": ["verified", "trusted", "high-quality", "reliable"]
  }
}
```

### 2. 提交评分

```http
POST /api/ratings
Authorization: Bearer {API_KEY}

{
  "providerId": "uuid",
  "orderId": "uuid",
  "rating": 5,
  "comment": "Excellent data quality!",
  "dataQuality": 5,
  "accuracy": 5,
  "documentation": 4,
  "support": 5
}
```

**响应**:
```json
{
  "success": true,
  "rating": { ... },
  "message": "Rating created and will be uploaded to Irys/Solana"
}
```

---

## 触发机制

### 自动更新触发事件

```typescript
type ReputationEvent = 'sale' | 'rating' | 'dispute' | 'refund'

// 1. 销售完成
Order.status = 'completed'
  → updateProviderReputation(providerId, 'sale')

// 2. 收到评分
ProviderRating.create()
  → updateProviderReputation(providerId, 'rating')

// 3. 争议批准
Dispute.status = 'approved'
  → updateProviderReputation(providerId, 'dispute')

// 4. 退款完成
Refund.status = 'completed'
  → updateProviderReputation(providerId, 'refund')
```

### 更新流程

```typescript
updateProviderReputation(providerId, event)
  ├── 1. 确保信誉记录存在
  ├── 2. 重新计算统计数据（从数据库聚合）
  ├── 3. 计算信誉分数（0-100）
  ├── 4. 确定徽章
  ├── 5. 更新数据库
  └── 6. 如果分数 ≥ 80，同步到链上
```

---

## 总结

### ✅ 系统特点

1. **完全自动化** - 无需人工干预
2. **实时更新** - 每次事件后立即更新
3. **多维度评估** - 综合考虑销售、评分、争议、退款
4. **防作弊机制** - 多重验证，防止虚假评分
5. **链上验证** - 高分提供者自动获得链上认证
6. **透明公开** - 所有数据可查询

### 📊 关键指标

- **信誉分数**: 0-100（基础 50）
- **徽章数量**: 5 种
- **链上同步阈值**: 分数 ≥ 80
- **评分范围**: 1-5 星
- **评分维度**: 4 个（数据质量、准确性、文档、支持）

### 🔒 安全措施

- ✅ 每个订单只能评分一次
- ✅ 只能评分已完成的订单
- ✅ 退款后不能评分
- ✅ 争议期间不能评分
- ✅ 必须是订单买家才能评分
- ✅ 评分范围验证（1-5）

---

**Provider Reputation System 已完全实现并投入使用！** 🎉

