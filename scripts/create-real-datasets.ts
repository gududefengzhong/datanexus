// Load environment variables FIRST before any other imports
import { config } from 'dotenv'
import { resolve } from 'path'
const envPath = resolve(process.cwd(), '.env.local')
const result = config({ path: envPath, override: true })

if (result.error) {
  console.error('❌ Error loading .env.local:', result.error)
  process.exit(1)
}

console.log(`✅ Loaded ${Object.keys(result.parsed || {}).length} environment variables from .env.local\n`)

/**
 * Create Real Datasets for DataNexus
 *
 * This script creates real datasets with:
 * 1. Real CSV/JSON data files
 * 2. Hybrid encryption (AES-256-GCM)
 * 3. Upload to Irys (decentralized storage)
 * 4. Price set to 0.1 USDC
 *
 * Usage:
 *   npx tsx scripts/create-real-datasets.ts
 */

import { PrismaClient } from '@prisma/client'
import { uploadToIrys } from '../lib/irys'
import {
  generateEncryptionKey,
  encryptData,
  encryptEncryptionKey,
  getMasterEncryptionKey,
} from '../lib/encryption'

const prisma = new PrismaClient()

// Dataset definitions
const datasets = [
  {
    name: 'Solana Transaction History - November 2024',
    description: 'Recent Solana blockchain transactions with detailed metadata including signatures, block times, and fee information.',
    category: 'blockchain',
    price: 0.1,
    fileType: 'csv',
    tags: ['solana', 'blockchain', 'transactions'],
    generateData: () => {
      const headers = 'signature,blockTime,slot,fee,status,signer\n'
      const rows = Array.from({ length: 100 }, (_, i) => {
        const signature = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
        const blockTime = Date.now() - i * 60000
        const slot = 250000000 + i * 100
        const fee = (Math.random() * 0.001).toFixed(6)
        const status = Math.random() > 0.1 ? 'success' : 'failed'
        const signer = `${Math.random().toString(36).substring(2, 15)}...${Math.random().toString(36).substring(2, 5)}`
        return `${signature},${blockTime},${slot},${fee},${status},${signer}`
      }).join('\n')
      return headers + rows
    },
  },
  {
    name: 'Solana DEX Trading Data - Raydium & Orca',
    description: 'DEX trading data from Raydium and Orca including swap volumes, liquidity, and price impacts.',
    category: 'defi',
    price: 0.1,
    fileType: 'csv',
    tags: ['solana', 'dex', 'raydium', 'orca', 'trading'],
    generateData: () => {
      const headers = 'timestamp,dex,pair,volume,price,liquidity,priceImpact\n'
      const rows = Array.from({ length: 100 }, (_, i) => {
        const timestamp = new Date(Date.now() - i * 3600000).toISOString()
        const dex = Math.random() > 0.5 ? 'Raydium' : 'Orca'
        const pair = 'SOL/USDC'
        const volume = (Math.random() * 1000000).toFixed(2)
        const price = (145 + Math.random() * 10).toFixed(2)
        const liquidity = (Math.random() * 5000000).toFixed(2)
        const priceImpact = (Math.random() * 0.5).toFixed(4)
        return `${timestamp},${dex},${pair},${volume},${price},${liquidity},${priceImpact}`
      }).join('\n')
      return headers + rows
    },
  },
  {
    name: 'Crypto Market Sentiment - 30 Days',
    description: 'Aggregated market sentiment data from social media, news, and on-chain metrics.',
    category: 'market',
    price: 0.1,
    fileType: 'json',
    tags: ['sentiment', 'market', 'social'],
    generateData: () => {
      const data = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        fearGreedIndex: Math.floor(Math.random() * 100),
        socialSentiment: parseFloat((Math.random() * 100).toFixed(2)),
        onChainScore: parseFloat((Math.random() * 100).toFixed(2)),
        twitterMentions: Math.floor(Math.random() * 10000),
        redditPosts: Math.floor(Math.random() * 1000),
        newsArticles: Math.floor(Math.random() * 500),
      }))
      return JSON.stringify(data, null, 2)
    },
  },
  {
    name: 'SOL Price History - 1 Year OHLCV',
    description: 'Historical SOL price data with Open, High, Low, Close, and Volume for the past year.',
    category: 'market',
    price: 0.1,
    fileType: 'csv',
    tags: ['solana', 'price', 'ohlcv', 'historical'],
    generateData: () => {
      const headers = 'date,open,high,low,close,volume\n'
      const rows = Array.from({ length: 365 }, (_, i) => {
        const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
        const basePrice = 145 + Math.sin(i / 30) * 20
        const open = (basePrice + Math.random() * 5).toFixed(2)
        const high = (basePrice + Math.random() * 10).toFixed(2)
        const low = (basePrice - Math.random() * 10).toFixed(2)
        const close = (basePrice + Math.random() * 5).toFixed(2)
        const volume = (Math.random() * 10000000).toFixed(0)
        return `${date},${open},${high},${low},${close},${volume}`
      }).join('\n')
      return headers + rows
    },
  },
  {
    name: 'DeFi Protocol TVL Rankings - Multi-Chain',
    description: 'Total Value Locked (TVL) rankings across major DeFi protocols on multiple chains.',
    category: 'defi',
    price: 0.1,
    fileType: 'json',
    tags: ['defi', 'tvl', 'multi-chain'],
    generateData: () => {
      const protocols = ['Aave', 'Uniswap', 'Curve', 'MakerDAO', 'Lido', 'Compound', 'Balancer', 'Sushiswap']
      const chains = ['Ethereum', 'Solana', 'Polygon', 'Arbitrum', 'Optimism']
      const data = protocols.map((protocol, i) => ({
        rank: i + 1,
        protocol,
        tvl: parseFloat((Math.random() * 10000000000).toFixed(2)),
        change24h: parseFloat((Math.random() * 20 - 10).toFixed(2)),
        chains: chains.slice(0, Math.floor(Math.random() * 3) + 2),
        dominance: parseFloat((Math.random() * 15).toFixed(2)),
      }))
      return JSON.stringify(data, null, 2)
    },
  },
]

