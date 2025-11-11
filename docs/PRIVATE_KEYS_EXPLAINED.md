# 私钥配置说明

## 🔑 两种私钥的区别

DataNexus 集成了 x402 + EigenAI，需要配置**两种不同的私钥**：

---

## 1. Solana 私钥（必需）

### 用途
- ✅ **AI Agent 执行 x402 支付**（USDC 转账）
- ✅ 购买数据集
- ✅ 所有 Solana 链上操作

### 这是什么？
**你的 DataNexus DApp 的 Solana 钱包私钥**

**不是** TEE 派生的私钥！

### 配置位置
```bash
# .env.local
SOLANA_PRIVATE_KEY="your_solana_private_key_here"
```

### 格式支持
```bash
# 方式 1: Base58 格式（推荐）
SOLANA_PRIVATE_KEY="5Kd3NBU...your_base58_private_key_here...XgTRQ"

# 方式 2: JSON 数组格式
SOLANA_PRIVATE_KEY="[1,2,3,4,5,...]"
```

### 谁使用？
- Python SDK (`examples/python-sdk/x402_example.py`)
- Demo Agent (`examples/demo-agents/ai_analyst_agent.py`)
- 任何需要支付的 AI Agent

### 示例代码
```python
from python_sdk.x402_example import SimpleX402Client

# 从环境变量读取 Solana 私钥
client = SimpleX402Client(
    api_key="your-api-key",
    solana_private_key=os.getenv('SOLANA_PRIVATE_KEY')
)

# Agent 使用这个私钥执行 USDC 支付
client.download_dataset(dataset_id="...", auto_pay=True)
```

---

## 2. ETH 私钥（必需）

### 用途
- ✅ **仅用于 EigenAI 认证**（签名消息）
- ✅ 后端服务调用 EigenAI API
- ✅ **不需要 ETH**，只需要签名能力

### 这是什么？
**你的 EigenAI 认证钱包的 ETH 私钥**

这是你获得 1M 免费推理令牌赠款的钱包。

### 配置位置
```bash
# .env.local
ETH_PRIVATE_KEY="0x..."
ETH_ADDRESS="0x..."

# 签名后的认证信息
EIGENAI_ETH_ADDRESS="0x..."
EIGENAI_SIGNATURE="0x..."
EIGENAI_MESSAGE="Authenticate with EigenAI for DataNexus"
```

### 格式
```bash
# 必须是 0x 开头的十六进制格式
ETH_PRIVATE_KEY="0x..."
```

### 谁使用？
- DataNexus 后端服务
- EigenAI 客户端 (`lib/eigenai-client.ts`)
- **用户和 Agent 不需要知道这个私钥**

### 示例代码
```typescript
// lib/eigenai-client.ts
export class EigenAIClient {
  constructor() {
    // 从环境变量读取 ETH 私钥用于认证
    this.config = {
      ethAddress: process.env.EIGENAI_ETH_ADDRESS,
      signature: process.env.EIGENAI_SIGNATURE,
    };
  }
}
```

---

## 3. TEE 派生的 Solana 地址（自动）

### 这是什么？
EigenAI 的 TEE（Trusted Execution Environment）会从你的 ETH 助记词**自动派生**一个 Solana 地址。

### 用途
- ✅ 在 Solana 上生成验证证明
- ✅ 链上验证推理结果

### 你需要做什么？
**什么都不需要做！**

EigenAI 会自动处理这个过程：
1. 你提供 ETH 私钥用于认证
2. EigenAI TEE 内部从 ETH 助记词派生 Solana 地址
3. 使用这个地址在 Solana 上生成证明
4. 用户完全无感知

---

