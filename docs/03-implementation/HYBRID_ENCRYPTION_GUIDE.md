# Hybrid Encryption Guide (v3.0)

## 🎯 Overview

DataNexus now uses a **hybrid encryption system** that combines:
- **AES-256-GCM** for file encryption (fast, secure symmetric encryption)
- **Database-stored keys** for access control (simple, reliable)
- **NFT-based access** for decentralized ownership verification

This approach is **much simpler** than the previous Lit Protocol integration and is **AI Agent friendly**!

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Upload Flow                             │
└─────────────────────────────────────────────────────────────┘

1. Provider uploads file
   ↓
2. Generate random AES-256 key
   ↓
3. Encrypt file with AES-256-GCM
   ↓
4. Encrypt the encryption key with master key
   ↓
5. Upload encrypted file to Irys
   ↓
6. Store encrypted key in database
   ↓
7. Create NFT collection for access control


┌─────────────────────────────────────────────────────────────┐
│                    Download Flow                             │
└─────────────────────────────────────────────────────────────┘

1. User requests download
   ↓
2. Check database: Is user provider or buyer?
   ↓
3. If yes → Decrypt encryption key from database
   ↓
4. Return decrypted file to user


┌─────────────────────────────────────────────────────────────┐
│                  AI Agent Access                             │
└─────────────────────────────────────────────────────────────┘

1. Agent calls API with API key
   ↓
2. Validate API key
   ↓
3. Check permissions in database
   ↓
4. Decrypt and return data
```

## 📦 Database Schema

```prisma
model DataProduct {
  // ... other fields ...
  
  // Hybrid encryption fields (v3.0)
  encryptionMethod         String?  // 'hybrid'
  encryptionVersion        String?  // '3.0'
  
  // Encrypted file data (stored on Irys)
  encryptedData            String?  @db.Text
  encryptionIv             String?
  encryptionAuthTag        String?
  
  // Encryption key (encrypted with master key, stored in DB)
  encryptionKeyCiphertext  String?
  encryptionKeyIv          String?
  encryptionKeyAuthTag     String?
  
  // NFT collection for access control
  nftCollectionAddress     String?
}
```

## 🔐 Encryption Process

### 1. Generate Encryption Key

```typescript
import { generateEncryptionKey } from '@/lib/encryption';

const encryptionKey = generateEncryptionKey();
// Returns: Base64-encoded 256-bit key
```

### 2. Encrypt File

```typescript
import { encryptData } from '@/lib/encryption';

const fileBuffer = Buffer.from(await file.arrayBuffer());
const { ciphertext, iv, authTag } = encryptData(fileBuffer, encryptionKey);
```

### 3. Encrypt the Encryption Key

```typescript
import { encryptEncryptionKey, getMasterEncryptionKey } from '@/lib/encryption';

const masterKey = getMasterEncryptionKey();
const {
  ciphertext: keyCiphertext,
  iv: keyIv,
  authTag: keyAuthTag,
} = encryptEncryptionKey(encryptionKey, masterKey);
```

### 4. Store in Database

```typescript
await prisma.dataProduct.create({
  data: {
    // ... other fields ...
    encryptionMethod: 'hybrid',
    encryptionVersion: '3.0',
    encryptedData: ciphertext,
    encryptionIv: iv,
    encryptionAuthTag: authTag,
    encryptionKeyCiphertext: keyCiphertext,
    encryptionKeyIv: keyIv,
    encryptionKeyAuthTag: keyAuthTag,
  },
});
```

## 🔓 Decryption Process

### 1. Check Permissions

```typescript
const isProvider = product.providerId === userId;
const hasPurchased = await prisma.order.findFirst({
  where: {
    productId,
    buyerId: userId,
    status: 'completed',
  },
});

if (!isProvider && !hasPurchased) {
  throw new Error('Access denied');
}
```

### 2. Decrypt Encryption Key

```typescript
import { decryptEncryptionKey, getMasterEncryptionKey } from '@/lib/encryption';

const masterKey = getMasterEncryptionKey();
const encryptionKey = decryptEncryptionKey(
  product.encryptionKeyCiphertext,
  product.encryptionKeyIv,
  product.encryptionKeyAuthTag,
  masterKey
);
```

### 3. Decrypt File

```typescript
import { decryptData } from '@/lib/encryption';

