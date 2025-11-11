import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKeyFromRequest, hasPermission, checkRateLimit } from '@/lib/api-auth'
import { z } from 'zod'

/**
 * Public API v1 - Orders Endpoint
 */

// Validation schema for order creation
const createOrderSchema = z.object({
  productId: z.string().uuid(),
  paymentTxHash: z.string(),
  paymentNetwork: z.string().default('solana-devnet'),
})

// POST /api/v1/orders - Create a new order (purchase)
export async function POST(request: NextRequest) {
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
    if (!hasPermission(auth.permissions!, 'purchase')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required: purchase' },
        { status: 403 }
      )
    }

    // Check rate limit (stricter for purchases)
    const rateLimit = checkRateLimit(auth.userId!, 10, 60000) // 10 per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          resetAt: new Date(rateLimit.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          },
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)

    // Get product
    const product = await prisma.dataProduct.findUnique({
      where: { id: validatedData.productId },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if user is trying to buy their own product
    if (product.providerId === auth.userId) {
      return NextResponse.json(
        { error: 'You cannot purchase your own product' },
        { status: 400 }
      )
    }

    // Check if user already purchased this product
    const existingOrder = await prisma.order.findFirst({
      where: {
        productId: validatedData.productId,
        buyerId: auth.userId,
        status: 'completed',
      },
    })

    if (existingOrder) {
      return NextResponse.json(
        {
          error: 'You have already purchased this product',
          orderId: existingOrder.id,
        },
        { status: 400 }
      )
    }

    // Create order with completed status (payment already done)
    const order = await prisma.order.create({
      data: {
        productId: validatedData.productId,
        buyerId: auth.userId!,
        amount: product.price,
        status: 'completed',
        paymentTxHash: validatedData.paymentTxHash,
        paymentNetwork: validatedData.paymentNetwork,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            fileUrl: true,
            irysTransactionId: true,
          },
        },
      },
    })

    // Increment purchase count
    await prisma.dataProduct.update({
      where: { id: validatedData.productId },
      data: {
        purchases: { increment: 1 },
      },
    })

    return NextResponse.json(
      {
        order: {
          id: order.id,
          productId: order.productId,
          amount: order.amount,
          status: order.status,
          paymentTxHash: order.paymentTxHash,
          downloadUrl: order.product.fileUrl,
          createdAt: order.createdAt,
        },
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        },
      }
    )
  } catch (error) {
    console.error('API v1 - Create order error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/v1/orders - Get user's orders
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

    // Get orders
    const orders = await prisma.order.findMany({
      where: {
        buyerId: auth.userId,
      },
      select: {
        id: true,
        productId: true,
        amount: true,
        status: true,
        paymentTxHash: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            fileUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(
      { orders },
      {
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        },
      }
    )
  } catch (error) {
    console.error('API v1 - Get orders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

