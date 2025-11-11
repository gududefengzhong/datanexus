import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/api-auth'
import { z } from 'zod'

// Validation schema for pagination
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

/**
 * GET /api/agent/purchases
 * Get user's purchase history
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
    const validatedParams = paginationSchema.parse(searchParams)

    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit
    const take = validatedParams.limit

    // Get total count
    const total = await prisma.order.count({
      where: {
        buyerId: user.id,
        status: 'completed',
      },
    })

    // Get purchases
    const orders = await prisma.order.findMany({
      where: {
        buyerId: user.id,
        status: 'completed',
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        productId: true,
        amount: true,
        status: true,
        signature: true,
        downloadCount: true,
        lastDownloadAt: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            fileType: true,
            fileSize: true,
            isEncrypted: true,
          },
        },
      },
    })

    // Format response
    const purchases = orders.map((order) => ({
      orderId: order.id,
      datasetId: order.productId,
      datasetName: order.product.name,
      datasetDescription: order.product.description,
      datasetCategory: order.product.category,
      product: order.product,
      amount: order.amount,
      status: order.status,
      signature: order.signature,
      downloadCount: order.downloadCount,
      lastDownloadAt: order.lastDownloadAt,
      createdAt: order.createdAt,
      explorerUrl: order.signature
        ? `https://explorer.solana.com/tx/${order.signature}?cluster=devnet`
        : null,
    }))

    // Calculate total pages
    const totalPages = Math.ceil(total / validatedParams.limit)

    return NextResponse.json({
      success: true,
      data: {
        purchases,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total,
          totalPages,
        },
      },
    })
  } catch (error) {
    console.error('Agent API - Get purchases error:', error)

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
          message: 'Failed to get purchases',
        },
      },
      { status: 500 }
    )
  }
}

