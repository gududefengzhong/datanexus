import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api-auth'
import {
  checkRatingSyncStatus,
  checkDisputeSyncStatus,
  checkRefundSyncStatus,
} from '@/lib/onchain-sync'

/**
 * @swagger
 * /api/sync-status:
 *   get:
 *     summary: Check on-chain sync status
 *     description: Check if data has been synced to Irys and Solana
 *     tags:
 *       - Sync
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [rating, dispute, refund]
 *         description: Type of data to check
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the data
 *     responses:
 *       200:
 *         description: Sync status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 synced:
 *                   type: boolean
 *                   description: Whether data is synced to chain
 *                 verified:
 *                   type: boolean
 *                   description: Whether data integrity is verified
 *                 irysId:
 *                   type: string
 *                   description: Irys transaction ID
 *                 solanaHash:
 *                   type: string
 *                   description: Solana transaction hash
 *                 irysUrl:
 *                   type: string
 *                   description: URL to view data on Irys
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API key
    await verifyApiKey(request)

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required parameters: type, id',
          },
        },
        { status: 400 }
      )
    }

    if (!['rating', 'dispute', 'refund'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TYPE',
            message: 'Type must be one of: rating, dispute, refund',
          },
        },
        { status: 400 }
      )
    }

    let status
    try {
      switch (type) {
        case 'rating':
          status = await checkRatingSyncStatus(id)
          break
        case 'dispute':
          status = await checkDisputeSyncStatus(id)
          break
        case 'refund':
          status = await checkRefundSyncStatus(id)
          break
        default:
          throw new Error('Invalid type')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `${type} not found`,
            },
          },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      type,
      id,
      synced: status.synced,
      verified: status.verified,
      irysId: status.irysId,
      solanaHash: status.solanaHash,
      irysUrl: status.irysId ? `https://gateway.irys.xyz/${status.irysId}` : undefined,
      message: status.synced
        ? status.verified
          ? 'Data is synced and verified on-chain'
          : 'Data is synced but verification failed'
        : 'Data is not yet synced to chain',
    })
  } catch (error) {
    console.error('Sync status check error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to check sync status',
        },
      },
      { status: 500 }
    )
  }
}

