import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { createProviderRating } from '@/lib/reputation'
import { syncRatingToChain } from '@/lib/onchain-sync'

/**
 * @swagger
 * /api/ratings:
 *   post:
 *     summary: Create a rating for a provider
 *     description: Submit a rating for a completed order
 *     tags:
 *       - Ratings
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerId
 *               - orderId
 *               - rating
 *             properties:
 *               providerId:
 *                 type: string
 *                 format: uuid
 *                 description: Provider ID to rate
 *               orderId:
 *                 type: string
 *                 format: uuid
 *                 description: Order ID
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Overall rating (1-5 stars)
 *               comment:
 *                 type: string
 *                 description: Optional comment
 *               dataQuality:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Data quality rating (1-5)
 *               accuracy:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Accuracy rating (1-5)
 *               documentation:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Documentation rating (1-5)
 *               support:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Support rating (1-5)
 *     responses:
 *       201:
 *         description: Rating created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 rating:
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
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing or invalid authorization header',
          },
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid token',
          },
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      providerId,
      orderId,
      rating,
      comment,
      dataQuality,
      accuracy,
      documentation,
      support,
    } = body

    // Validate required fields
    if (!providerId || !orderId || rating === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: providerId, orderId, rating',
          },
        },
        { status: 400 }
      )
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_RATING',
            message: 'Rating must be between 1 and 5',
          },
        },
        { status: 400 }
      )
    }

    // Create rating in database
    const newRating = await createProviderRating({
      providerId,
      buyerId: payload.userId,
      orderId,
      rating,
      comment,
      dataQuality,
      accuracy,
      documentation,
      support,
    })

    // Sync to Irys and Solana in background with retry mechanism
    syncRatingToChain(newRating.id).catch((error) => {
      console.error('❌ Failed to sync rating to chain:', error)
      // Error is logged but doesn't block the response
      // The sync will be retried by the background job
    })

    return NextResponse.json(
      {
        success: true,
        rating: newRating,
        message: 'Rating created and will be uploaded to Irys/Solana for permanent storage',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create rating error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create rating',
        },
      },
      { status: 500 }
    )
  }
}

