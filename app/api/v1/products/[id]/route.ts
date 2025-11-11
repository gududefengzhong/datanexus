import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKeyFromRequest, hasPermission, checkRateLimit } from '@/lib/api-auth'

/**
 * Public API v1 - Product Detail Endpoint
 */

// GET /api/v1/products/[id] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify API key
    const auth = await verifyApiKeyFromRequest(request)

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    if (!hasPermission(auth.permissions!, 'read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required: read' },
        { status: 403 }
      )
    }

    // Check rate limit
    const rateLimit = checkRateLimit(auth.userId!)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          resetAt: new Date(rateLimit.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          },
        }
      )
    }

    const { id } = await params

    // Get product
    const product = await prisma.dataProduct.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        fileUrl: true,
        irysTransactionId: true,
        fileType: true,
        fileSize: true,
        fileName: true,
        views: true,
        purchases: true,
        provider: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Increment view count
    await prisma.dataProduct.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json(
      { product },
      {
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        },
      }
    )
  } catch (error) {
    console.error('API v1 - Get product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

