# DataNexus - 产品需求文档 (PRD)

## 1. 项目概述

### 1.1 项目愿景
构建首个专为 AI Agent 设计的去中心化数据交易市场，让数据提供者和 AI Agent 能够自主、安全、高效地交易数据。

### 1.2 核心价值主张
- **永久存储**: 基于 Irys 的去中心化永久存储
- **微支付友好**: 集成 x402 支付协议，支持小额高频交易
- **高性能**: 基于 Solana 区块链，低延迟、低成本
- **Agent 优先**: API-first 设计，支持 AI Agent 自主交易

### 1.3 目标用户
- **数据提供者**: 数据分析师、API 服务商、Web3 数据公司
- **数据消费者**: AI Agent 开发者、量化团队、研究机构
- **AI Agent**: 自主运行的智能代理

---

## 2. 功能需求

### 2.1 MVP 核心功能（Phase 1 - Hackathon）

#### 2.1.1 用户认证与钱包管理
- [ ] 连接 Solana 钱包（Phantom、Solflare）
- [ ] 钱包地址作为用户身份
- [ ] 生成 API Key（供 Agent 使用）
- [ ] API Key 权限管理

#### 2.1.2 数据产品上架
- [ ] 上传数据到 Irys
  - 支持文件上传（CSV、JSON、Parquet）
  - 支持 API 端点注册
  - 获得 Irys 存储 URL
- [ ] 创建数据产品
  - 产品名称、描述
  - 分类标签（DeFi、NFT、Social、AI 等）
  - 定价模式（一次性购买/订阅）
  - 价格设置（USDC）
  - 数据预览（前 10 行/示例）
- [ ] 访问控制
  - 加密数据存储
  - 购买后提供解密密钥
- [ ] 产品状态管理
  - 上架/下架
  - 编辑产品信息

#### 2.1.3 数据产品浏览与搜索
- [ ] 数据产品列表
  - 分页显示
  - 按时间/价格/热度排序
- [ ] 搜索功能
  - 关键词搜索
  - 分类筛选
  - 价格区间筛选
- [ ] 产品详情页
  - 完整描述
  - 数据预览
  - 提供者信息
  - 购买次数
  - 评分（Phase 2）

#### 2.1.4 购买与支付
- [ ] x402 支付集成
  - 连接 x402 钱包
  - 发起支付请求
  - 支付确认
- [ ] 购买流程
  - 选择数据产品
  - 确认价格
  - x402 支付
  - 获得访问权限
- [ ] 订单管理
  - 购买历史
  - 订单状态
  - 下载/访问数据

#### 2.1.5 数据访问
- [ ] 一次性购买
  - 支付后立即下载
  - 永久访问权限
- [ ] 订阅模式
  - 按月/年订阅
  - 自动续费（可选）
  - 订阅期内无限访问
- [ ] 访问控制
  - 验证购买凭证
  - 提供解密密钥
  - 生成临时访问 URL

#### 2.1.6 Agent API
- [ ] RESTful API
  - `GET /api/products` - 搜索数据产品
  - `GET /api/products/:id` - 获取产品详情
  - `POST /api/purchase` - 购买数据产品
  - `GET /api/download/:orderId` - 下载数据
- [ ] API 认证
  - API Key 认证
  - Rate limiting
- [ ] API 文档
  - OpenAPI/Swagger 文档
  - 示例代码（Python、JavaScript）

#### 2.1.7 用户仪表板
- [ ] 数据提供者仪表板
  - 我的数据产品
  - 销售统计
  - 收益概览
  - 提现功能
- [ ] 数据消费者仪表板
  - 购买历史
  - 我的订阅
  - API Key 管理
  - 使用统计

---

### 2.2 增强功能（Phase 2 - Post-Hackathon）

#### 2.2.1 评价与信誉系统
- [ ] 产品评分（1-5 星）
- [ ] 购买者评论
- [ ] 提供者信誉分
- [ ] 数据质量徽章

#### 2.2.2 智能推荐
- [ ] 基于购买历史推荐
- [ ] 相似产品推荐
- [ ] 热门产品榜单

#### 2.2.3 高级定价
- [ ] 动态定价
- [ ] 批量购买折扣
- [ ] 推荐奖励
- [ ] 数据拍卖

#### 2.2.4 数据质量验证
- [ ] 数据格式验证
- [ ] 数据完整性检查
- [ ] 社区举报机制
- [ ] 退款机制

