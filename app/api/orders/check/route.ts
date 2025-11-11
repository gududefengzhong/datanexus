import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

/**
 * GET /api/orders/check?productId=xxx
 * Check if the current user has purchased a specific product
 */
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

    // Get productId from query params
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    // Check if user has a completed order for this product
    const order = await prisma.order.findFirst({
      where: {
        productId,
        buyerId: payload.userId,
        status: 'completed',
      },
      select: {
        id: true,
        createdAt: true,
        paymentTxHash: true,
      },
    })

    return NextResponse.json({
      hasPurchased: !!order,
      order: order || null,
    })
  } catch (error) {
    console.error('Check purchase error:', error)
    return NextResponse.json(
      { error: 'Failed to check purchase status' },
      { status: 500 }
    )
  }
}

