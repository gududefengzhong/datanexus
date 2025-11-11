/**
 * Refund System
 * 
 * Handles automatic refunds, dispute resolution, and Solana refund transactions.
 * Inspired by Circle Refund Protocol.
 */

import { prisma } from './prisma'
import { updateProviderReputation } from './reputation'
import { syncRefundToChain } from './onchain-sync'

export type RefundReason =
  | 'DOWNLOAD_FAILED'
  | 'DUPLICATE_PAYMENT'
  | 'FRAUD'
  | 'DATA_QUALITY'
  | 'SERVICE_OUTAGE'

export type RefundType = 'AUTOMATIC' | 'MANUAL' | 'DISPUTE'

export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * Create an automatic refund
 */
export async function createAutoRefund(
  orderId: string,
  reason: RefundReason
): Promise<any> {
  console.log(`🔄 Creating auto refund for order ${orderId}, reason: ${reason}`)

  // Get order details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: {
        select: {
          providerId: true,
          name: true,
        },
      },
      buyer: {
        select: {
          walletAddress: true,
        },
      },
    },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  if (order.status === 'refunded') {
    throw new Error('Order already refunded')
  }

  if (!order.canRefund) {
    throw new Error('Order cannot be refunded')
  }

  // Check if refund already exists
  const existingRefund = await prisma.refund.findUnique({
    where: { orderId },
  })

  if (existingRefund) {
    console.log(`⚠️ Refund already exists for order ${orderId}`)
    return existingRefund
  }

  // Create refund record
  const refund = await prisma.refund.create({
    data: {
      orderId,
      amount: order.amount,
      reason,
      type: 'AUTOMATIC',
      status: 'pending',
    },
  })

  console.log(`✅ Auto refund created: ${refund.id}`)

  // Execute refund immediately for automatic refunds
  // Note: In production, this should be queued and processed by a background job
  try {
    await executeRefund(refund.id)
  } catch (error) {
    console.error(`❌ Failed to execute refund ${refund.id}:`, error)
  }

  return refund
}

/**
 * Execute a refund transaction on Solana
 * 
 * Note: This is a simplified implementation for the hackathon.
 * In production, this should:
 * 1. Use a secure wallet management system
 * 2. Implement proper transaction retry logic
 * 3. Handle gas fees and slippage
 * 4. Use a background job queue
 */