#### 2.2.5 Agent 自动化
- [ ] Agent 自动购买规则
- [ ] 预算管理
- [ ] 自动续订
- [ ] 使用量监控

---

## 3. 非功能需求

### 3.1 性能要求
- 页面加载时间 < 2 秒
- API 响应时间 < 500ms
- 支持 1000+ 并发用户
- 数据上传速度 > 1MB/s

### 3.2 安全要求
- 数据加密存储（AES-256）
- HTTPS 通信
- API Key 安全存储
- 防止 DDoS 攻击
- 智能合约审计

### 3.3 可用性要求
- 系统可用性 > 99%
- 自动备份
- 错误监控与告警
- 灾难恢复计划

### 3.4 可扩展性
- 支持多种数据类型
- 支持多种支付方式（未来）
- 支持多链（未来）
- 插件化架构

---

## 4. 数据模型

### 4.1 核心实体

#### User（用户）
```typescript
interface User {
  id: string;              // UUID
  walletAddress: string;   // Solana 钱包地址
  role: 'provider' | 'consumer' | 'both';
  apiKeys: ApiKey[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### DataProduct（数据产品）
```typescript
interface DataProduct {
  id: string;              // UUID
  providerId: string;      // 提供者 ID
  name: string;
  description: string;
  category: string[];      // ['DeFi', 'NFT', ...]
  dataType: 'file' | 'api' | 'stream';
  pricingModel: 'one-time' | 'subscription';
  price: number;           // USDC
  currency: 'USDC';
  irysUrl: string;         // Irys 存储 URL
  encryptionKey?: string;  // 加密密钥（加密存储）
  previewData?: any;       // 预览数据
  metadata: {
    fileSize?: number;
    format?: string;
    updateFrequency?: string;
    sampleSize?: number;
  };
  stats: {
    views: number;
    purchases: number;
    revenue: number;
  };
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
```

#### Order（订单）
```typescript
interface Order {
  id: string;              // UUID
  productId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: 'USDC';
  paymentMethod: 'x402';
  transactionHash: string; // Solana tx hash
  status: 'pending' | 'completed' | 'failed';
  accessToken?: string;    // 访问令牌
  expiresAt?: Date;        // 订阅过期时间
  createdAt: Date;
}
```

#### ApiKey
```typescript
interface ApiKey {
  id: string;
  userId: string;
  key: string;             // 哈希存储
  name: string;
  permissions: string[];
  lastUsedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}
```

---

## 5. 技术约束

### 5.1 必须使用的技术
- **区块链**: Solana (Devnet/Mainnet)
- **存储**: Irys
- **支付**: x402 Protocol
- **钱包**: Solana Wallet Adapter

### 5.2 推荐技术栈
- **前端**: Next.js 14 + TypeScript + TailwindCSS
- **后端**: Node.js + Express/Fastify
- **智能合约**: Anchor Framework (Rust)
- **数据库**: PostgreSQL + Redis
- **API 文档**: Swagger/OpenAPI

---

## 6. 用户界面要求

### 6.1 页面结构
```
/ (首页)
├── /marketplace (数据市场)
├── /product/:id (产品详情)
├── /dashboard (用户仪表板)
│   ├── /dashboard/provider (提供者视图)
│   └── /dashboard/consumer (消费者视图)
├── /upload (上架数据)
├── /docs (API 文档)
└── /about (关于我们)
```

### 6.2 设计原则
- 简洁现代的 UI
- 响应式设计（移动端友好）
- 深色模式支持
- 清晰的数据可视化
- 快速的交互反馈

---

## 7. 成功指标（Hackathon）

### 7.1 功能完成度
- [ ] 完成 MVP 所有核心功能
- [ ] 智能合约部署到 Devnet
- [ ] 前端可访问的 Demo

### 7.2 演示数据
- [ ] 至少 10 个数据产品上架
- [ ] 至少 5 笔真实交易
- [ ] 至少 1 个 Agent 自动交易演示

### 7.3 文档完整性
- [ ] README 文档
- [ ] API 文档
- [ ] 部署文档
- [ ] 演示视频（3 分钟）

---

## 8. 风险与挑战

### 8.1 技术风险
- Irys 集成复杂度
- x402 支付稳定性
- 数据加密性能
- 智能合约安全性

### 8.2 产品风险
- 种子数据获取困难
- 用户教育成本高
- 竞品压力

### 8.3 缓解措施
- 提前技术验证
- 简化 MVP 功能
- 利用 Irys team 资源
- 专注 Hackathon 演示效果

