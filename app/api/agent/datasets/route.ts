import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/api-auth'
import { z } from 'zod'

// Validation schema for search parameters
const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['price', 'views', 'purchases', 'createdAt']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

/**
 * @swagger
 * /api/agent/datasets:
 *   get:
 *     summary: Search and filter datasets
 *     description: Get a list of datasets with optional filtering and pagination
 *     tags: [Datasets]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for name and description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, views, purchases, createdAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     datasets:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Dataset'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API key
    const apiKeyHeader = request.headers.get('authorization')
    if (!apiKeyHeader || !apiKeyHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'API key is required',
          },
        },
        { status: 401 }
      )
    }

    const apiKey = apiKeyHeader.substring(7)
    const user = await verifyApiKey(apiKey)

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

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const validatedParams = searchSchema.parse(searchParams)

    // Build where clause
    const where: any = {}

    if (validatedParams.q) {
      where.OR = [
        { name: { contains: validatedParams.q, mode: 'insensitive' } },
        { description: { contains: validatedParams.q, mode: 'insensitive' } },
      ]
    }

    if (validatedParams.category) {
      where.category = validatedParams.category
    }

    if (validatedParams.minPrice !== undefined || validatedParams.maxPrice !== undefined) {
      where.price = {}
      if (validatedParams.minPrice !== undefined) {
        where.price.gte = validatedParams.minPrice
      }
      if (validatedParams.maxPrice !== undefined) {
        where.price.lte = validatedParams.maxPrice
      }
    }

    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit
    const take = validatedParams.limit

    // Get total count
    const total = await prisma.dataProduct.count({ where })

    // Get datasets
    const datasets = await prisma.dataProduct.findMany({
      where,
      skip,
      take,
      orderBy: {
        [validatedParams.sortBy]: validatedParams.order,
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        fileType: true,
        fileSize: true,
        isEncrypted: true,
        views: true,
        purchases: true,
        createdAt: true,
        provider: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
      },
    })

    // Calculate total pages
    const totalPages = Math.ceil(total / validatedParams.limit)

    return NextResponse.json({
      success: true,
      data: {
        datasets,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total,
          totalPages,
        },
      },
    })
  } catch (error) {
    console.error('Agent API - Search datasets error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search datasets',
        },
      },
      { status: 500 }
    )
  }
}

