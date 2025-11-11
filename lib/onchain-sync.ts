/**
 * On-chain Synchronization Service
 * 
 * Handles reliable synchronization of data to Irys and Solana with:
 * - Automatic retry mechanism
 * - Exponential backoff
 * - Status tracking
 * - Verification
 */

import { prisma } from './prisma'
import {
  uploadRatingToIrys,
  uploadDisputeToIrys,
  uploadRefundToIrys,
  uploadReputationToIrys,
  calculateDataHash,
  storeHashOnSolana,
  verifyDataIntegrity,
  issueSASAttestation,
  type OnchainRating,
  type OnchainDispute,
  type OnchainRefund,
  type OnchainReputation,
} from './onchain-reputation'

// Sync status enum
export type SyncStatus = 'pending' | 'uploading' | 'success' | 'failed'

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 1000 // 1 second
const MAX_DELAY_MS = 30000 // 30 seconds

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = INITIAL_DELAY_MS * Math.pow(2, attempt)
  return Math.min(delay, MAX_DELAY_MS)
}

/**
 * Sync rating to Irys and Solana with retry mechanism
 */
export async function syncRatingToChain(ratingId: string): Promise<void> {
  console.log(`🔄 Starting sync for rating ${ratingId}`)

  // Get rating from database
  const rating = await prisma.providerRating.findUnique({
    where: { id: ratingId },
  })

  if (!rating) {
    throw new Error(`Rating ${ratingId} not found`)
  }

  // Check if already synced
  if (rating.irysId && rating.solanaHash) {
    console.log(`✅ Rating ${ratingId} already synced`)
    return
  }

  let lastError: Error | null = null

  // Retry loop
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`📤 Attempt ${attempt + 1}/${MAX_RETRIES} for rating ${ratingId}`)

      // Prepare onchain rating data
      const onchainRating: OnchainRating = {
        id: rating.id,
        providerId: rating.providerId,
        buyerId: rating.buyerId,
        orderId: rating.orderId,
        rating: rating.rating,
        comment: rating.comment || undefined,
        dataQuality: rating.dataQuality || undefined,
        accuracy: rating.accuracy || undefined,
        documentation: rating.documentation || undefined,
        support: rating.support || undefined,
        timestamp: rating.createdAt.getTime(),
      }

      // Upload to Irys
      const irysId = await uploadRatingToIrys(onchainRating)
      console.log(`✅ Rating uploaded to Irys: ${irysId}`)

      // Calculate hash
      const hash = calculateDataHash(onchainRating)

      // Store hash on Solana
      const solanaHash = await storeHashOnSolana(hash, 'rating', irysId)
      console.log(`✅ Rating hash stored on Solana: ${solanaHash}`)

      // Verify data integrity
      const isValid = await verifyDataIntegrity(irysId, hash)
      if (!isValid) {
        throw new Error('Data integrity verification failed')
      }
      console.log(`✅ Data integrity verified`)

      // Update database
      await prisma.providerRating.update({
        where: { id: ratingId },
        data: {
          irysId,
          solanaHash,
          dataHash: hash,
        },
      })

      console.log(`✅ Rating ${ratingId} synced successfully`)
      return // Success!
    } catch (error) {
      lastError = error as Error
      console.error(`❌ Attempt ${attempt + 1} failed:`, error)

      // If not the last attempt, wait before retrying
      if (attempt < MAX_RETRIES - 1) {
        const delay = getRetryDelay(attempt)
        console.log(`⏳ Retrying in ${delay}ms...`)
        await sleep(delay)
      }
    }
  }

  // All retries failed
  console.error(`❌ Failed to sync rating ${ratingId} after ${MAX_RETRIES} attempts`)
  throw lastError || new Error('Sync failed')
}

/**
 * Sync dispute to Irys and Solana with retry mechanism
 */
export async function syncDisputeToChain(disputeId: string): Promise<void> {
  console.log(`🔄 Starting sync for dispute ${disputeId}`)

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
  })

  if (!dispute) {
    throw new Error(`Dispute ${disputeId} not found`)
  }

  if (dispute.irysId && dispute.solanaHash) {
    console.log(`✅ Dispute ${disputeId} already synced`)
    return
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`📤 Attempt ${attempt + 1}/${MAX_RETRIES} for dispute ${disputeId}`)

      const onchainDispute: OnchainDispute = {
        id: dispute.id,
        orderId: dispute.orderId,
        reason: dispute.reason,
        description: dispute.description,
        evidence: dispute.evidence,
        requestedAmount: dispute.requestedAmount,
        timestamp: dispute.createdAt.getTime(),
      }

      const irysId = await uploadDisputeToIrys(onchainDispute)
      console.log(`✅ Dispute uploaded to Irys: ${irysId}`)

      const hash = calculateDataHash(onchainDispute)
      const solanaHash = await storeHashOnSolana(hash, 'dispute', irysId)
      console.log(`✅ Dispute hash stored on Solana: ${solanaHash}`)

      const isValid = await verifyDataIntegrity(irysId, hash)
      if (!isValid) {
        throw new Error('Data integrity verification failed')
      }
      console.log(`✅ Data integrity verified`)

      await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          irysId,
          solanaHash,
          dataHash: hash,
        },
      })

      console.log(`✅ Dispute ${disputeId} synced successfully`)
      return
    } catch (error) {
      lastError = error as Error
      console.error(`❌ Attempt ${attempt + 1} failed:`, error)

      if (attempt < MAX_RETRIES - 1) {
        const delay = getRetryDelay(attempt)
        console.log(`⏳ Retrying in ${delay}ms...`)
        await sleep(delay)
      }
    }
  }

  console.error(`❌ Failed to sync dispute ${disputeId} after ${MAX_RETRIES} attempts`)
  throw lastError || new Error('Sync failed')
}

