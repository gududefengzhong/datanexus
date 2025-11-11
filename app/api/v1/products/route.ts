import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKeyFromRequest, hasPermission, checkRateLimit } from '@/lib/api-auth'

/**
 * Public API v1 - Products Endpoint
 * 
 * This endpoint is designed for AI agents and programmatic access.
 * Requires API key authentication via X-API-Key header.
 */

// GET /api/v1/products - List all products
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}

    if (category && category !== 'all') {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await prisma.dataProduct.count({ where })

    // Get products
    const products = await prisma.dataProduct.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        fileType: true,
        fileSize: true,
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
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json(
      {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        },
      }
    )
  } catch (error) {
    console.error('API v1 - Get products error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

