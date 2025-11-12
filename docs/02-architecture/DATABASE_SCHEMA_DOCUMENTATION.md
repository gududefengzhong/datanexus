# Database Schema Documentation

**Project**: DataNexus  
**Date**: 2025-11-10  
**Database**: PostgreSQL (Prisma)

---

## 📊 Table Usage Status

### ✅ Active Tables (Currently Used)

| Table | Status | Usage | API Routes | Priority |
|-------|--------|-------|------------|----------|
| **User** | ✅ Active | User authentication and profiles | `/api/auth/*`, `/api/products/*` | High |
| **ApiKey** | ✅ Active | API key management for AI agents | `/api/api-keys/*`, `/api/v1/*` | High |
| **DataProduct** | ✅ Active | Data marketplace products | `/api/products/*`, `/api/v1/products/*` | High |
| **Order** | ✅ Active | Purchase orders | `/api/orders/*` | High |
| **DataRequest** | ✅ Active | Data request marketplace | `/api/requests/*` | High |
| **Proposal** | ✅ Active | Provider proposals for requests | `/api/requests/[id]/proposals/*` | High |
| **Escrow** | ✅ Active | Anchor smart contract escrow | `/api/escrow/*` | High |
| **ProviderReputation** | ✅ Active | Provider reputation system with SAS | `/api/providers/[id]/reputation`, `/lib/reputation.ts` | High |
| **ProviderRating** | ✅ Active | Provider ratings from buyers | `/api/ratings/*`, `/lib/reputation.ts` | High |

### ❌ Unused Tables (Legacy/Future Features)

| Table | Status | Reason | Recommendation |
|-------|--------|--------|----------------|
| **AccessNFT** | ❌ Unused | NFT-based access control (legacy feature) | Can be removed |
| **Dispute** | ❌ Unused | Replaced by Anchor Escrow dispute mechanism | Can be removed |
| **Refund** | ❌ Unused | Replaced by Anchor Escrow refund mechanism | Can be removed |

---

## 📋 Detailed Table Documentation

### 1. User Table ✅

**Purpose**: Store user accounts and authentication data

