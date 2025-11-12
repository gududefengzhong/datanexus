# x402 集成实施指南

## 📋 概述

本文档详细说明如何在 DataNexus 中集成 x402 协议，实现 AI Agent 自主支付功能。

## 🎯 目标

实现完整的 x402 支付流程：
1. **服务端**：当 Agent 请求付费资源时，返回 HTTP 402 状态码和支付信息
2. **客户端**：Agent 自动检测 402 响应，完成支付，重新请求资源
3. **验证**：服务端验证支付凭证，返回资源

## 🔍 x402 协议研究总结

### PayAI Facilitator 信息

- **Facilitator URL**: `https://facilitator.payai.network`
- **支持的网络**: 
  - `solana` (Solana Mainnet)
  - `solana-devnet` (Solana Devnet)
- **可用端点**:
  - `/verify` - 验证支付
  - `/settle` - 结算支付
  - `/list` - 列出支持的网络

### x402 工作流程

```
1. Agent 请求付费资源
   ↓
2. 服务器返回 402 Payment Required
   Headers:
   - x-payment-amount: "0.001"
   - x-payment-currency: "USDC"
   - x-payment-recipient: "商家钱包地址"
   - x-payment-facilitator: "https://facilitator.payai.network"
   - x-payment-network: "solana-devnet"
   ↓
3. Agent 自动发起支付
   - 使用私钥签名交易
   - 通过 Facilitator 提交支付
   ↓
4. Agent 重新请求资源
   Headers:
   - x-payment-token: "支付凭证"
   ↓
5. 服务器验证支付凭证
   - 调用 Facilitator /verify 端点
   - 验证通过后返回资源
```

## 📦 技术栈

### 服务端 (Next.js)
- **包**: `x402-express` (虽然名字是 express，但可以用于 Next.js API Routes)
- **功能**: 提供 payment middleware，处理 402 响应

### 客户端 (Python)
- **包**: `x402-python` 或手动实现
- **功能**: 自动检测 402，发起支付，重试请求

## 🚀 实施步骤

### 步骤 1: 安装依赖

```bash
# 服务端
npm install x402-express

# 可能需要的额外依赖
npm install @solana/web3.js @solana/spl-token
```

### 步骤 2: 配置环境变量

在 `.env.local` 中添加：

```env
# x402 配置
FACILITATOR_URL=https://facilitator.payai.network
X402_NETWORK=solana-devnet  # 或 solana (主网)
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU  # Circle 官方 USDC (Devnet)
# 注意：支付接收地址存储在数据库中（User.walletAddress），每个提供者有自己的钱包地址

# Solana 配置
SOLANA_RPC_URL=https://api.devnet.solana.com  # Devnet
# SOLANA_RPC_URL=https://api.mainnet-beta.solana.com  # Mainnet
```

### 步骤 3: 创建 x402 中间件

