import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api-auth'
import { getDispute } from '@/lib/refund'

/**
 * @swagger
 * /api/disputes/{id}:
 *   get:
 *     summary: Get dispute details
 *     description: Retrieve details of a specific dispute
 *     tags:
 *       - Disputes
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Dispute ID
 *     responses:
 *       200:
 *         description: Dispute details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 dispute:
 *                   type: object
 *       404:
 *         description: Dispute not found
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

    // Get dispute
    const dispute = await getDispute(id)

    if (!dispute) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Dispute not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      dispute,
    })
  } catch (error) {
    console.error('Get dispute error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get dispute',
        },
      },
      { status: 500 }
    )
  }
}

