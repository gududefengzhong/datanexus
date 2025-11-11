import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/products/my-products - Get current user's products
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '6')
    const offset = (page - 1) * limit

    // Get total count for stats
    const allProducts = await prisma.dataProduct.findMany({
      where: {
        providerId: payload.userId,
      },
    })

    // Calculate stats from all products
    const stats = {
      totalProducts: allProducts.length,
      totalSales: allProducts.reduce((sum: number, p: any) => sum + p.purchases, 0),
      totalRevenue: allProducts.reduce((sum: number, p: any) => sum + p.price * p.purchases, 0),
      totalViews: allProducts.reduce((sum: number, p: any) => sum + p.views, 0),
    }

    // Get paginated products
    const products = await prisma.dataProduct.findMany({
      where: {
        providerId: payload.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    })

    // Calculate pagination info
    const totalPages = Math.ceil(allProducts.length / limit)

    return NextResponse.json({
      success: true,
      products,
      stats,
      pagination: {
        page,
        limit,
        total: allProducts.length,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Get my products error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch products',
        },
      },
      { status: 500 }
    )
  }
}