export async function executeRefund(refundId: string): Promise<any> {
  console.log(`💸 Executing refund ${refundId}`)

  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: {
      order: {
        include: {
          buyer: true,
          product: {
            include: {
              provider: true,
            },
          },
        },
      },
    },
  })

  if (!refund) {
    throw new Error('Refund not found')
  }

  if (refund.status !== 'pending') {
    throw new Error(`Refund status is ${refund.status}, expected pending`)
  }

  try {
    // Update status to processing
    await prisma.refund.update({
      where: { id: refundId },
      data: { status: 'processing' },
    })

    // TODO: Execute Solana refund transaction
    // For hackathon demo, we'll simulate the transaction
    const mockTxHash = `refund_${Date.now()}_${Math.random().toString(36).substring(7)}`

    console.log(`📝 Simulated refund transaction: ${mockTxHash}`)
    console.log(`   From: Platform wallet`)
    console.log(`   To: ${refund.order.buyer.walletAddress}`)
    console.log(`   Amount: ${refund.amount} USDC`)

    // In production, this would be:
    // const signature = await executeSolanaRefundTransaction(
    //   refund.order.buyer.walletAddress,
    //   refund.amount
    // )

    // Update refund status to completed
    await prisma.refund.update({
      where: { id: refundId },
      data: {
        status: 'completed',
        txHash: mockTxHash,
        txNetwork: process.env.SOLANA_NETWORK || 'solana-devnet',
        executedAt: new Date(),
      },
    })

    // Update order status to refunded
    await prisma.order.update({
      where: { id: refund.orderId },
      data: { status: 'refunded' },
    })

    // Update provider reputation
    await updateProviderReputation(refund.order.product.providerId, 'refund')

    // Sync refund to Irys and Solana in background with retry mechanism
    syncRefundToChain(refund.id).catch((error) => {
      console.error('❌ Failed to sync refund to chain:', error)
    })

    console.log(`✅ Refund completed: ${refund.id}`)

    return refund
  } catch (error) {
    console.error(`❌ Refund execution failed:`, error)

    // Update refund status to failed
    await prisma.refund.update({
      where: { id: refundId },
      data: {
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    throw error
  }
}

/**
 * Check for failed downloads and create automatic refunds
 * 
 * This should be run periodically (e.g., every 5 minutes) by a cron job.
 */
export async function checkFailedDownloads(): Promise<void> {
  console.log('🔍 Checking for failed downloads...')

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  const failedOrders = await prisma.order.findMany({
    where: {
      status: 'completed',
      downloadCount: 0,
      createdAt: { lte: fiveMinutesAgo },
      canRefund: true,
      refund: null,
    },
  })

  console.log(`Found ${failedOrders.length} failed downloads`)

  for (const order of failedOrders) {
    try {
      await createAutoRefund(order.id, 'DOWNLOAD_FAILED')
    } catch (error) {
      console.error(`Failed to create refund for order ${order.id}:`, error)
    }
  }
}

/**
 * Check for duplicate payments and create automatic refunds
 * 
 * This should be run periodically (e.g., every hour) by a cron job.
 */
export async function checkDuplicatePayments(): Promise<void> {
  console.log('🔍 Checking for duplicate payments...')

  // Find duplicate orders (same buyer + product)
  const duplicates = await prisma.$queryRaw<
    Array<{ buyerId: string; productId: string; count: bigint }>
  >`
    SELECT "buyerId", "productId", COUNT(*) as count
    FROM "Order"
    WHERE status = 'completed'
    GROUP BY "buyerId", "productId"
    HAVING COUNT(*) > 1
  `

  console.log(`Found ${duplicates.length} duplicate payment groups`)

  for (const dup of duplicates) {
    const orders = await prisma.order.findMany({
      where: {
        buyerId: dup.buyerId,
        productId: dup.productId,
        status: 'completed',
      },
      orderBy: { createdAt: 'asc' },
    })

    // Keep the first order, refund the rest
    for (let i = 1; i < orders.length; i++) {
      try {
        await createAutoRefund(orders[i].id, 'DUPLICATE_PAYMENT')
      } catch (error) {
        console.error(`Failed to create refund for duplicate order ${orders[i].id}:`, error)
      }
    }
  }
}

/**
 * Create a dispute
 */
export async function createDispute(data: {
  orderId: string
  reason: string
  description: string
  evidence?: any
  requestedAmount: number
}): Promise<any> {
  console.log(`📋 Creating dispute for order ${data.orderId}`)

  // Check if order exists
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  if (order.status !== 'completed') {
    throw new Error('Can only dispute completed orders')
  }

  // Check if dispute already exists
  const existingDispute = await prisma.dispute.findUnique({
    where: { orderId: data.orderId },
  })

  if (existingDispute) {
    throw new Error('Dispute already exists for this order')
  }

  // Create dispute
  const dispute = await prisma.dispute.create({
    data,
  })

  console.log(`✅ Dispute created: ${dispute.id}`)

  return dispute
}

/**
 * Get refund by ID
 */
export async function getRefund(refundId: string) {
  return await prisma.refund.findUnique({
    where: { id: refundId },
    include: {
      order: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
          buyer: {
            select: {
              id: true,
              walletAddress: true,
            },
          },
        },
      },
      dispute: true,
    },
  })
}

/**
 * Get dispute by ID
 */
export async function getDispute(disputeId: string) {
  return await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      order: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
          buyer: {
            select: {
              id: true,
              walletAddress: true,
            },
          },
        },
      },
      refund: true,
    },
  })
}

