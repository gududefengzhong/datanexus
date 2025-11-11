import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api-auth'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Create a data request
 *     description: Buyer creates a data request for providers to respond
 *     tags:
 *       - Data Requests
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - budget
 *               - deadline
 *             properties:
 *               title:
 *                 type: string
 *                 example: "需要 2024 年加密货币交易数据"
 *               description:
 *                 type: string
 *                 example: "需要包含 BTC, ETH, SOL 的历史交易数据"
 *               budget:
 *                 type: number
 *                 example: 100
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-11-20T00:00:00Z"
 *               requirements:
 *                 type: object
 *                 example: { "format": "CSV", "minRecords": 1000000 }
 *     responses:
 *       201:
 *         description: Request created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  try {
    // Support both JWT token (user pages) and API key (AI agents)
    let userId: string

    const authHeader = request.headers.get('authorization')
    const apiKeyHeader = request.headers.get('x-api-key')

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

    const body = await request.json()
    const { title, description, budget, deadline, requirements } = body

    // Validate required fields
    if (!title || !description || !budget || !deadline) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: title, description, budget, deadline',
          },
        },
        { status: 400 }
      )
    }

    // Validate budget
    if (budget <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_BUDGET',
            message: 'Budget must be greater than 0',
          },
        },
        { status: 400 }
      )
    }

    // Validate deadline
    const deadlineDate = new Date(deadline)
    if (deadlineDate <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DEADLINE',
            message: 'Deadline must be in the future',
          },
        },
        { status: 400 }
      )
    }

    // Create data request
    const dataRequest = await prisma.dataRequest.create({
      data: {
        buyerId: userId,
        title,
        description,
        budget,
        deadline: deadlineDate,
        requirements: requirements || {},
        status: 'pending',
      },
      include: {
        buyer: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
      },
    })

    // TODO: Upload to Irys in background
    // TODO: Notify potential providers

    return NextResponse.json(
      {
        success: true,
        request: dataRequest,
        message: 'Data request created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create request error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create request',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: List data requests
 *     description: Get all data requests with optional filters
 *     tags:
 *       - Data Requests
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, matched, in_progress, completed, cancelled, disputed]
 *       - in: query
 *         name: myRequests
 *         schema:
 *           type: boolean
 *         description: Only show requests created by the authenticated user
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of data requests
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const myRequests = searchParams.get('myRequests') === 'true'

    let userId: string | null = null

    // For "My Requests", authentication is required
    if (myRequests) {
      const authHeader = request.headers.get('authorization')
      const apiKeyHeader = request.headers.get('x-api-key')

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
              message: 'Authentication required for My Requests. Please provide Authorization header or x-api-key',
            },
          },
          { status: 401 }
        )
      }
    }

    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (myRequests && userId) {
      where.buyerId = userId
    }

    // Get requests
    const [requests, total] = await Promise.all([
      prisma.dataRequest.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              walletAddress: true,
            },
          },
          proposals: {
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              proposals: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.dataRequest.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      requests,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('List requests error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list requests',
        },
      },
      { status: 500 }
    )
  }
}

