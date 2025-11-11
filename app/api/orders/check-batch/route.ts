import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

/**
 * POST /api/orders/check-batch
 * Check if the current user has purchased multiple products
 * Body: { productIds: string[] }
 */
export async function POST(request: NextRequest) {
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

    // Get productIds from request body
    const body = await request.json()
    const { productIds } = body

    if (!Array.isArray(productIds)) {
      return NextResponse.json({ error: 'productIds must be an array' }, { status: 400 })
    }

    // Get all completed orders for these products
    const orders = await prisma.order.findMany({
      where: {
        productId: { in: productIds },
        buyerId: payload.userId,
        status: 'completed',
      },
      select: {
        productId: true,
      },
    })

    // Create a map of productId -> hasPurchased
    const purchasedMap: Record<string, boolean> = {}
    productIds.forEach((id) => {
      purchasedMap[id] = false
    })
    orders.forEach((order) => {
      purchasedMap[order.productId] = true
    })

    return NextResponse.json({
      purchases: purchasedMap,
    })
  } catch (error) {
    console.error('Check batch purchase error:', error)
    return NextResponse.json(
      { error: 'Failed to check purchase status' },
      { status: 500 }
    )
  }
}