**Schema**:
```prisma
model User {
  id            String   @id @default(uuid())
  walletAddress String   @unique
  role          String   @default("both")
  email         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Relationships**:
- Has many: `DataProduct`, `Order`, `ApiKey`, `DataRequest`, `Proposal`

**Used In**:
- `/api/auth/login` - User login
- `/api/auth/register` - User registration
- `/api/products/*` - Product provider info
- `/api/orders/*` - Order buyer info
- `/api/requests/*` - Request buyer info

**Indexes**:
- `walletAddress` (unique)

---

### 2. ApiKey Table ✅

**Purpose**: Manage API keys for AI agent authentication

**Schema**:
```prisma
model ApiKey {
  id          String    @id @default(uuid())
  userId      String
  name        String
  keyHash     String    @unique
  keyPrefix   String?
  permissions String[]  @default(["read", "purchase"])
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())
  expiresAt   DateTime?
}
```

**Relationships**:
- Belongs to: `User`

**Used In**:
- `/api/api-keys/*` - CRUD operations
- `/api/v1/*` - API key authentication
- `/lib/api-auth.ts` - Verification middleware

**Indexes**:
- `userId`
- `keyHash` (unique)

---

### 3. DataProduct Table ✅

**Purpose**: Store data marketplace products

**Schema**:
```prisma
model DataProduct {
  id                String   @id @default(uuid())
  providerId        String
  name              String
  description       String   @db.Text
  category          String
  price             Float
  
  // File information
  fileUrl           String
  irysTransactionId String   @unique
  fileType          String
  fileSize          Int
  fileName          String
  
  // Hybrid encryption (v3.0 - Current)
  encryptionKeyCiphertext  String?
  encryptionKeyIv          String?
  encryptionKeyAuthTag     String?
  
  // Stats
  views             Int      @default(0)
  purchases         Int      @default(0)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

**Relationships**:
- Belongs to: `User` (provider)
- Has many: `Order`, `Proposal`

**Used In**:
- `/api/products/*` - Product CRUD
- `/api/v1/products/*` - Public API
- `/api/agent/datasets/*` - AI agent API
- `/app/marketplace/page.tsx` - Marketplace UI
- `/app/dashboard/products/page.tsx` - Provider dashboard

**Indexes**:
- `providerId`
- `category`
- `createdAt`
- `irysTransactionId` (unique)

---

### 4. Order Table ✅

**Purpose**: Track product purchases

**Schema**:
```prisma
model Order {
  id              String   @id @default(uuid())
  productId       String
  buyerId         String
  amount          Float
  status          String   @default("pending")
  paymentTxHash   String?
  paymentNetwork  String?
  downloadCount   Int      @default(0)
  lastDownloadAt  DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Relationships**:
- Belongs to: `DataProduct`, `User` (buyer)

**Used In**:
- `/api/orders/*` - Order CRUD
- `/api/products/[id]/purchase` - Purchase flow
- `/app/dashboard/page.tsx` - User orders

**Indexes**:
- `buyerId`
- `productId`
- `status`
- `createdAt`

---

### 5. DataRequest Table ✅

**Purpose**: Store data requests from buyers

**Schema**:
```prisma
model DataRequest {
  id          String   @id @default(cuid())
  buyerId     String
  title       String
  description String   @db.Text
  budget      Float
  deadline    DateTime
  requirements Json?
  status      RequestStatus @default(pending)
  escrowAddress String?
  escrowAmount  Float?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Relationships**:
- Belongs to: `User` (buyer)
- Has many: `Proposal`

**Used In**:
- `/api/requests/*` - Request CRUD
- `/app/marketplace/requests/*` - Request marketplace UI

**Indexes**:
- `buyerId`
- `status`
- `deadline`

**Enums**:
```prisma
enum RequestStatus {
  pending
  matched
  in_progress
  completed
  cancelled
  disputed
}
```

---

### 6. Proposal Table ✅

**Purpose**: Store provider proposals for data requests

**Schema**:
```prisma
model Proposal {
  id          String   @id @default(cuid())
  requestId   String
  providerId  String
  description String   @db.Text
  price       Float
  deliveryTime Int
  sampleDataUrl String?
  status      ProposalStatus @default(pending)
  datasetId   String?
  deliveryProof String?
  deliveredAt DateTime?
  acceptedAt  DateTime?
  rejectedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Relationships**:
- Belongs to: `DataRequest`, `User` (provider), `DataProduct` (dataset)

**Used In**:
- `/api/requests/[id]/proposals/*` - Proposal CRUD
- `/api/proposals/[id]/*` - Proposal operations
- `/app/marketplace/requests/[id]/page.tsx` - Request detail UI

**Indexes**:
- `requestId`
- `providerId`
- `status`

**Enums**:
```prisma
enum ProposalStatus {
  pending
  accepted
  rejected
  delivered
  confirmed
}
```

---

### 7. Escrow Table ✅

**Purpose**: Track Anchor smart contract escrow accounts

**Schema**:
```prisma
model Escrow {
  id          String   @id @default(uuid())
  escrowPda   String   @unique
  buyer       String
  provider    String
  platform    String
  amount      Float
  requestId   String
  proposalId  String
  status      EscrowStatus @default(funded)
  signature   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Relationships**: None (tracks on-chain data)

**Used In**:
- `/api/escrow/*` - Escrow operations
- `/app/escrow/page.tsx` - Escrow management UI
- `/components/escrow/*` - Escrow components

**Indexes**:
- `buyer`
- `provider`
- `requestId`
- `proposalId`
- `status`
- `escrowPda` (unique)

**Enums**:
```prisma
enum EscrowStatus {
  created
  funded
  delivered
  disputed
  completed
  refunded
  cancelled
}
```

---

### 8. ProviderReputation Table ✅

**Purpose**: Track provider reputation scores with Solana Attestation Service (SAS) integration

**Schema**:
```prisma
model ProviderReputation {
  id              String   @id @default(uuid())
  providerId      String   @unique
  reputationScore Float    @default(50)
  totalSales      Int      @default(0)
  totalRevenue    Float    @default(0)
  averageRating   Float    @default(0)
  totalRatings    Int      @default(0)
  totalDisputes   Int      @default(0)
  approvedDisputes Int     @default(0)
  disputeRate     Float    @default(0)
  totalRefunds    Int      @default(0)
  refundAmount    Float    @default(0)
  refundRate      Float    @default(0)
  badges          String[] @default([])
  sasAttestationId String?
  irysTransactionId String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Relationships**:
- Belongs to: `User` (provider)

**Used In**:
- `/lib/reputation.ts` - Reputation calculation and updates
- `/api/providers/[id]/reputation` - Get provider reputation
- `/api/provider/dashboard` - Provider dashboard stats
- `/api/requests/[id]/proposals` - Show provider reputation in proposals
- `/lib/onchain-sync.ts` - Sync to Irys and SAS

**Features**:
- Automatic reputation score calculation (0-100)
- Badge system (verified, top-rated, reliable)
- SAS attestation for high-reputation providers (score >= 80)
- Irys permanent storage of reputation data

**Indexes**:
- `providerId` (unique)

---

### 9. ProviderRating Table ✅

**Purpose**: Store buyer ratings for providers

**Schema**:
```prisma
model ProviderRating {
  id            String   @id @default(uuid())
  providerId    String
  buyerId       String
  orderId       String   @unique
  rating        Float
  comment       String?  @db.Text
  dataQuality   Float?
  accuracy      Float?
  documentation Float?
  support       Float?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Relationships**:
- Belongs to: `User` (provider), `User` (buyer), `Order`

**Used In**:
- `/lib/reputation.ts` - Rating creation and retrieval
- `/api/ratings/*` - Rating CRUD operations
- `/lib/onchain-sync.ts` - Sync ratings to Irys

**Features**:
- 1-5 star rating system
- Multi-dimensional ratings (quality, accuracy, documentation, support)
- One rating per order
- Cannot rate after refund or during dispute
- Automatic reputation update on rating creation

**Indexes**:
- `providerId`
- `buyerId`
- `orderId` (unique)

---

## ❌ Tables to Remove

### 1. AccessNFT Table

**Reason**: Legacy NFT-based access control, replaced by hybrid encryption

**Impact**: None (not used in current codebase)

### 2. Dispute Table

**Reason**: Replaced by Anchor Escrow smart contract dispute mechanism

**Impact**: None (Anchor Escrow handles disputes on-chain)

### 3. Refund Table

**Reason**: Replaced by Anchor Escrow smart contract refund mechanism

**Impact**: None (Anchor Escrow handles refunds on-chain)

---

## 🔧 Recommendations

### High Priority
1. ✅ Keep all active tables (User, ApiKey, DataProduct, Order, DataRequest, Proposal, Escrow, ProviderReputation, ProviderRating)
2. ❌ Remove unused tables (AccessNFT, Dispute, Refund)

### Medium Priority
4. Add missing indexes for performance
5. Add data validation constraints
6. Document all enum values

### Low Priority
7. Consider adding soft delete (deletedAt field)
8. Add audit trail fields (createdBy, updatedBy)

---

## 📊 Statistics

- **Total Tables**: 12
- **Active Tables**: 9 (75%)
- **Unused Tables**: 3 (25%)

---

**Last Updated**: 2025-11-10  
**Status**: ✅ Documentation Complete

