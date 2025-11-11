import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api-auth'
import { getRefund } from '@/lib/refund'

/**
 * @swagger
 * /api/refunds/{id}:
 *   get:
 *     summary: Get refund details
 *     description: Retrieve details of a specific refund
 *     tags:
 *       - Refunds
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Refund ID
 *     responses:
 *       200:
 *         description: Refund details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 refund:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     orderId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     reason:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     txHash:
 *                       type: string
 *                     txNetwork:
 *                       type: string
 *                     executedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Refund not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Get refund
    const refund = await getRefund(id)

    if (!refund) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Refund not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      refund,
    })
  } catch (error) {
    console.error('Get refund error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get refund',
        },
      },
      { status: 500 }
    )
  }
}

