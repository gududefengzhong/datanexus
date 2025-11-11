/**
 * On-chain Reputation System
 * 
 * Hybrid architecture:
 * 1. Detailed data → Irys (permanent, public)
 * 2. Data hash → Solana (immutable proof)
 * 3. PostgreSQL → Cache for fast queries
 * 4. SAS attestation → Solana (for score ≥ 80)
 */

import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { createHash } from 'crypto'
import { getIrysUploader } from './irys'

// Solana connection
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=4e09833e-bb41-411e-9ede-234ddc1ebf76'
const connection = new Connection(SOLANA_RPC, 'confirmed')

// Data types
export interface OnchainRating {
  id: string
  providerId: string
  buyerId: string
  orderId: string
  rating: number
  comment?: string
  dataQuality?: number
  accuracy?: number
  documentation?: number
  support?: number
  timestamp: number
  signature?: string // Buyer's signature
}

export interface OnchainDispute {
  id: string
  orderId: string
  reason: string
  description: string
  evidence?: any
  requestedAmount: number
  timestamp: number
}

export interface OnchainRefund {
  id: string
  orderId: string
  amount: number
  reason: string
  type: string
  txHash?: string
  timestamp: number
}

export interface OnchainReputation {
  providerId: string
  totalSales: number
  totalRevenue: number
  averageRating: number
  totalRatings: number
  totalDisputes: number
  approvedDisputes: number
  disputeRate: number
  totalRefunds: number
  refundAmount: number
  refundRate: number
  reputationScore: number
  badges: string[]
  timestamp: number
  // Irys references
  ratingsIrysId?: string
  disputesIrysId?: string
  refundsIrysId?: string
}

/**
 * Upload rating to Irys and store hash on Solana
 */
export async function uploadRatingToIrys(rating: OnchainRating): Promise<string> {
  try {
    const irys = await getIrysUploader()
    
    // Prepare data
    const data = JSON.stringify(rating, null, 2)
    
    // Upload to Irys
    const receipt = await irys.upload(data, {
      tags: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'App-Name', value: 'DataNexus' },
        { name: 'Data-Type', value: 'Rating' },
        { name: 'Provider-Id', value: rating.providerId },
        { name: 'Buyer-Id', value: rating.buyerId },
        { name: 'Order-Id', value: rating.orderId },
        { name: 'Rating', value: rating.rating.toString() },
        { name: 'Timestamp', value: rating.timestamp.toString() },
      ]
    })
    
    console.log(`✅ Rating uploaded to Irys: ${receipt.id}`)
    console.log(`   URL: https://gateway.irys.xyz/${receipt.id}`)
    
    return receipt.id
  } catch (error) {
    console.error('❌ Failed to upload rating to Irys:', error)
    throw error
  }
}

/**
 * Upload dispute to Irys
 */
export async function uploadDisputeToIrys(dispute: OnchainDispute): Promise<string> {
  try {
    const irys = await getIrysUploader()
    
    const data = JSON.stringify(dispute, null, 2)
    
    const receipt = await irys.upload(data, {
      tags: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'App-Name', value: 'DataNexus' },
        { name: 'Data-Type', value: 'Dispute' },
        { name: 'Order-Id', value: dispute.orderId },
        { name: 'Reason', value: dispute.reason },
        { name: 'Timestamp', value: dispute.timestamp.toString() },
      ]
    })
    
    console.log(`✅ Dispute uploaded to Irys: ${receipt.id}`)
    return receipt.id
  } catch (error) {
    console.error('❌ Failed to upload dispute to Irys:', error)
    throw error
  }
}

/**
 * Upload refund to Irys
 */
export async function uploadRefundToIrys(refund: OnchainRefund): Promise<string> {
  try {
    const irys = await getIrysUploader()
    
    const data = JSON.stringify(refund, null, 2)
    
    const receipt = await irys.upload(data, {
      tags: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'App-Name', value: 'DataNexus' },
        { name: 'Data-Type', value: 'Refund' },
        { name: 'Order-Id', value: refund.orderId },
        { name: 'Reason', value: refund.reason },
        { name: 'Amount', value: refund.amount.toString() },
        { name: 'Timestamp', value: refund.timestamp.toString() },
      ]
    })
    
    console.log(`✅ Refund uploaded to Irys: ${receipt.id}`)
    return receipt.id
  } catch (error) {
    console.error('❌ Failed to upload refund to Irys:', error)
    throw error
  }
}

/**
 * Calculate hash of data
 */
export function calculateDataHash(data: any): string {
  const jsonString = JSON.stringify(data, Object.keys(data).sort())
  return createHash('sha256').update(jsonString).digest('hex')
}

/**
 * Store hash on Solana (using memo program)
 */
