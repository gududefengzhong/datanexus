# DataNexus - Smart Contract Deployment Information

## 📋 Overview

DataNexus uses Anchor Framework smart contracts deployed on Solana Devnet for trustless escrow functionality.

---

## 🔗 Deployed Contracts

### Escrow Program

**Program ID**: `gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698`

**Network**: Solana Devnet

**Explorer**: https://explorer.solana.com/address/gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698?cluster=devnet

**Deployment Date**: November 10, 2025

**Framework**: Anchor v0.30.1

**Language**: Rust

---

## 🏗️ Contract Architecture

### Program Structure

```
programs/
└── escrow/
    ├── src/
    │   └── lib.rs          # Main escrow logic
    ├── Cargo.toml          # Rust dependencies
    └── Xargo.toml          # Build configuration
```

### Key Features

1. **Create Escrow**
   - Lock USDC in escrow account
   - Set delivery deadline
   - Define buyer and seller
   - Emit creation event

2. **Complete Escrow**
   - Verify delivery conditions
   - Transfer funds to seller (95%)
   - Transfer platform fee (5%)
   - Close escrow account

3. **Dispute Escrow**
   - Freeze funds
   - Trigger dispute resolution
   - Allow admin intervention

4. **Cancel Escrow**
   - Refund buyer if deadline passed
   - Close escrow account
   - Emit cancellation event

---

## 📊 Contract State

### Escrow Account Structure

```rust
#[account]
pub struct Escrow {
    pub buyer: Pubkey,           // Buyer's wallet address
    pub seller: Pubkey,          // Seller's wallet address
    pub amount: u64,             // Escrow amount in lamports
    pub deadline: i64,           // Unix timestamp deadline
    pub status: EscrowStatus,    // Current status
    pub request_id: String,      // Associated data request ID
    pub bump: u8,                // PDA bump seed
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowStatus {
    Active,      // Funds locked, awaiting delivery
    Completed,   // Delivery confirmed, funds released
    Disputed,    // Dispute raised, funds frozen
    Cancelled,   // Deadline passed, funds refunded
}
```

---

## 🔐 Security Features

### Access Control
- ✅ **PDA-based accounts**: Prevents unauthorized access
- ✅ **Signer verification**: Only authorized parties can execute
- ✅ **Deadline enforcement**: Automatic refunds after deadline
- ✅ **Status checks**: Prevents double-spending

### Safety Mechanisms
- ✅ **Reentrancy protection**: Single-entry execution
- ✅ **Overflow protection**: Safe math operations
- ✅ **Account validation**: Strict account ownership checks
- ✅ **Event logging**: All actions emit events

---

## 📝 Contract Instructions

### 1. Create Escrow

**Instruction**: `create_escrow`

**Parameters**:
- `amount: u64` - Amount in USDC (smallest unit)
- `deadline: i64` - Unix timestamp
- `request_id: String` - Data request identifier

**Accounts**:
- `buyer` - Signer, mutable
- `seller` - Seller's public key
- `escrow` - PDA, mutable, init
- `system_program` - System program
- `token_program` - SPL Token program

**Example**:
```typescript
await program.methods
  .createEscrow(
    new BN(500_000), // 0.5 USDC
    new BN(Date.now() / 1000 + 86400), // 24 hours
    "request_123"
  )
  .accounts({
    buyer: buyerWallet.publicKey,
    seller: sellerWallet.publicKey,
    escrow: escrowPDA,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();
```

---

### 2. Complete Escrow

**Instruction**: `complete_escrow`

**Parameters**: None

**Accounts**:
- `buyer` - Signer
- `seller` - Mutable
- `escrow` - PDA, mutable
- `platform_wallet` - Platform fee recipient
- `token_program` - SPL Token program

**Example**:
```typescript
await program.methods
  .completeEscrow()
  .accounts({
    buyer: buyerWallet.publicKey,
    seller: sellerWallet.publicKey,
    escrow: escrowPDA,
    platformWallet: platformWallet.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();
```

---

### 3. Dispute Escrow

**Instruction**: `dispute_escrow`

**Parameters**:
- `reason: String` - Dispute reason

**Accounts**:
- `initiator` - Signer (buyer or seller)
- `escrow` - PDA, mutable

**Example**:
```typescript
await program.methods
  .disputeEscrow("Data not delivered as specified")
  .accounts({
    initiator: buyerWallet.publicKey,
    escrow: escrowPDA,
  })
  .rpc();
```

---

### 4. Cancel Escrow

**Instruction**: `cancel_escrow`

