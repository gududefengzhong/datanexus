import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api-auth'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * @swagger
 * /api/requests/{id}/proposals:
 *   post:
 *     summary: Create a proposal
 *     description: Provider creates a proposal for a data request
 *     tags:
 *       - Proposals
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - price
 *               - deliveryTime
 *             properties:
 *               description:
 *                 type: string
 *                 example: "我有完整的 2024 年数据"
 *               price:
 *                 type: number
 *                 example: 80
 *               deliveryTime:
 *                 type: integer
 *                 example: 3
 *               sampleDataUrl:
 *                 type: string
 *                 example: "https://gateway.irys.xyz/sample123"
 *     responses:
 *       201:
 *         description: Proposal created successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Request not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Support both JWT token (user pages) and API key (AI agents) authentication
    const authHeader = request.headers.get('authorization')
    const apiKeyHeader = request.headers.get('x-api-key')

    let userId: string

    if (authHeader?.startsWith('Bearer ')) {
      // JWT token authentication (user pages)
      const token = authHeader.substring(7)
      const payload = verifyToken(token)

      if (!payload) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid or expired token',
            },
          },
          { status: 401 }
        )
      }

      userId = payload.userId
    } else if (apiKeyHeader) {
      // API key authentication (AI agents)
      const user = await verifyApiKey(request)

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid API key',
            },
          },
          { status: 401 }
        )
      }

      userId = user.id
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing authentication. Please provide either Authorization header or x-api-key',
          },
        },
        { status: 401 }
      )
    }

    const { id: requestId } = await params
    const body = await request.json()
    const { description, price, deliveryTime, sampleDataUrl, datasetId } = body

    // Validate required fields
    if (!description || !price || !deliveryTime) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: description, price, deliveryTime',
          },
        },
        { status: 400 }
      )
    }

    // Validate price
    if (price <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PRICE',
            message: 'Price must be greater than 0',
          },
        },
        { status: 400 }
      )
    }

    // Validate delivery time
    if (deliveryTime <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DELIVERY_TIME',
            message: 'Delivery time must be greater than 0',
          },
        },
        { status: 400 }
      )
    }

    // Get request
    const dataRequest = await prisma.dataRequest.findUnique({
      where: { id: requestId },
    })

    if (!dataRequest) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Request not found',
          },
        },
        { status: 404 }
      )
    }

    // Check if request is still open
    if (dataRequest.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REQUEST_CLOSED',
            message: 'Request is no longer accepting proposals',
          },
        },
        { status: 400 }
      )
    }

    // Check if deadline has passed
    if (new Date() > dataRequest.deadline) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DEADLINE_PASSED',
            message: 'Request deadline has passed',
          },
        },
        { status: 400 }
      )
    }

    // Check if provider already submitted a proposal
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        requestId,
        providerId: userId,
      },
    })

    if (existingProposal) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_PROPOSAL',
            message: 'You have already submitted a proposal for this request',
          },
        },
        { status: 400 }
      )
    }

    // If datasetId is provided, verify it exists and belongs to the user
    if (datasetId) {
      const dataset = await prisma.dataProduct.findUnique({
        where: { id: datasetId },
      })

      if (!dataset) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATASET_NOT_FOUND',
              message: 'Dataset not found',
            },
          },
          { status: 404 }
        )
      }

      if (dataset.providerId !== userId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only use your own datasets',
            },
          },
          { status: 403 }
        )
      }
    }

    // Create proposal
    const proposal = await prisma.proposal.create({
      data: {
        requestId,
        providerId: userId,
        description,
        price,
        deliveryTime,
        sampleDataUrl,
        datasetId: datasetId || null,
        status: 'pending',
      },
      include: {
        provider: {
          select: {
            id: true,
            walletAddress: true,
            providerReputation: {
              select: {
                reputationScore: true,
                badges: true,
              },
            },
          },
        },
        request: {
          select: {
            id: true,
            title: true,
            budget: true,
          },
        },
      },
    })

    // TODO: Upload to Irys in background
    // TODO: Notify buyer

    return NextResponse.json(
      {
        success: true,
        proposal,
        message: 'Proposal created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create proposal error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create proposal',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/requests/{id}/proposals:
 *   get:
 *     summary: List proposals for a request
 *     description: Get all proposals for a specific data request
 *     tags:
 *       - Proposals
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of proposals
 *       404:
 *         description: Request not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify API key
    await verifyApiKey(request)

    const { id: requestId } = await params

    // Check if request exists
    const dataRequest = await prisma.dataRequest.findUnique({
      where: { id: requestId },
    })

    if (!dataRequest) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Request not found',
          },
        },
        { status: 404 }
      )
    }

    // Get proposals
    const proposals = await prisma.proposal.findMany({
      where: { requestId },
      include: {
        provider: {
          select: {
            id: true,
            walletAddress: true,
            providerReputation: {
              select: {
                reputationScore: true,
                badges: true,
                totalSales: true,
                averageRating: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      proposals,
      total: proposals.length,
    })
  } catch (error) {
    console.error('List proposals error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list proposals',
        },
      },
      { status: 500 }
    )
  }
}