## 🏗️ 完整架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent (Python)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  使用：Solana 私钥 (SOLANA_PRIVATE_KEY)                      │
│  ├─ 搜索数据集                                                │
│  ├─ 执行 USDC 支付（x402）                                    │
│  └─ 请求 AI 分析                                              │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP Request
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              DataNexus 后端 (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  使用：ETH 私钥 (ETH_PRIVATE_KEY)                            │
│  ├─ 签名 EigenAI 认证消息                                     │
│  ├─ 调用 EigenAI API                                         │
│  └─ 获取可验证推理结果                                         │
│                                                              │
│  验证：Solana 支付                                            │
│  ├─ 检查 USDC 转账                                            │
│  └─ 验证交易签名                                              │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ EigenAI API Call
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    EigenAI (TEE)                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  自动派生：Solana 地址（从 ETH 助记词）                        │
│  ├─ 执行可验证推理                                            │
│  ├─ 生成 Solana 链上证明                                      │
│  └─ 返回验证结果                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 配置检查清单

### ✅ 必需配置

- [ ] **Solana 私钥** - 你的 DApp 钱包私钥
  ```bash
  SOLANA_PRIVATE_KEY="your_solana_private_key"
  ```

- [ ] **ETH 私钥** - EigenAI 认证钱包私钥
  ```bash
  ETH_PRIVATE_KEY="0x..."
  ETH_ADDRESS="0x..."
  ```

- [ ] **EigenAI 签名** - 认证签名（运行脚本生成）
  ```bash
  node scripts/sign-eigenai-message.js
  ```

### ⚠️ 常见错误

#### 错误 1: 混淆两种私钥
```bash
# ❌ 错误：使用 ETH 私钥作为 Solana 私钥
SOLANA_PRIVATE_KEY="0x6a1cdfb4...eth_private_key...df080d"

# ✅ 正确：使用 Solana 私钥
SOLANA_PRIVATE_KEY="5Kd3NBU...your_solana_private_key...XgTRQ"
```

#### 错误 2: 期待 TEE 派生的私钥
```bash
# ❌ 错误：等待 EigenAI 给你一个 Solana 私钥
# TEE 派生的地址是 EigenAI 内部使用的，你不需要管理

# ✅ 正确：使用你自己的 Solana 私钥
SOLANA_PRIVATE_KEY="your_existing_solana_key"
```

#### 错误 3: ETH 私钥格式错误
```bash
# ❌ 错误：没有 0x 前缀
ETH_PRIVATE_KEY="6a1cdfb4...your_eth_private_key...df080d"

# ✅ 正确：必须有 0x 前缀
ETH_PRIVATE_KEY="0x6a1cdfb4...your_eth_private_key...df080d"
```

---

## 🔐 安全建议

### 1. 永远不要提交私钥到 Git
```bash
# .gitignore 中已包含
.env.local
.env*.local
```

### 2. 使用环境变量
```bash
# 开发环境
export SOLANA_PRIVATE_KEY="..."
export ETH_PRIVATE_KEY="..."

# 生产环境
# 使用 Vercel/Railway 等平台的环境变量管理
```

### 3. 定期轮换私钥
- 开发环境使用测试钱包
- 生产环境使用独立的钱包
- 定期更换私钥

### 4. 最小权限原则
- Solana 钱包只存放必要的 USDC
- ETH 钱包不需要存放任何 ETH
- 使用专用钱包，不要混用个人钱包

---

## 🧪 测试配置

### 1. 测试 Solana 私钥
```bash
# 运行 Python SDK 测试
python examples/python-sdk/x402_example.py
```

### 2. 测试 ETH 私钥
```bash
# 重新生成签名
node scripts/sign-eigenai-message.js

# 应该输出：
# ✅ Signature generated successfully
# ✅ Signature verified successfully
```

### 3. 测试完整集成
```bash
# 运行集成测试
./examples/test-eigenai-integration.sh

# 运行 Demo Agent
python examples/demo-agents/ai_analyst_agent.py
```

---

## 📚 相关文档

- **快速开始**: `EIGENAI_QUICKSTART.md`
- **集成指南**: `docs/EIGENAI_INTEGRATION_GUIDE.md`
- **集成状态**: `docs/EIGENAI_INTEGRATION_STATUS.md`

---

## ❓ 常见问题

### Q1: 我需要在 Solana 钱包里存多少 USDC？
**A**: 取决于你要购买多少数据集。建议至少 10 USDC 用于测试。

### Q2: ETH 钱包需要有 ETH 吗？
**A**: **不需要！** ETH 私钥只用于签名认证，不需要任何 ETH。

### Q3: TEE 派生的 Solana 地址在哪里？
**A**: 你看不到也不需要管理它。EigenAI 在 TEE 内部自动处理。

### Q4: 可以使用同一个私钥吗？
**A**: **不可以！** Solana 私钥和 ETH 私钥是完全不同的格式和用途。

### Q5: 如何获取 Solana 私钥？
**A**: 
```bash
# 方式 1: 从 Phantom/Solflare 钱包导出
# 方式 2: 使用 Solana CLI 生成
solana-keygen new --outfile ~/.config/solana/id.json

# 方式 3: 使用 Python 生成
from solders.keypair import Keypair
keypair = Keypair()
print(str(keypair))  # Base58 格式
```

---

**总结**：
- ✅ **Solana 私钥** = 你的 DApp 钱包，用于支付
- ✅ **ETH 私钥** = EigenAI 认证，用于签名
- ✅ **TEE 派生地址** = EigenAI 自动处理，你不需要管

需要帮助？查看 `EIGENAI_QUICKSTART.md` 或运行测试脚本。

