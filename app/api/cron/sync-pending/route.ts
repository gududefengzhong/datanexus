import { NextRequest, NextResponse } from 'next/server'
import {
  syncAllPendingRatings,
  syncAllPendingDisputes,
  syncAllPendingRefunds,
} from '@/lib/onchain-sync'

/**
 * Manual sync endpoint to sync all pending data to Irys and Solana
 *
 * For Hackathon: This endpoint can be called manually via POST request
 * to trigger synchronization of all pending data.
 *
 * For Production: Consider using a cron service like:
 * - Vercel Cron (paid plan)
 * - GitHub Actions
 * - External cron service (cron-job.org)
 *
 * @swagger
 * /api/cron/sync-pending:
 *   post:
 *     summary: Sync all pending data to chain
 *     description: Manually trigger sync of unsynced ratings, disputes, and refunds
 *     tags:
 *       - Sync
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Sync completed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // For Hackathon: Allow any authenticated user to trigger sync
    // For Production: Use a dedicated cron secret
    const apiKey = request.headers.get('x-api-key')
    const cronSecret = process.env.CRON_SECRET

    // Check either API key or cron secret
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}` && !apiKey) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid credentials',
            },
          },
          { status: 401 }
        )
      }
    }

    console.log('🔄 Starting background sync job...')

    const startTime = Date.now()

    // Sync all pending data in parallel
    const results = await Promise.allSettled([
      syncAllPendingRatings(),
      syncAllPendingDisputes(),
      syncAllPendingRefunds(),
    ])

    const duration = Date.now() - startTime

    // Check results
    const ratingsResult = results[0]
    const disputesResult = results[1]
    const refundsResult = results[2]

    const errors = []
    if (ratingsResult.status === 'rejected') {
      errors.push({ type: 'ratings', error: ratingsResult.reason })
    }
    if (disputesResult.status === 'rejected') {
      errors.push({ type: 'disputes', error: disputesResult.reason })
    }
    if (refundsResult.status === 'rejected') {
      errors.push({ type: 'refunds', error: refundsResult.reason })
    }

    console.log(`✅ Background sync job completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      duration,
      results: {
        ratings: ratingsResult.status === 'fulfilled' ? 'success' : 'failed',
        disputes: disputesResult.status === 'fulfilled' ? 'success' : 'failed',
        refunds: refundsResult.status === 'fulfilled' ? 'success' : 'failed',
      },
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('❌ Background sync job failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Sync job failed',
        },
      },
      { status: 500 }
    )
  }
}

// Allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request)
}