const decryptedBuffer = decryptData(
  product.encryptedData,
  product.encryptionIv,
  product.encryptionAuthTag,
  encryptionKey
);
```

## 🤖 AI Agent API

### Endpoint

```
GET /api/agent/data?productId=xxx
Header: X-API-Key: your-api-key
```

### Example Request

```bash
curl -H "X-API-Key: sk_test_1234567890" \
     "http://localhost:3000/api/agent/data?productId=abc-123"
```

### Example Response

```json
{
  "success": true,
  "product": {
    "id": "abc-123",
    "name": "Customer Data 2024",
    "description": "Customer purchase history",
    "category": "sales",
    "provider": "3RxgsquoKv6jgfLZoqbpZUpbV5uJsV7fxMqqKbgruatG"
  },
  "file": {
    "name": "customers.csv",
    "type": "text/csv",
    "size": 1024000,
    "data": "base64-encoded-file-data..."
  },
  "metadata": {
    "accessedAt": "2024-11-04T10:00:00.000Z",
    "accessMethod": "api-key",
    "apiKeyName": "My Agent Key"
  }
}
```

### Creating an API Key

```typescript
// In your application
const apiKey = crypto.randomBytes(32).toString('hex');
const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

await prisma.apiKey.create({
  data: {
    userId: user.id,
    name: 'My Agent Key',
    keyHash: apiKeyHash,
    permissions: ['read', 'purchase'],
  },
});

// Give the apiKey to the user (only shown once!)
console.log('Your API key:', `sk_${apiKey}`);
```

## 🔒 Security Features

### 1. Master Encryption Key

- Stored in environment variable `MASTER_ENCRYPTION_KEY`
- Used to encrypt all file encryption keys
- Never exposed to clients
- Rotatable (with re-encryption migration)

### 2. AES-256-GCM

- Industry-standard encryption
- Authenticated encryption (prevents tampering)
- Fast and efficient

### 3. Database Access Control

- Provider always has access
- Buyers must complete purchase
- API keys can be revoked
- Audit trail of access

### 4. NFT Integration

- NFT collection created for each product
- NFTs minted on purchase
- Can be used for additional verification
- Decentralized ownership proof

## 🚀 Advantages Over Lit Protocol

| Feature | Lit Protocol | Hybrid Encryption |
|---------|--------------|-------------------|
| **Complexity** | High (session sigs, PKPs, Lit Actions) | Low (standard AES) |
| **Reliability** | Network-dependent | Database-dependent |
| **Speed** | Slow (network calls) | Fast (local crypto) |
| **AI Agent Access** | Difficult | Simple REST API |
| **Debugging** | Hard | Easy |
| **Cost** | Network fees | Database storage |
| **Decentralization** | High | Medium (NFT + Irys) |

## 📝 Migration from Lit Protocol

The system supports **three encryption methods**:

1. **Legacy (v1.0)**: Original Lit Protocol
2. **Lit Actions (v2.0)**: Lit Protocol with custom actions
3. **Hybrid (v3.0)**: Current system ✅

All three methods are supported for backward compatibility!

## 🧪 Testing

### 1. Upload a File

```bash
# Go to http://localhost:3000/dashboard/upload
# Upload a CSV/JSON file
# Encryption is enabled by default
```

### 2. Download as Provider

```bash
# Go to the product page
# Click "Download"
# File should decrypt automatically
```

### 3. Test AI Agent API

```bash
# First, create an API key in the dashboard
# Then:
curl -H "X-API-Key: your-key" \
     "http://localhost:3000/api/agent/data?productId=your-product-id"
```

## 🎉 Summary

The hybrid encryption system provides:
- ✅ **Simple** implementation
- ✅ **Fast** encryption/decryption
- ✅ **Reliable** (no network dependencies)
- ✅ **AI Agent friendly** (simple REST API)
- ✅ **Secure** (AES-256-GCM + database access control)
- ✅ **Flexible** (supports NFT-based access)

Perfect for your DataNexus marketplace! 🚀

