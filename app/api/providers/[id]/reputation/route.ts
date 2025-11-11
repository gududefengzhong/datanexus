import { NextRequest, NextResponse } from 'next/server'
import { getProviderReputation } from '@/lib/reputation'

/**
 * @swagger
 * /api/providers/{id}/reputation:
 *   get:
 *     summary: Get provider reputation
 *     description: Retrieve reputation score, stats, and badges for a provider
 *     tags:
 *       - Providers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Provider ID
 *     responses:
 *       200:
 *         description: Provider reputation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 reputation:
 *                   type: object
 *                   properties:
 *                     reputationScore:
 *                       type: number
 *                       description: Reputation score (0-100)
 *                     totalSales:
 *                       type: number
 *                     totalRevenue:
 *                       type: number
 *                     averageRating:
 *                       type: number
 *                     totalRatings:
 *                       type: number
 *                     disputeRate:
 *                       type: number
 *                     refundRate:
 *                       type: number
 *                     badges:
 *                       type: array
 *                       items:
 *                         type: string
 *       404:
 *         description: Provider not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get provider reputation
    const reputation = await getProviderReputation(id)

    if (!reputation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Provider not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      reputation,
    })
  } catch (error) {
    console.error('Get provider reputation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get provider reputation',
        },
      },
      { status: 500 }
    )
  }
}