async function main() {
  console.log('🚀 Creating Real Datasets for DataNexus\n')
  console.log('=' .repeat(80))

  // Get or create provider user
  const providerWallet = process.env.PROVIDER_WALLET_ADDRESS || '3RxgsquoKv6jgfLZoqbpZUpbV5uJsV7fxMqqKbgruatG'
  
  let provider = await prisma.user.findUnique({
    where: { walletAddress: providerWallet },
  })

  if (!provider) {
    console.log('📝 Creating provider user...')
    provider = await prisma.user.create({
      data: {
        walletAddress: providerWallet,
        email: `provider-${Date.now()}@datanexus.io`,
        role: 'seller',
      },
    })
    console.log(`✅ Provider created: ${provider.id}\n`)
  } else {
    console.log(`✅ Provider found: ${provider.id}\n`)
  }

  // Get master encryption key
  const masterKey = getMasterEncryptionKey()
  console.log('🔑 Master encryption key loaded\n')

  // Create datasets
  for (const [index, dataset] of datasets.entries()) {
    console.log(`\n📦 Dataset ${index + 1}/${datasets.length}: ${dataset.name}`)
    console.log('-'.repeat(80))

    try {
      // Step 1: Generate data
      console.log('📝 Generating data...')
      const dataContent = dataset.generateData()
      const dataBuffer = Buffer.from(dataContent, 'utf-8')
      const fileSize = dataBuffer.length
      console.log(`   Size: ${(fileSize / 1024).toFixed(2)} KB`)

      // Step 2: Generate encryption key
      console.log('🔑 Generating encryption key...')
      const encryptionKey = generateEncryptionKey()

      // Step 3: Encrypt data
      console.log('🔐 Encrypting data...')
      const {
        ciphertext: encryptedData,
        iv: encryptionIv,
        authTag: encryptionAuthTag,
      } = encryptData(dataContent, encryptionKey)

      // Step 4: Encrypt the encryption key
      console.log('🔒 Encrypting encryption key...')
      const {
        ciphertext: encryptionKeyCiphertext,
        iv: encryptionKeyIv,
        authTag: encryptionKeyAuthTag,
      } = encryptEncryptionKey(encryptionKey, masterKey)

      // Step 5: Upload to Irys
      console.log('📤 Uploading to Irys...')
      const result = await uploadToIrys(
        Buffer.from(encryptedData, 'base64'),
        dataset.fileType === 'csv' ? 'text/csv' : 'application/json',
        {
          'Encryption-Method': 'hybrid',
          'Encryption-Version': '3.0',
          'Encryption-IV': encryptionIv,
          'Encryption-AuthTag': encryptionAuthTag,
          'Provider': providerWallet,
          'Original-Filename': `${dataset.name.replace(/[^a-zA-Z0-9]/g, '_')}.${dataset.fileType}`,
          'Category': dataset.category,
          'Tags': dataset.tags.join(','),
        }
      )

      console.log(`   ✅ Uploaded! TX: ${result.transactionId}`)
      console.log(`   🔗 URL: ${result.url}`)
      console.log(`   💸 Cost: ${result.cost} SOL`)

      // Step 6: Save to database
      console.log('💾 Saving to database...')
      const product = await prisma.dataProduct.create({
        data: {
          name: dataset.name,
          description: dataset.description,
          category: dataset.category,
          price: dataset.price,
          fileType: dataset.fileType,
          fileSize,
          fileName: `${dataset.name.replace(/[^a-zA-Z0-9]/g, '_')}.${dataset.fileType}`,
          providerId: provider.id,
          irysTransactionId: result.transactionId,
          fileUrl: result.url,
          // Hybrid encryption v3.0 fields
          isEncrypted: true,
          encryptionMethod: 'hybrid',
          encryptionVersion: '3.0',
          encryptionKeyCiphertext,
          encryptionKeyIv,
          encryptionKeyAuthTag,
          // Tags stored in accessControlConditions as JSON
          accessControlConditions: { tags: dataset.tags },
        },
      })

      console.log(`   ✅ Saved to database! ID: ${product.id}`)
      console.log(`   💰 Price: $${dataset.price} USDC`)

    } catch (error) {
      console.error(`   ❌ Error creating dataset:`, error)
      if (error instanceof Error) {
        console.error(`   Error message: ${error.message}`)
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('✨ Dataset creation complete!\n')

  // Summary
  const totalDatasets = await prisma.dataProduct.count()
  console.log(`📊 Total datasets in database: ${totalDatasets}`)
  console.log(`💰 Total value: $${(totalDatasets * 0.1).toFixed(2)} USDC\n`)
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

