import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { z } from 'zod'

// Validation schema for order confirmation
const confirmOrderSchema = z.object({
  paymentTxHash: z.string(),
  paymentNetwork: z.string(),
})

// POST /api/orders/[id]/confirm - Confirm payment for an order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Get order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify user owns this order
    if (order.buyerId !== payload.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to confirm this order' },
        { status: 403 }
      )
    }

    // Check if order is already completed
    if (order.status === 'completed') {
      return NextResponse.json(
        { error: 'Order is already completed' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = confirmOrderSchema.parse(body)

    // Update order status to completed
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'completed',
        paymentTxHash: validatedData.paymentTxHash,
        paymentNetwork: validatedData.paymentNetwork,
      },
      include: {
        product: {
          include: {
            provider: {
              select: {
                id: true,
                walletAddress: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
      },
    })

    // Increment purchase count for the product
    await prisma.dataProduct.update({
      where: { id: order.productId },
      data: {
        purchases: {
          increment: 1,
        },
      },
    })

    // Invalidate product cache to ensure fresh data is fetched
    await redis.del(`product:${order.productId}`).catch(console.error)
    console.log('🗑️ Product cache invalidated')

    console.log('✅ Order confirmed successfully:', {
      orderId: updatedOrder.id,
      productId: order.productId,
      buyer: updatedOrder.buyer.walletAddress,
      amount: updatedOrder.amount,
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Confirm order error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to confirm order' },
      { status: 500 }
    )
  }
}

