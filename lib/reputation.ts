/**
 * Provider Reputation System
 * 
 * Manages provider reputation scores, ratings, and badges.
 * Integrates with Solana Attestation Service (SAS) for on-chain verification.
 */

import { prisma } from './prisma'
import { syncReputationToChain } from './onchain-sync'
import { type OnchainReputation } from './onchain-reputation'

export interface ProviderStats {
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
}

export type ReputationEvent = 'sale' | 'rating' | 'dispute' | 'refund'

/**
 * Update provider reputation after an event
 */
export async function updateProviderReputation(
  providerId: string,
  event: ReputationEvent
): Promise<void> {
  console.log(`📊 Updating reputation for provider ${providerId} after ${event}`)

  // Ensure reputation record exists
  await prisma.providerReputation.upsert({
    where: { providerId },
    create: { providerId },
    update: {},
  })

  // Recalculate all stats
  const stats = await calculateProviderStats(providerId)

  // Calculate reputation score (0-100)
  const score = calculateReputationScore(stats)

  // Determine badges
  const badges = determineBadges(stats, score)

  // Update database
  const updatedReputation = await prisma.providerReputation.update({
    where: { providerId },
    data: {
      ...stats,
      reputationScore: score,
      badges,
    },
  })

  console.log(`✅ Reputation updated: score=${score}, badges=${JSON.stringify(badges)}`)

  // Upload to Irys and issue SAS attestation if score >= 80
  if (score >= 80) {
    const onchainReputation: OnchainReputation = {
      providerId,
      totalSales: stats.totalSales,
      totalRevenue: stats.totalRevenue,
      averageRating: stats.averageRating,
      totalRatings: stats.totalRatings,
      totalDisputes: stats.totalDisputes,
      approvedDisputes: stats.approvedDisputes,
      disputeRate: stats.disputeRate,
      totalRefunds: stats.totalRefunds,
      refundAmount: stats.refundAmount,
      refundRate: stats.refundRate,
      reputationScore: score,
      badges,
      timestamp: Date.now(),
    }

    // Sync to Irys and issue SAS attestation in background with retry mechanism
    syncReputationToChain(providerId, onchainReputation).catch((error) => {
      console.error('❌ Failed to sync reputation to chain:', error)
    })
  }
}

/**
 * Calculate provider statistics from database
 */
export async function calculateProviderStats(providerId: string): Promise<ProviderStats> {
  // Get all completed orders
  const orders = await prisma.order.findMany({
    where: {
      product: { providerId },
      status: 'completed',
    },
    select: {
      amount: true,
    },
  })

  const totalSales = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0)

  // Get ratings
  const ratings = await prisma.providerRating.findMany({
    where: { providerId },
    select: { rating: true },
  })

  const totalRatings = ratings.length
  const averageRating =
    totalRatings > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings : 0

  // Get disputes
  const disputes = await prisma.dispute.findMany({
    where: {
      order: {
        product: { providerId },
      },
    },
    select: {
      status: true,
    },
  })

  const totalDisputes = disputes.length
  const approvedDisputes = disputes.filter((d) => d.status === 'approved').length
  const disputeRate = totalSales > 0 ? approvedDisputes / totalSales : 0

  // Get refunds
  const refunds = await prisma.refund.findMany({
    where: {
      order: {
        product: { providerId },
      },
      status: 'completed',
    },
    select: {
      amount: true,
    },
  })

  const totalRefunds = refunds.length
  const refundAmount = refunds.reduce((sum, r) => sum + r.amount, 0)
  const refundRate = totalSales > 0 ? totalRefunds / totalSales : 0

  return {
    totalSales,
    totalRevenue,
    averageRating,
    totalRatings,
    totalDisputes,
    approvedDisputes,
    disputeRate,
    totalRefunds,
    refundAmount,
    refundRate,
  }
}

/**
 * Calculate reputation score (0-100)
 * 
 * Formula:
 * - Base score: 50
 * - Rating contribution: (avgRating - 3) * 10 (max +20)
 * - Sales contribution: min(totalSales / 10, 20) (max +20)
 * - Dispute penalty: -disputeRate * 100 (max -30)
 * - Refund penalty: -refundRate * 100 (max -20)
 */