export async function storeHashOnSolana(
  hash: string,
  dataType: 'rating' | 'dispute' | 'refund' | 'reputation',
  irysId: string
): Promise<string> {
  try {
    // For hackathon demo, we'll use a simple memo transaction
    // In production, you'd use a custom program or SAS
    
    const privateKeyString = process.env.IRYS_PRIVATE_KEY
    if (!privateKeyString) {
      throw new Error('IRYS_PRIVATE_KEY not found')
    }
    
    const privateKeyBytes = Uint8Array.from(JSON.parse(privateKeyString))
    const keypair = Keypair.fromSecretKey(privateKeyBytes)
    
    // Create memo instruction
    const memoData = JSON.stringify({
      app: 'DataNexus',
      type: dataType,
      hash,
      irysId,
      timestamp: Date.now()
    })
    
    // For demo, we'll just return a simulated transaction hash
    // In production, you'd create and send a real transaction
    const simulatedTxHash = `${dataType}_${Date.now()}_${hash.substring(0, 8)}`
    
    console.log(`✅ Hash stored on Solana (simulated): ${simulatedTxHash}`)
    console.log(`   Data type: ${dataType}`)
    console.log(`   Hash: ${hash}`)
    console.log(`   Irys ID: ${irysId}`)
    
    return simulatedTxHash
    
    // TODO: Implement real Solana transaction
    // const transaction = new Transaction().add(
    //   new TransactionInstruction({
    //     keys: [],
    //     programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    //     data: Buffer.from(memoData)
    //   })
    // )
    // const signature = await sendAndConfirmTransaction(connection, transaction, [keypair])
    // return signature
    
  } catch (error) {
    console.error('❌ Failed to store hash on Solana:', error)
    throw error
  }
}

/**
 * Verify data integrity
 */
export async function verifyDataIntegrity(
  irysId: string,
  expectedHash: string
): Promise<boolean> {
  try {
    // Fetch data from Irys
    const response = await fetch(`https://gateway.irys.xyz/${irysId}`)
    const data = await response.json()
    
    // Calculate hash
    const actualHash = calculateDataHash(data)
    
    // Compare
    const isValid = actualHash === expectedHash
    
    console.log(`${isValid ? '✅' : '❌'} Data integrity check:`)
    console.log(`   Expected: ${expectedHash}`)
    console.log(`   Actual:   ${actualHash}`)
    
    return isValid
  } catch (error) {
    console.error('❌ Failed to verify data integrity:', error)
    return false
  }
}

/**
 * Get all ratings for a provider from Irys
 */
export async function getProviderRatingsFromIrys(providerId: string): Promise<OnchainRating[]> {
  try {
    // Query Irys for ratings
    const query = `
      query {
        transactions(
          tags: [
            { name: "App-Name", values: ["DataNexus"] },
            { name: "Data-Type", values: ["Rating"] },
            { name: "Provider-Id", values: ["${providerId}"] }
          ]
          first: 100
        ) {
          edges {
            node {
              id
              tags {
                name
                value
              }
            }
          }
        }
      }
    `
    
    const response = await fetch('https://arweave-search.goldsky.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
    
    const result = await response.json()
    const transactions = result.data?.transactions?.edges || []
    
    // Fetch each rating
    const ratings: OnchainRating[] = []
    for (const edge of transactions) {
      const irysId = edge.node.id
      const ratingResponse = await fetch(`https://gateway.irys.xyz/${irysId}`)
      const rating = await ratingResponse.json()
      ratings.push(rating)
    }
    
    return ratings
  } catch (error) {
    console.error('❌ Failed to get ratings from Irys:', error)
    return []
  }
}

/**
 * Upload reputation snapshot to Irys and issue SAS attestation
 */
export async function uploadReputationToIrys(reputation: OnchainReputation): Promise<string> {
  try {
    const irys = await getIrysUploader()
    
    const data = JSON.stringify(reputation, null, 2)
    
    const receipt = await irys.upload(data, {
      tags: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'App-Name', value: 'DataNexus' },
        { name: 'Data-Type', value: 'Reputation' },
        { name: 'Provider-Id', value: reputation.providerId },
        { name: 'Reputation-Score', value: reputation.reputationScore.toString() },
        { name: 'Total-Sales', value: reputation.totalSales.toString() },
        { name: 'Average-Rating', value: reputation.averageRating.toString() },
        { name: 'Timestamp', value: reputation.timestamp.toString() },
      ]
    })
    
    console.log(`✅ Reputation uploaded to Irys: ${receipt.id}`)
    
    // If score >= 80, issue SAS attestation
    if (reputation.reputationScore >= 80) {
      await issueSASAttestation(reputation, receipt.id)
    }
    
    return receipt.id
  } catch (error) {
    console.error('❌ Failed to upload reputation to Irys:', error)
    throw error
  }
}

/**
 * Issue SAS attestation for high-reputation providers
 */
export async function issueSASAttestation(
  reputation: OnchainReputation,
  irysId: string
): Promise<string> {
  try {
    // For hackathon demo, we'll simulate SAS attestation
    // In production, you'd use the actual SAS SDK
    
    const attestationId = `sas_${Date.now()}_${reputation.providerId.substring(0, 8)}`
    
    console.log(`✅ SAS Attestation issued (simulated): ${attestationId}`)
    console.log(`   Provider: ${reputation.providerId}`)
    console.log(`   Score: ${reputation.reputationScore}`)
    console.log(`   Irys ID: ${irysId}`)
    
    // TODO: Implement real SAS attestation
    // const sas = new SolanaAttestationService(connection)
    // const attestation = await sas.createAttestation({
    //   recipient: new PublicKey(reputation.providerId),
    //   schema: 'provider-reputation',
    //   data: {
    //     score: reputation.reputationScore,
    //     totalSales: reputation.totalSales,
    //     averageRating: reputation.averageRating,
    //     irysId
    //   }
    // })
    // return attestation.id
    
    return attestationId
  } catch (error) {
    console.error('❌ Failed to issue SAS attestation:', error)
    throw error
  }
}

