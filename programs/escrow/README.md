# DataNexus Escrow Smart Contract

完整的 Anchor 智能合约实现，用于 DataNexus 数据市场的去中心化托管。

## 🎯 核心功能

### 1. 创建托管 (`create_escrow`)
- 买家创建托管账户
- 自动转入 USDC 到托管 PDA
- 记录买家、提供商、平台地址
- 状态：Created → Funded

### 2. 标记交付 (`mark_delivered`)
- 提供商标记数据已交付
- 只有提供商可以调用
- 状态：Funded → Delivered

### 3. 确认并释放资金 (`confirm_and_release`)
- 买家确认数据质量
- 自动分配资金：
  - 95% → 提供商
  - 5% → 平台
- 使用 PDA 签名进行转账
- 状态：Delivered → Completed

### 4. 退款 (`refund`)
- 买家或平台可以发起退款
- 全额退还给买家
- 状态：Funded/Delivered → Refunded

### 5. 取消 (`cancel`)
- 买家可以取消未充值的托管
- 状态：Created → Cancelled

## 🏗️ 架构设计

### PDA (Program Derived Address)
```
seeds = [b"escrow", buyer.key(), request_id.as_bytes()]
```

每个托管账户都是一个 PDA，由以下因素唯一确定：
- 固定前缀 "escrow"
- 买家公钥
- 需求 ID

### 数据结构

```rust
pub struct Escrow {
    pub buyer: Pubkey,           // 买家
    pub provider: Pubkey,        // 提供商
    pub platform: Pubkey,        // 平台
    pub amount: u64,             // 托管金额（USDC，6 位小数）
    pub request_id: String,      // 需求 ID
    pub proposal_id: String,     // 提案 ID
    pub status: EscrowStatus,    // 状态
    pub created_at: i64,         // 创建时间
    pub funded_at: Option<i64>,  // 充值时间
    pub delivered_at: Option<i64>, // 交付时间
    pub completed_at: Option<i64>, // 完成时间
    pub refunded_at: Option<i64>,  // 退款时间
    pub bump: u8,                // PDA bump
}
```

### 状态机

```
Created → Funded → Delivered → Completed
            ↓
        Refunded
            
Created → Cancelled
```

## 🔒 安全特性

### 1. 访问控制
- ✅ 只有买家可以创建托管
- ✅ 只有提供商可以标记交付
- ✅ 只有买家可以确认释放
- ✅ 只有买家或平台可以退款

### 2. 状态验证
- ✅ 严格的状态机转换
- ✅ 防止重复操作
- ✅ 防止无效状态转换

### 3. 金额安全
- ✅ 使用 checked_mul/checked_div 防止溢出
- ✅ 精确的 95/5 分配
- ✅ PDA 托管，程序控制资金

### 4. PDA 签名
- ✅ 使用 PDA 作为托管账户
- ✅ 只有程序可以签名转账
- ✅ 防止资金被盗

## 📦 编译和部署

### 前置要求

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.20/install)"

# 安装 Anchor
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked
```

### 编译

```bash
# 在项目根目录
anchor build
```

### 部署到 Devnet

```bash
# 配置 Solana 到 Devnet
solana config set --url devnet

# 获取测试 SOL
solana airdrop 2

# 部署程序
anchor deploy
```

### 运行测试

```bash
# 安装依赖
npm install

# 运行测试
anchor test
```

## 🔧 集成到 DataNexus

### 1. 创建客户端

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DatanexusEscrow } from "./target/types/datanexus_escrow";

const provider = anchor.AnchorProvider.env();
const program = anchor.workspace.DatanexusEscrow as Program<DatanexusEscrow>;
```

### 2. 创建托管

```typescript
const [escrowPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("escrow"),
    buyer.publicKey.toBuffer(),
    Buffer.from(requestId),
  ],
  program.programId
);

await program.methods
  .createEscrow(amount, requestId, proposalId)
  .accounts({
    escrow: escrowPda,
    buyer: buyer.publicKey,
    provider: providerPublicKey,
    platform: platformPublicKey,
    buyerTokenAccount,
    escrowTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 3. 释放资金

```typescript
await program.methods
  .confirmAndRelease()
  .accounts({
    escrow: escrowPda,
    buyer: buyer.publicKey,
    escrowTokenAccount,
    providerTokenAccount,
    platformTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();
```

## 📊 Gas 成本估算

| 操作 | 预估成本 (SOL) | 说明 |
|------|---------------|------|
| 创建托管 | ~0.002 | 创建 PDA + 转账 |
| 标记交付 | ~0.0001 | 更新状态 |
| 释放资金 | ~0.0002 | 两次转账 |
| 退款 | ~0.0001 | 一次转账 |

## 🎯 Program ID

**Devnet**: `gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698`

## 📝 License

MIT