export function calculateReputationScore(stats: ProviderStats): number {
  let score = 50 // Base score

  // Rating contribution (max +20)
  if (stats.averageRating > 0) {
    score += (stats.averageRating - 3) * 10 // 3 stars = 0, 5 stars = +20
  }

  // Sales contribution (max +20)
  score += Math.min(stats.totalSales / 10, 20)

  // Dispute penalty (max -30)
  score -= stats.disputeRate * 100

  // Refund penalty (max -20)
  score -= stats.refundRate * 100

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score))
}

/**
 * Determine badges based on stats and score
 */
export function determineBadges(stats: ProviderStats, score: number): string[] {
  const badges: string[] = []

  // Verified badge (score >= 80)
  if (score >= 80) {
    badges.push('verified')
  }

  // Top seller badge (totalSales >= 100)
  if (stats.totalSales >= 100) {
    badges.push('top-seller')
  }

  // Trusted badge (avgRating >= 4.5 && totalRatings >= 10)
  if (stats.averageRating >= 4.5 && stats.totalRatings >= 10) {
    badges.push('trusted')
  }

  // High quality badge (disputeRate < 0.05 && totalSales >= 20)
  if (stats.disputeRate < 0.05 && stats.totalSales >= 20) {
    badges.push('high-quality')
  }

  // Reliable badge (refundRate < 0.03 && totalSales >= 20)
  if (stats.refundRate < 0.03 && stats.totalSales >= 20) {
    badges.push('reliable')
  }

  return badges
}

/**
 * Get provider reputation
 */
export async function getProviderReputation(providerId: string) {
  const reputation = await prisma.providerReputation.findUnique({
    where: { providerId },
    include: {
      provider: {
        select: {
          id: true,
          walletAddress: true,
        },
      },
    },
  })

  if (!reputation) {
    // Create default reputation
    return await prisma.providerReputation.create({
      data: { providerId },
      include: {
        provider: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
      },
    })
  }

  return reputation
}

/**
 * Create a rating for a provider
 */
export async function createProviderRating(data: {
  providerId: string
  buyerId: string
  orderId: string
  rating: number
  comment?: string
  dataQuality?: number
  accuracy?: number
  documentation?: number
  support?: number
}) {
  // Validate rating (1-5)
  if (data.rating < 1 || data.rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }

  // Check if order exists and belongs to buyer
  const order = await prisma.order.findFirst({
    where: {
      id: data.orderId,
      buyerId: data.buyerId,
      status: 'completed',
    },
    include: {
      product: {
        select: {
          providerId: true,
        },
      },
    },
  })

  if (!order) {
    throw new Error('Order not found or not completed')
  }

  if (order.product.providerId !== data.providerId) {
    throw new Error('Provider mismatch')
  }

  // Check if rating already exists
  const existingRating = await prisma.providerRating.findUnique({
    where: { orderId: data.orderId },
  })

  if (existingRating) {
    throw new Error('Rating already exists for this order')
  }

  // Check if there's a completed refund (cannot rate after refund)
  const refund = await prisma.refund.findFirst({
    where: {
      orderId: data.orderId,
      status: 'completed'
    }
  })

  if (refund) {
    throw new Error('Cannot rate after receiving a refund')
  }

  // Check if there's an active dispute
  const dispute = await prisma.dispute.findFirst({
    where: {
      orderId: data.orderId,
      status: { in: ['pending', 'reviewing', 'approved'] }
    }
  })

  if (dispute) {
    throw new Error('Cannot rate while dispute is active. Please wait for dispute resolution.')
  }

  // Create rating
  const rating = await prisma.providerRating.create({
    data,
  })

  // Update provider reputation
  await updateProviderReputation(data.providerId, 'rating')

  return rating
}

/**
 * Get provider ratings
 */
export async function getProviderRatings(providerId: string, limit = 10) {
  return await prisma.providerRating.findMany({
    where: { providerId },
    include: {
      buyer: {
        select: {
          id: true,
          walletAddress: true,
        },
      },
      order: {
        select: {
          id: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