**Parameters**: None

**Accounts**:
- `buyer` - Signer, mutable
- `escrow` - PDA, mutable
- `token_program` - SPL Token program

**Conditions**:
- Deadline must have passed
- Status must be Active

**Example**:
```typescript
await program.methods
  .cancelEscrow()
  .accounts({
    buyer: buyerWallet.publicKey,
    escrow: escrowPDA,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();
```

---

## 🎯 PDA Derivation

### Escrow PDA

```typescript
const [escrowPDA, bump] = await PublicKey.findProgramAddress(
  [
    Buffer.from("escrow"),
    buyerWallet.publicKey.toBuffer(),
    Buffer.from(requestId),
  ],
  program.programId
);
```

**Seeds**:
1. `"escrow"` - Static string
2. `buyer_pubkey` - Buyer's wallet address
3. `request_id` - Unique request identifier

---

## 💰 Fee Structure

### Platform Fee: 5%

**Distribution**:
- **Seller**: 95% of escrow amount
- **Platform**: 5% of escrow amount

**Example**:
```
Escrow Amount: 1.0 USDC
Seller Receives: 0.95 USDC
Platform Fee: 0.05 USDC
```

---

## 📊 Events

### EscrowCreated

```rust
#[event]
pub struct EscrowCreated {
    pub escrow: Pubkey,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub deadline: i64,
    pub request_id: String,
}
```

### EscrowCompleted

```rust
#[event]
pub struct EscrowCompleted {
    pub escrow: Pubkey,
    pub seller_amount: u64,
    pub platform_fee: u64,
}
```

### EscrowDisputed

```rust
#[event]
pub struct EscrowDisputed {
    pub escrow: Pubkey,
    pub initiator: Pubkey,
    pub reason: String,
}
```

### EscrowCancelled

```rust
#[event]
pub struct EscrowCancelled {
    pub escrow: Pubkey,
    pub refund_amount: u64,
}
```

---

## 🧪 Testing

### Test Coverage

- ✅ Create escrow with valid parameters
- ✅ Complete escrow successfully
- ✅ Dispute escrow by buyer
- ✅ Dispute escrow by seller
- ✅ Cancel escrow after deadline
- ✅ Prevent unauthorized access
- ✅ Prevent double completion
- ✅ Validate deadline enforcement

### Run Tests

```bash
anchor test
```

---

## 🚀 Deployment

### Build

```bash
anchor build
```

### Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

### Verify Deployment

```bash
solana program show gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698 --url devnet
```

---

## 📦 IDL (Interface Definition Language)

**Location**: `target/idl/datanexus_escrow.json`

**Usage**:
```typescript
import idl from './target/idl/datanexus_escrow.json';
import { Program } from '@coral-xyz/anchor';

const program = new Program(idl, programId, provider);
```

---

## 🔍 Verification

### On-Chain Verification

1. **Check Program Exists**:
   ```bash
   solana program show gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698 --url devnet
   ```

2. **View Program Data**:
   - Explorer: https://explorer.solana.com/address/gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698?cluster=devnet
   - Solscan: https://solscan.io/account/gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698?cluster=devnet

3. **Verify IDL**:
   ```bash
   anchor idl fetch gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698 --provider.cluster devnet
   ```

---

## 🛠️ Integration Example

### Frontend Integration

```typescript
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import idl from './idl/datanexus_escrow.json';

// Setup
const connection = new Connection('https://api.devnet.solana.com');
const provider = new AnchorProvider(connection, wallet, {});
const programId = new PublicKey('gxDTeSCzk9mqiokrmTb1uNbWCjQ1rj2hsj5N65K9698');
const program = new Program(idl, programId, provider);

// Create escrow
const tx = await program.methods
  .createEscrow(amount, deadline, requestId)
  .accounts({ /* ... */ })
  .rpc();

console.log('Escrow created:', tx);
```

---

## 📈 Usage Statistics (Devnet)

- **Total Escrows Created**: [To be tracked]
- **Completed Escrows**: [To be tracked]
- **Disputed Escrows**: [To be tracked]
- **Total Volume**: [To be tracked]

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Multi-signature dispute resolution
- [ ] Partial releases
- [ ] Milestone-based escrow
- [ ] Cross-program invocations
- [ ] Governance integration

---

## 📞 Support

**Issues**: https://github.com/gududefengzhong/datanexus/issues  
**Discord**: https://discord.gg/x402  
**Email**: greennft.eth@gmail.com

---

*Smart contracts audited and tested on Solana Devnet*

