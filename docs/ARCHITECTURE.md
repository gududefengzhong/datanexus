# DataNexus - 技术架构设计

## 1. 系统架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Web App  │  │  Agent   │  │  Mobile  │  │   CLI    │   │
│  │ (Next.js)│  │   SDK    │  │   App    │  │   Tool   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API 网关层                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Next.js API Routes / Express Server               │    │
│  │  - 认证中间件 (JWT/API Key)                         │    │
│  │  - Rate Limiting                                    │    │
│  │  - 请求验证                                          │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      业务逻辑层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Product │  │  Order   │  │   User   │  │  Payment │   │
│  │  Service │  │  Service │  │  Service │  │  Service │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据层                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │PostgreSQL│  │  Redis   │  │  Solana  │                  │
│  │  (主库)  │  │  (缓存)  │  │ (Program)│                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    外部服务层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │   Irys   │  │   x402   │  │  Helius  │                  │
│  │ (存储)   │  │ (支付)   │  │  (RPC)   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 技术栈选型

### 2.1 前端技术栈

```typescript
// 核心框架
- Next.js 14 (App Router)
- React 18
- TypeScript 5

// UI 框架
- TailwindCSS 3
- shadcn/ui (组件库)
- Radix UI (无障碍组件)

// 状态管理
- Zustand (轻量级状态管理)
- TanStack Query (服务端状态)

// Web3 集成
- @solana/web3.js
- @solana/wallet-adapter-react
- @irys/sdk

// 表单处理
- React Hook Form
- Zod (验证)

// 数据可视化
- Recharts
- D3.js (可选)
```

### 2.2 后端技术栈

```typescript
// 运行时
- Node.js 20 LTS
- TypeScript 5

// Web 框架
- Next.js API Routes (优先)
- Express.js (备选)

// 数据库
- PostgreSQL 15 (主数据库)
- Prisma ORM
- Redis 7 (缓存/队列)

// 认证
- JWT (JSON Web Tokens)
- bcrypt (密码哈希)

// 文件处理
- Multer (文件上传)
- Sharp (图片处理)

// 任务队列
- BullMQ (基于 Redis)

// 监控
- Sentry (错误追踪)
- Prometheus + Grafana (可选)
```

### 2.3 区块链技术栈

```rust
// Solana 程序
- Anchor Framework 0.29
- Rust 1.75

// 客户端
- @solana/web3.js
- @coral-xyz/anchor

// RPC 服务
- Helius (推荐)
- QuickNode (备选)
```

### 2.4 存储与支付

```typescript
// 去中心化存储
- Irys SDK (@irys/sdk)

// 支付协议
- x402 SDK (待确认具体包名)

// 加密
- crypto (Node.js 内置)
- tweetnacl (Solana 密钥对)
```

---

## 3. 数据库设计

### 3.1 PostgreSQL Schema

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'consumer',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API Key 表
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  permissions JSONB DEFAULT '[]',
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- 数据产品表
CREATE TABLE data_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50)[] NOT NULL,
  data_type VARCHAR(20) NOT NULL, -- 'file', 'api', 'stream'
  pricing_model VARCHAR(20) NOT NULL, -- 'one-time', 'subscription'
  price DECIMAL(18, 6) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USDC',
  irys_tx_id VARCHAR(100) NOT NULL,
  encryption_key_encrypted TEXT,
  preview_data JSONB,
  metadata JSONB,
  views INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue DECIMAL(18, 6) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 订单表
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES data_products(id),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  amount DECIMAL(18, 6) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USDC',
  payment_method VARCHAR(20) DEFAULT 'x402',
  transaction_hash VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  access_token VARCHAR(255),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_products_provider ON data_products(provider_id);
CREATE INDEX idx_products_category ON data_products USING GIN(category);
CREATE INDEX idx_products_status ON data_products(status);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### 3.2 Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  walletAddress String   @unique @map("wallet_address")
  role          String   @default("consumer")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  apiKeys       ApiKey[]
  providedProducts DataProduct[] @relation("Provider")
  orders        Order[]         @relation("Buyer")
  sales         Order[]         @relation("Seller")

  @@map("users")
}