/**
 * Sync refund to Irys and Solana with retry mechanism
 */
export async function syncRefundToChain(refundId: string): Promise<void> {
  console.log(`🔄 Starting sync for refund ${refundId}`)

  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
  })

  if (!refund) {
    throw new Error(`Refund ${refundId} not found`)
  }

  if (refund.irysId && refund.solanaHashProof) {
    console.log(`✅ Refund ${refundId} already synced`)
    return
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`📤 Attempt ${attempt + 1}/${MAX_RETRIES} for refund ${refundId}`)

      const onchainRefund: OnchainRefund = {
        id: refund.id,
        orderId: refund.orderId,
        amount: refund.amount,
        reason: refund.reason,
        type: refund.type,
        txHash: refund.txHash || undefined,
        timestamp: refund.createdAt.getTime(),
      }

      const irysId = await uploadRefundToIrys(onchainRefund)
      console.log(`✅ Refund uploaded to Irys: ${irysId}`)

      const hash = calculateDataHash(onchainRefund)
      const solanaHash = await storeHashOnSolana(hash, 'refund', irysId)
      console.log(`✅ Refund hash stored on Solana: ${solanaHash}`)

      const isValid = await verifyDataIntegrity(irysId, hash)
      if (!isValid) {
        throw new Error('Data integrity verification failed')
      }
      console.log(`✅ Data integrity verified`)

      await prisma.refund.update({
        where: { id: refundId },
        data: {
          irysId,
          solanaHashProof: solanaHash,
          dataHash: hash,
        },
      })

      console.log(`✅ Refund ${refundId} synced successfully`)
      return
    } catch (error) {
      lastError = error as Error
      console.error(`❌ Attempt ${attempt + 1} failed:`, error)

      if (attempt < MAX_RETRIES - 1) {
        const delay = getRetryDelay(attempt)
        console.log(`⏳ Retrying in ${delay}ms...`)
        await sleep(delay)
      }
    }
  }

  console.error(`❌ Failed to sync refund ${refundId} after ${MAX_RETRIES} attempts`)
  throw lastError || new Error('Sync failed')
}

/**
 * Sync reputation to Irys and issue SAS attestation with retry mechanism
 */
export async function syncReputationToChain(
  providerId: string,
  reputation: OnchainReputation
): Promise<void> {
  console.log(`🔄 Starting sync for reputation ${providerId}`)

  const dbReputation = await prisma.providerReputation.findUnique({
    where: { providerId },
  })

  if (!dbReputation) {
    throw new Error(`Reputation for provider ${providerId} not found`)
  }

  if (dbReputation.irysId && dbReputation.sasAttestationId) {
    console.log(`✅ Reputation ${providerId} already synced`)
    return
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`📤 Attempt ${attempt + 1}/${MAX_RETRIES} for reputation ${providerId}`)

      const irysId = await uploadReputationToIrys(reputation)
      console.log(`✅ Reputation uploaded to Irys: ${irysId}`)

      const sasAttestationId = await issueSASAttestation(reputation, irysId)
      console.log(`✅ SAS attestation issued: ${sasAttestationId}`)

      await prisma.providerReputation.update({
        where: { providerId },
        data: {
          irysId,
          sasAttestationId,
          sasVerifiedAt: new Date(),
        },
      })

      console.log(`✅ Reputation ${providerId} synced successfully`)
      return
    } catch (error) {
      lastError = error as Error
      console.error(`❌ Attempt ${attempt + 1} failed:`, error)

      if (attempt < MAX_RETRIES - 1) {
        const delay = getRetryDelay(attempt)
        console.log(`⏳ Retrying in ${delay}ms...`)
        await sleep(delay)
      }
    }
  }

  console.error(`❌ Failed to sync reputation ${providerId} after ${MAX_RETRIES} attempts`)
  throw lastError || new Error('Sync failed')
}

/**
 * Check sync status for a rating
 */