创建 `lib/x402-middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

interface PaymentConfig {
  price: string // 例如 "0.001" (USDC)
  network: string // "solana-devnet" 或 "solana"
  recipient: string // 商家钱包地址
  facilitatorUrl: string
}

export function requirePayment(config: PaymentConfig) {
  return async (request: NextRequest, handler: () => Promise<NextResponse>) => {
    // 检查是否有支付凭证
    const paymentToken = request.headers.get('x-payment-token')
    
    if (!paymentToken) {
      // 返回 402 Payment Required
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: 'PAYMENT_REQUIRED',
            message: 'Payment required to access this resource',
          },
        }),
        {
          status: 402,
          headers: {
            'Content-Type': 'application/json',
            'x-payment-amount': config.price,
            'x-payment-currency': 'USDC',
            'x-payment-recipient': config.recipient,
            'x-payment-facilitator': config.facilitatorUrl,
            'x-payment-network': config.network,
          },
        }
      )
    }

    // 验证支付凭证
    const isValid = await verifyPaymentToken(paymentToken, config)
    
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PAYMENT',
            message: 'Invalid payment token',
          },
        },
        { status: 402 }
      )
    }

    // 支付验证通过，执行原始处理器
    return handler()
  }
}

async function verifyPaymentToken(
  token: string,
  config: PaymentConfig
): Promise<boolean> {
  try {
    const response = await fetch(`${config.facilitatorUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        network: config.network,
        recipient: config.recipient,
        amount: config.price,
      }),
    })

    const result = await response.json()
    return result.valid === true
  } catch (error) {
    console.error('Payment verification error:', error)
    return false
  }
}
```

### 步骤 4: 更新 Agent API 端点

修改 `app/api/agent/datasets/[id]/download/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requirePayment } from '@/lib/x402-middleware'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. 验证 API Key
  const apiKeyHeader = request.headers.get('authorization')
  if (!apiKeyHeader || !apiKeyHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'API key required' } },
      { status: 401 }
    )
  }

  const apiKey = apiKeyHeader.substring(7)
  const user = await verifyApiKey(apiKey)
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    )
  }

  // 2. 获取数据集信息
  const dataset = await prisma.product.findUnique({
    where: { id: params.id },
    select: { price: true, userId: true },
  })

  if (!dataset) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Dataset not found' } },
      { status: 404 }
    )
  }

  // 3. 检查是否已购买
  const existingOrder = await prisma.order.findFirst({
    where: {
      productId: params.id,
      buyerId: user.id,
      status: 'COMPLETED',
    },
  })

  if (existingOrder) {
    // 已购买，直接返回下载链接
    return handleDownload(params.id, user.id)
  }

  // 4. 需要支付 - 使用 x402 中间件
  const paymentConfig = {
    price: dataset.price.toString(),
    network: process.env.X402_NETWORK || 'solana-devnet',
    recipient: dataset.provider.walletAddress,  // ✅ 使用数据提供者的钱包地址
    facilitatorUrl: process.env.FACILITATOR_URL || 'https://facilitator.payai.network',
  }

  return requirePayment(paymentConfig)(request, async () => {
    // 支付验证通过，创建订单并返回下载链接
    await createOrder(params.id, user.id, dataset.price)
    return handleDownload(params.id, user.id)
  })
}

async function createOrder(productId: string, buyerId: string, price: number) {
  // 创建订单逻辑
  await prisma.order.create({
    data: {
      productId,
      buyerId,
      amount: price,
      status: 'COMPLETED',
      paymentMethod: 'x402',
    },
  })
}

async function handleDownload(productId: string, userId: string) {
  // 返回下载链接
  const downloadUrl = `/api/decrypt?productId=${productId}`
  return NextResponse.json({
    success: true,
    data: {
      downloadUrl,
      message: 'Payment verified, download ready',
    },
  })
}
```

### 步骤 5: 创建 Python x402 客户端

更新 `examples/python-sdk/datanexus_client.py`:

```python
import requests
from typing import Optional, Dict, Any
from solana.rpc.api import Client
from solana.transaction import Transaction
from solders.keypair import Keypair
from solders.system_program import transfer, TransferParams
from solders.pubkey import Pubkey

class X402Client:
    """x402 支付客户端"""
    
    def __init__(self, private_key: str, network: str = "devnet"):
        self.keypair = Keypair.from_base58_string(private_key)
        self.network = network
        
        if network == "devnet":
            self.rpc_url = "https://api.devnet.solana.com"
        else:
            self.rpc_url = "https://api.mainnet-beta.solana.com"
        
        self.client = Client(self.rpc_url)
    
    def make_payment(self, recipient: str, amount: float) -> str:
        """
        发起 Solana 支付
        
        Args:
            recipient: 接收方钱包地址
            amount: 支付金额 (USDC)
        
        Returns:
            支付凭证 (交易签名)
        """
        # 这里简化处理，实际应该使用 USDC SPL Token
        # 为了演示，我们使用 SOL 转账
        
        recipient_pubkey = Pubkey.from_string(recipient)
        lamports = int(amount * 1_000_000_000)  # 转换为 lamports
        
        # 创建转账交易
        transfer_ix = transfer(
            TransferParams(
                from_pubkey=self.keypair.pubkey(),
                to_pubkey=recipient_pubkey,
                lamports=lamports
            )
        )
        
        # 发送交易
        recent_blockhash = self.client.get_latest_blockhash().value.blockhash
        transaction = Transaction([transfer_ix], recent_blockhash)
        
        # 签名并发送
        signature = self.client.send_transaction(
            transaction,
            self.keypair
        ).value
        
        return str(signature)


