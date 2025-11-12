import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for order creation
const createOrderSchema = z.object({
  productId: z.string().uuid(),
  paymentTxHash: z.string().optional(),
  paymentNetwork: z.string().optional(),
})

// POST /api/orders - Create a new order (purchase)
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
    if (product.providerId === payload.userId) {
      return NextResponse.json(
        { error: 'You cannot purchase your own product' },
        { status: 400 }
      )
    }

    // Check if user already purchased this product
    const existingOrder = await prisma.order.findFirst({
      where: {
        productId: validatedData.productId,
        buyerId: payload.userId,
        status: 'completed',
      },
    })

    if (existingOrder) {
      return NextResponse.json(
        { error: 'You have already purchased this product' },
        { status: 400 }
      )
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        productId: validatedData.productId,
        buyerId: payload.userId,
        amount: product.price,
        status: 'pending',
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

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// GET /api/orders - Get user's orders
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // Optional filter by status

    // Build where clause
    const whereClause: any = {
      buyerId: payload.userId,
    }

    // If status is specified, filter by it; otherwise only show completed orders
    if (status) {
      whereClause.status = status
    } else {
      whereClause.status = 'completed' // Default: only show completed orders
    }

    // Get orders
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            fileUrl: true,
            fileName: true,
            fileType: true,
            isEncrypted: true,
            encryptionMethod: true,
            providerId: true,
            provider: {
              select: {
                id: true,
                walletAddress: true,
              },
            },
          },
        },
        rating: {
          select: {
            id: true,
            rating: true,
            comment: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