model ApiKey {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  keyHash     String    @map("key_hash")
  name        String
  permissions Json      @default("[]")
  lastUsedAt  DateTime? @map("last_used_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  expiresAt   DateTime? @map("expires_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("api_keys")
}

model DataProduct {
  id                    String   @id @default(uuid())
  providerId            String   @map("provider_id")
  name                  String
  description           String
  category              String[]
  dataType              String   @map("data_type")
  pricingModel          String   @map("pricing_model")
  price                 Decimal  @db.Decimal(18, 6)
  currency              String   @default("USDC")
  irysTxId              String   @map("irys_tx_id")
  encryptionKeyEncrypted String? @map("encryption_key_encrypted")
  previewData           Json?    @map("preview_data")
  metadata              Json?
  views                 Int      @default(0)
  purchases             Int      @default(0)
  revenue               Decimal  @default(0) @db.Decimal(18, 6)
  status                String   @default("active")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  provider User    @relation("Provider", fields: [providerId], references: [id], onDelete: Cascade)
  orders   Order[]

  @@map("data_products")
}

model Order {
  id              String    @id @default(uuid())
  productId       String    @map("product_id")
  buyerId         String    @map("buyer_id")
  sellerId        String    @map("seller_id")
  amount          Decimal   @db.Decimal(18, 6)
  currency        String    @default("USDC")
  paymentMethod   String    @default("x402") @map("payment_method")
  transactionHash String?   @map("transaction_hash")
  status          String    @default("pending")
  accessToken     String?   @map("access_token")
  expiresAt       DateTime? @map("expires_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  completedAt     DateTime? @map("completed_at")

  product DataProduct @relation(fields: [productId], references: [id])
  buyer   User        @relation("Buyer", fields: [buyerId], references: [id])
  seller  User        @relation("Seller", fields: [sellerId], references: [id])

  @@map("orders")
}
```

---

## 4. Solana 程序设计

### 4.1 程序结构

```rust
// programs/datanexus/src/lib.rs
use anchor_lang::prelude::*;

declare_id!("DataNexus111111111111111111111111111111111");

#[program]
pub mod datanexus {
    use super::*;

    // 创建数据产品
    pub fn create_product(
        ctx: Context<CreateProduct>,
        product_id: String,
        price: u64,
        irys_tx_id: String,
    ) -> Result<()> {
        // 实现逻辑
        Ok(())
    }

    // 购买数据产品
    pub fn purchase_product(
        ctx: Context<PurchaseProduct>,
        product_id: String,
    ) -> Result<()> {
        // 实现逻辑
        Ok(())
    }

    // 提现收益
    pub fn withdraw_earnings(
        ctx: Context<WithdrawEarnings>,
    ) -> Result<()> {
        // 实现逻辑
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateProduct<'info> {
    #[account(init, payer = provider, space = 8 + 200)]
    pub product: Account<'info, Product>,
    #[account(mut)]
    pub provider: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Product {
    pub provider: Pubkey,
    pub product_id: String,
    pub price: u64,
    pub irys_tx_id: String,
    pub total_sales: u64,
    pub is_active: bool,
}
```

---

## 5. API 设计

### 5.1 RESTful API 端点

```typescript
// 认证
POST   /api/auth/connect          // 连接钱包
POST   /api/auth/disconnect       // 断开连接
POST   /api/auth/api-keys         // 创建 API Key
DELETE /api/auth/api-keys/:id     // 删除 API Key

// 数据产品
GET    /api/products              // 获取产品列表
GET    /api/products/:id          // 获取产品详情
POST   /api/products              // 创建产品
PATCH  /api/products/:id          // 更新产品
DELETE /api/products/:id          // 删除产品
GET    /api/products/:id/preview  // 获取预览数据

// 订单
POST   /api/orders                // 创建订单
GET    /api/orders                // 获取订单列表
GET    /api/orders/:id            // 获取订单详情
POST   /api/orders/:id/confirm    // 确认支付

// 数据访问
GET    /api/download/:orderId     // 下载数据
GET    /api/access/:orderId       // 获取访问令牌

// 用户
GET    /api/users/me              // 获取当前用户
GET    /api/users/me/stats        // 获取统计数据
PATCH  /api/users/me              // 更新用户信息

// Irys
POST   /api/irys/upload           // 上传到 Irys
GET    /api/irys/price            // 获取存储价格

// 搜索
GET    /api/search                // 搜索产品
```

### 5.2 API 响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req_123"
  }
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req_123"
  }
}

// 分页响应
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 6. 数据流程

### 6.1 上架数据产品流程

```
1. 用户上传文件
   ↓
2. 前端加密数据 (AES-256)
   ↓
3. 上传加密数据到 Irys
   ↓
4. 获得 Irys Transaction ID
   ↓
5. 创建产品记录 (PostgreSQL)
   ↓
6. 加密密钥存储 (加密后存储)
   ↓
7. 可选: 在 Solana 链上记录
   ↓
8. 返回产品 ID
```

### 6.2 购买数据流程

```
1. 用户选择产品
   ↓
2. 创建订单 (pending 状态)
   ↓
3. 调用 x402 支付
   ↓
4. 等待支付确认
   ↓
5. 支付成功 → 更新订单状态 (completed)
   ↓
6. 生成访问令牌
   ↓
7. 返回访问令牌给用户
   ↓
8. 用户使用令牌下载数据
```

### 6.3 下载数据流程

```
1. 用户提供访问令牌
   ↓
2. 验证令牌有效性
   ↓
3. 从数据库获取加密密钥
   ↓
4. 从 Irys 下载加密数据
   ↓
5. 使用密钥解密数据
   ↓
6. 返回解密后的数据
```

---

## 7. 部署架构

### 7.1 开发环境

```yaml
Frontend: localhost:3000 (Next.js Dev Server)
Backend: localhost:3000/api (Next.js API Routes)
Database: localhost:5432 (PostgreSQL)
Redis: localhost:6379
Solana: Devnet
Irys: Devnet
```

### 7.2 生产环境 (推荐 Vercel)

```yaml
Frontend: Vercel Edge Network
Backend: Vercel Serverless Functions
Database: Supabase / Neon (PostgreSQL)
Redis: Upstash Redis
Solana: Mainnet-beta
Irys: Mainnet
CDN: Vercel Edge / Cloudflare
```

---

## 8. 安全考虑

### 8.1 数据加密

- 使用 AES-256-GCM 加密数据
- 加密密钥使用用户钱包签名派生
- 密钥在数据库中加密存储

### 8.2 API 安全

- JWT 认证 (短期有效)
- API Key 认证 (长期有效)
- Rate Limiting (100 req/min)
- CORS 配置
- Input 验证 (Zod)

### 8.3 智能合约安全

- Anchor 框架内置检查
- 访问控制 (只有 owner 可操作)
- 重入攻击防护
- 整数溢出防护

---

## 9. 性能优化

### 9.1 缓存策略

```typescript
// Redis 缓存
- 产品列表: 5 分钟
- 产品详情: 10 分钟
- 用户信息: 30 分钟
- 搜索结果: 2 分钟

// CDN 缓存
- 静态资源: 1 年
- API 响应: 不缓存
- 预览数据: 1 小时
```

### 9.2 数据库优化

- 索引优化
- 查询优化 (避免 N+1)
- 连接池配置
- 读写分离 (可选)

---

## 10. 监控与日志

```typescript
// 错误追踪
- Sentry (前端 + 后端)

// 日志
- Winston / Pino (结构化日志)
- 日志级别: error, warn, info, debug

// 性能监控
- Vercel Analytics
- Web Vitals

// 业务指标
- 产品上架数
- 交易笔数
- 交易金额
- 活跃用户数
```

这个架构设计为 MVP 提供了坚实的基础，同时保留了未来扩展的空间！