export async function checkRatingSyncStatus(ratingId: string): Promise<{
  synced: boolean
  irysId?: string
  solanaHash?: string
  verified?: boolean
}> {
  const rating = await prisma.providerRating.findUnique({
    where: { id: ratingId },
    select: {
      irysId: true,
      solanaHash: true,
      dataHash: true,
    },
  })

  if (!rating) {
    throw new Error(`Rating ${ratingId} not found`)
  }

  const synced = !!(rating.irysId && rating.solanaHash)

  // If synced, verify data integrity
  let verified = false
  if (synced && rating.irysId && rating.dataHash) {
    try {
      verified = await verifyDataIntegrity(rating.irysId, rating.dataHash)
    } catch (error) {
      console.error('Verification failed:', error)
    }
  }

  return {
    synced,
    irysId: rating.irysId || undefined,
    solanaHash: rating.solanaHash || undefined,
    verified: synced ? verified : undefined,
  }
}

/**
 * Check sync status for a dispute
 */
export async function checkDisputeSyncStatus(disputeId: string): Promise<{
  synced: boolean
  irysId?: string
  solanaHash?: string
  verified?: boolean
}> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    select: {
      irysId: true,
      solanaHash: true,
      dataHash: true,
    },
  })

  if (!dispute) {
    throw new Error(`Dispute ${disputeId} not found`)
  }

  const synced = !!(dispute.irysId && dispute.solanaHash)

  let verified = false
  if (synced && dispute.irysId && dispute.dataHash) {
    try {
      verified = await verifyDataIntegrity(dispute.irysId, dispute.dataHash)
    } catch (error) {
      console.error('Verification failed:', error)
    }
  }

  return {
    synced,
    irysId: dispute.irysId || undefined,
    solanaHash: dispute.solanaHash || undefined,
    verified: synced ? verified : undefined,
  }
}

/**
 * Check sync status for a refund
 */
export async function checkRefundSyncStatus(refundId: string): Promise<{
  synced: boolean
  irysId?: string
  solanaHash?: string
  verified?: boolean
}> {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    select: {
      irysId: true,
      solanaHashProof: true,
      dataHash: true,
    },
  })

  if (!refund) {
    throw new Error(`Refund ${refundId} not found`)
  }

  const synced = !!(refund.irysId && refund.solanaHashProof)

  let verified = false
  if (synced && refund.irysId && refund.dataHash) {
    try {
      verified = await verifyDataIntegrity(refund.irysId, refund.dataHash)
    } catch (error) {
      console.error('Verification failed:', error)
    }
  }

  return {
    synced,
    irysId: refund.irysId || undefined,
    solanaHash: refund.solanaHashProof || undefined,
    verified: synced ? verified : undefined,
  }
}

/**
 * Find all unsynced ratings and sync them
 */
export async function syncAllPendingRatings(): Promise<void> {
  console.log('🔄 Syncing all pending ratings...')

  const unsyncedRatings = await prisma.providerRating.findMany({
    where: {
      OR: [{ irysId: null }, { solanaHash: null }],
    },
    select: { id: true },
  })

  console.log(`Found ${unsyncedRatings.length} unsynced ratings`)

  for (const rating of unsyncedRatings) {
    try {
      await syncRatingToChain(rating.id)
    } catch (error) {
      console.error(`Failed to sync rating ${rating.id}:`, error)
      // Continue with next rating
    }
  }

  console.log('✅ Finished syncing pending ratings')
}

/**
 * Find all unsynced disputes and sync them
 */
export async function syncAllPendingDisputes(): Promise<void> {
  console.log('🔄 Syncing all pending disputes...')

  const unsyncedDisputes = await prisma.dispute.findMany({
    where: {
      OR: [{ irysId: null }, { solanaHash: null }],
    },
    select: { id: true },
  })

  console.log(`Found ${unsyncedDisputes.length} unsynced disputes`)

  for (const dispute of unsyncedDisputes) {
    try {
      await syncDisputeToChain(dispute.id)
    } catch (error) {
      console.error(`Failed to sync dispute ${dispute.id}:`, error)
    }
  }

  console.log('✅ Finished syncing pending disputes')
}

/**
 * Find all unsynced refunds and sync them
 */
export async function syncAllPendingRefunds(): Promise<void> {
  console.log('🔄 Syncing all pending refunds...')

  const unsyncedRefunds = await prisma.refund.findMany({
    where: {
      OR: [{ irysId: null }, { solanaHashProof: null }],
    },
    select: { id: true },
  })

  console.log(`Found ${unsyncedRefunds.length} unsynced refunds`)

  for (const refund of unsyncedRefunds) {
    try {
      await syncRefundToChain(refund.id)
    } catch (error) {
      console.error(`Failed to sync refund ${refund.id}:`, error)
    }
  }

  console.log('✅ Finished syncing pending refunds')
}