class DataNexusClient:
    """DataNexus AI Agent 客户端 (支持 x402)"""
    
    def __init__(
        self,
        api_key: str,
        base_url: str = "http://localhost:3000",
        solana_private_key: Optional[str] = None
    ):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })
        
        # x402 支付客户端
        self.x402_client = None
        if solana_private_key:
            self.x402_client = X402Client(solana_private_key)
    
    def _handle_402_response(self, response: requests.Response) -> Optional[str]:
        """
        处理 402 Payment Required 响应
        
        Returns:
            支付凭证，如果支付成功
        """
        if not self.x402_client:
            raise Exception("Payment required but no Solana private key provided")
        
        # 从响应头获取支付信息
        amount = response.headers.get('x-payment-amount')
        recipient = response.headers.get('x-payment-recipient')
        network = response.headers.get('x-payment-network')
        
        print(f"💰 Payment required: {amount} USDC to {recipient}")
        print(f"🔄 Processing payment on {network}...")
        
        # 发起支付
        payment_token = self.x402_client.make_payment(
            recipient=recipient,
            amount=float(amount)
        )
        
        print(f"✅ Payment completed: {payment_token}")
        return payment_token
    
    def download_dataset(self, dataset_id: str, output_path: str) -> Dict[str, Any]:
        """
        下载数据集 (支持 x402 自动支付)
        
        Args:
            dataset_id: 数据集 ID
            output_path: 保存路径
        
        Returns:
            下载结果
        """
        url = f"{self.base_url}/api/agent/datasets/{dataset_id}/download"
        
        # 第一次请求
        response = self.session.get(url)
        
        # 如果返回 402，自动支付并重试
        if response.status_code == 402:
            payment_token = self._handle_402_response(response)
            
            # 添加支付凭证，重新请求
            headers = {"x-payment-token": payment_token}
            response = self.session.get(url, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            download_url = result['data']['downloadUrl']
            
            # 下载文件
            file_response = self.session.get(f"{self.base_url}{download_url}")
            with open(output_path, 'wb') as f:
                f.write(file_response.content)
            
            print(f"✅ Dataset downloaded to {output_path}")
            return result
        else:
            raise Exception(f"Download failed: {response.text}")


# 使用示例
if __name__ == "__main__":
    # 初始化客户端（带 Solana 私钥以支持 x402）
    client = DataNexusClient(
        api_key="sk_OTk0YjJkNGQtNTY3Yi00MjJkLWI1OGYt",
        solana_private_key="你的Solana私钥"  # Base58 格式
    )
    
    # 下载数据集 - 如果需要支付，会自动完成
    client.download_dataset(
        dataset_id="09390864-938d-4b84-a9f2-f5c99d7b2d4a",
        output_path="./downloaded_dataset.csv"
    )
```

## 🧪 测试流程

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 测试 402 响应

```bash
# 请求未购买的数据集
curl -v "http://localhost:3000/api/agent/datasets/DATASET_ID/download" \
  -H "Authorization: Bearer YOUR_API_KEY"

# 应该返回 402 状态码和支付信息
```

### 3. 测试 Python 客户端

```python
from datanexus_client import DataNexusClient

client = DataNexusClient(
    api_key="sk_xxx",
    solana_private_key="your_private_key"
)

# 自动支付并下载
client.download_dataset("dataset_id", "./output.csv")
```

## 📊 下一步

1. ✅ 完成服务端 x402 中间件
2. ✅ 更新所有需要支付的 Agent API 端点
3. ✅ 实现 Python x402 客户端
4. ✅ 端到端测试
5. ✅ 更新 Swagger 文档
6. ✅ 创建演示视频

## 🎯 成功标准

- [ ] Agent 请求付费资源时收到 402 响应
- [ ] Agent 自动完成 Solana 支付
- [ ] 服务端验证支付凭证
- [ ] Agent 成功下载资源
- [ ] 整个流程无需人工干预

