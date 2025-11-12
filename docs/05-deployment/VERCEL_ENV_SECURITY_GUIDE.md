# Vercel 环境变量安全指南

## 🔒 环境变量安全性

### Vercel 环境变量是公开的吗？

**答案：不是公开的，但需要正确配置！**

| 类型 | 可见性 | 安全性 | 用途 |
|------|--------|--------|------|
| **服务器端变量** | ❌ 不公开 | ✅ 安全 | API 密钥、私钥、数据库密码 |
| **客户端变量** (`NEXT_PUBLIC_*`) | ⚠️ 公开 | ❌ 不安全 | 公开的配置（RPC URL、网络名称） |

---

## 📋 环境变量分类

### ✅ 安全的服务器端变量（不会暴露）

这些变量**只在服务器端运行**，不会发送到浏览器：

```bash
# 数据库
DATABASE_URL="..."                    # ✅ 安全
DIRECT_URL="..."                      # ✅ 安全

# Redis
KV_URL="..."                          # ✅ 安全
KV_REST_API_TOKEN="..."               # ✅ 安全

# 私钥（绝对不能暴露！）
SOLANA_PRIVATE_KEY="..."              # ✅ 安全（服务器端）
SOLANA_BUYER_PRIVATE_KEY="..."        # ✅ 安全（服务器端）
ETH_PRIVATE_KEY="..."                 # ✅ 安全（服务器端）
IRYS_PRIVATE_KEY="..."                # ✅ 安全（服务器端）
PLATFORM_WALLET_SECRET_KEY="..."      # ✅ 安全（服务器端）

# API 密钥
HELIUS_API_KEY="..."                  # ✅ 安全
DATANEXUS_API_KEY="..."               # ✅ 安全

# 加密密钥
JWT_SECRET="..."                      # ✅ 安全
API_KEY_SECRET="..."                  # ✅ 安全
MASTER_ENCRYPTION_KEY="..."           # ✅ 安全
```

### ⚠️ 公开的客户端变量（会暴露到浏览器）

这些变量以 `NEXT_PUBLIC_` 开头，**会被打包到客户端代码中**：

```bash
# 这些会暴露到浏览器，所以不要放敏感信息！
NEXT_PUBLIC_SOLANA_NETWORK="devnet"           # ⚠️ 公开（但无害）
NEXT_PUBLIC_SOLANA_RPC_URL="https://..."      # ⚠️ 公开（但无害）
NEXT_PUBLIC_APP_URL="https://..."             # ⚠️ 公开（但无害）
NEXT_PUBLIC_APP_NAME="DataNexus"              # ⚠️ 公开（但无害）
```

---

## 🛡️ Vercel 环境变量的安全机制

### 1. 服务器端变量保护

```
用户浏览器 → Vercel Edge → Next.js 服务器 → 环境变量
                ❌ 不可见      ✅ 可见
```

- ✅ 服务器端变量**永远不会**发送到浏览器
- ✅ 只在 Vercel 的服务器上运行
- ✅ 通过 HTTPS 加密传输
- ✅ 存储在 Vercel 的加密数据库中

### 2. 访问控制

| 谁可以看到环境变量？ | 权限 |
|---------------------|------|
| **项目所有者** | ✅ 可以查看和编辑 |
| **团队成员（Admin）** | ✅ 可以查看和编辑 |
| **团队成员（Developer）** | ⚠️ 可以查看（取决于设置） |
| **公众/访客** | ❌ 完全不可见 |
| **浏览器用户** | ❌ 只能看到 `NEXT_PUBLIC_*` |

### 3. 环境隔离

Vercel 支持三种环境，可以为每个环境设置不同的变量：

```
Production  → 生产环境（主域名）
Preview     → 预览环境（PR 部署）
Development → 开发环境（本地）
```

---

## 🚨 潜在的安全风险

### ❌ 错误做法

```bash
# 错误：将私钥设置为 NEXT_PUBLIC_
NEXT_PUBLIC_PRIVATE_KEY="..."  # ❌ 危险！会暴露到浏览器！

# 错误：在客户端组件中使用私钥
'use client'
const privateKey = process.env.SOLANA_PRIVATE_KEY  # ❌ 会报错或暴露
```

### ✅ 正确做法

```bash
# 正确：私钥不使用 NEXT_PUBLIC_ 前缀
SOLANA_PRIVATE_KEY="..."  # ✅ 安全，只在服务器端

# 正确：在服务器端 API 路由中使用
// app/api/payment/route.ts
export async function POST(request: Request) {
  const privateKey = process.env.SOLANA_PRIVATE_KEY  // ✅ 安全
  // ...
}
```

---

## 📝 DataNexus 环境变量配置清单

### 必需的环境变量（Vercel Dashboard 中设置）

#### 1. 数据库（Prisma）
```bash
DATABASE_URL="prisma+postgres://..."
DIRECT_URL="postgres://..."
```

#### 2. Redis（Upstash）
```bash
KV_URL="rediss://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."
REDIS_URL="rediss://..."
```

