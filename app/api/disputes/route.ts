import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api-auth'
import { createDispute } from '@/lib/refund'
import { syncDisputeToChain } from '@/lib/onchain-sync'

/**
 * @swagger
 * /api/disputes:
 *   post:
 *     summary: Create a dispute for an order
 *     description: Submit a dispute for a completed order due to data quality issues or other problems
 *     tags:
 *       - Disputes
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - reason
 *               - description
 *               - requestedAmount
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *                 description: Order ID to dispute
 *               reason:
 *                 type: string
 *                 enum: [DATA_QUALITY, DOWNLOAD_FAILED, FRAUD, OTHER]
 *                 description: Reason for dispute
 *               description:
 *                 type: string
 *                 description: Detailed description of the issue
 *               evidence:
 *                 type: object
 *                 description: Evidence files or data (URLs, screenshots, etc.)
 *               requestedAmount:
 *                 type: number
 *                 description: Requested refund amount in USDC
 *     responses:
 *       201:
 *         description: Dispute created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 dispute:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authResult = await verifyApiKey(request)
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or missing API key',
          },
        },
        { status: 401 }
      )
    }

    const user = authResult.user

    // Parse request body
    const body = await request.json()
    const { orderId, reason, description, evidence, requestedAmount } = body

    // Validate required fields
    if (!orderId || !reason || !description || requestedAmount === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: orderId, reason, description, requestedAmount',
          },
        },
        { status: 400 }
      )
    }

    // Validate reason
    const validReasons = ['DATA_QUALITY', 'DOWNLOAD_FAILED', 'FRAUD', 'OTHER']
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REASON',
            message: `Invalid reason. Must be one of: ${validReasons.join(', ')}`,
          },
        },
        { status: 400 }
      )
    }

    // Create dispute in database
    const dispute = await createDispute({
      orderId,
      reason,
      description,
      evidence,
      requestedAmount,
    })

    // Sync to Irys and Solana in background with retry mechanism
    syncDisputeToChain(dispute.id).catch((error) => {
      console.error('❌ Failed to sync dispute to chain:', error)
    })

    return NextResponse.json(
      {
        success: true,
        dispute,
        message: 'Dispute created and will be uploaded to Irys/Solana for transparency',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create dispute error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create dispute',
        },
      },
      { status: 500 }
    )
  }
}