#### 3. Solana 私钥（⚠️ 敏感！）
```bash
SOLANA_PRIVATE_KEY="..."              # Provider 账户私钥
SOLANA_BUYER_PRIVATE_KEY="..."        # Buyer 账户私钥
SOLANA_SERVER_PRIVATE_KEY="..."       # 服务器账户私钥
PLATFORM_PRIVATE_KEY="..."            # 平台账户私钥
PLATFORM_WALLET_SECRET_KEY="[...]"    # 平台钱包密钥数组
```

#### 4. Solana 公开配置
```bash
NEXT_PUBLIC_SOLANA_NETWORK="devnet"
NEXT_PUBLIC_SOLANA_RPC_URL="https://devnet.helius-rpc.com/?api-key=..."
NEXT_PUBLIC_SOLANA_RPC="https://devnet.helius-rpc.com/?api-key=..."
SOLANA_RPC_URL="https://api.devnet.solana.com"
```

#### 5. Irys（永久存储）
```bash
IRYS_NETWORK="devnet"
IRYS_TOKEN="solana"
IRYS_PRIVATE_KEY="..."                # ⚠️ 敏感！
```

#### 6. Helius API
```bash
HELIUS_API_KEY="..."
```

#### 7. x402 支付协议
```bash
FACILITATOR_URL="https://facilitator.payai.network"
X402_NETWORK="solana-devnet"
PAYMENT_WALLET_ADDRESS="..."         # 公钥地址（安全）
```

#### 8. EigenAI
```bash
ETH_PRIVATE_KEY="..."                 # ⚠️ 敏感！
ETH_ADDRESS="..."                     # 公钥地址（安全）
EIGENAI_API_URL="https://determinal-api.eigenarcade.com"
EIGENAI_USE_MOCK="false"
```

#### 9. 认证和加密
```bash
JWT_SECRET="..."                      # ⚠️ 敏感！
API_KEY_SECRET="..."                  # ⚠️ 敏感！
MASTER_ENCRYPTION_KEY="..."           # ⚠️ 敏感！
```

#### 10. 应用配置
```bash
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_APP_NAME="DataNexus"
```

#### 11. 其他
```bash
DATANEXUS_API_KEY="..."
PLATFORM_WALLET="..."                 # 公钥地址（安全）
PLATFORM_WALLET_PUBLIC_KEY="..."      # 公钥地址（安全）
```

---

## 🔐 最佳实践

### 1. 使用 Vercel Dashboard 设置环境变量

```bash
# 不要在代码中硬编码
❌ const apiKey = "sk_live_123456"

# 使用环境变量
✅ const apiKey = process.env.API_KEY
```

### 2. 为不同环境设置不同的值

```
Production:  使用真实的 API 密钥和主网配置
Preview:     使用测试 API 密钥和测试网配置
Development: 使用本地 .env.local 文件
```

### 3. 定期轮换敏感密钥

```bash
# 定期更新这些密钥
- JWT_SECRET
- API_KEY_SECRET
- MASTER_ENCRYPTION_KEY
- 私钥（如果可能）
```

### 4. 使用 Vercel 的环境变量加密

Vercel 会自动加密存储所有环境变量，但你仍需要：
- ✅ 限制团队成员访问权限
- ✅ 启用 2FA（双因素认证）
- ✅ 定期审计访问日志

---

## 🚀 部署步骤

### 1. 在 Vercel Dashboard 中设置环境变量

1. 登录 Vercel Dashboard
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 逐个添加上面列出的环境变量
5. 为每个变量选择环境：
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### 2. 验证环境变量

```bash
# 部署后，在 Vercel 的 Functions 日志中检查
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
console.log('SOLANA_PRIVATE_KEY exists:', !!process.env.SOLANA_PRIVATE_KEY)
# 不要打印实际的值！
```

### 3. 测试部署

```bash
# 本地测试
npm run build
npm run start

# 部署到 Vercel
vercel --prod
```

---

## ⚠️ 安全检查清单

在部署前，确保：

- [ ] 所有私钥都**没有** `NEXT_PUBLIC_` 前缀
- [ ] `.env.local` 文件在 `.gitignore` 中
- [ ] 所有敏感变量都在 Vercel Dashboard 中设置
- [ ] 生产环境使用不同于开发环境的密钥
- [ ] 启用了 Vercel 项目的访问控制
- [ ] 团队成员权限设置正确
- [ ] 定期备份环境变量配置

---

## 📞 如果密钥泄露了怎么办？

### 立即行动：

1. **撤销泄露的密钥**
   - Solana: 转移资金到新钱包
   - API 密钥: 在服务商处撤销
   - JWT Secret: 生成新的并更新

2. **更新 Vercel 环境变量**
   - 用新密钥替换旧密钥
   - 重新部署应用

3. **审计访问日志**
   - 检查是否有未授权访问
   - 查看 Vercel 部署日志

4. **通知用户（如果需要）**
   - 如果用户数据可能受影响
   - 建议用户更改密码

---

## 总结

✅ **Vercel 环境变量是安全的**，只要你：
1. 不使用 `NEXT_PUBLIC_` 前缀存储敏感信息
2. 在 Vercel Dashboard 中正确设置
3. 遵循最佳安全实践
4. 定期审计和轮换密钥

❌ **不安全的情况**：
1. 将私钥设置为 `NEXT_PUBLIC_*`
2. 在客户端代码中硬编码密钥
3. 将 `.env.local` 提交到 Git
4. 与不信任的人共享 Vercel 项目访问权限

