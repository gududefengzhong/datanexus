import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/api-auth'
import { z } from 'zod'

// Validation schema
const createPaymentSchema = z.object({
  productId: z.string().uuid(),
  amount: z.number().positive(),
})

/**
 * POST /api/agent/x402/create-payment
 * Create an x402 payment request
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)

    // Get product
    const product = await prisma.dataProduct.findUnique({
      where: { id: validatedData.productId },
      select: {
        id: true,
        name: true,
        price: true,
        providerId: true,
        provider: {
          select: {
            walletAddress: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
      )
    }

    // Check if user is the provider
    if (product.providerId === user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You cannot purchase your own dataset',
          },
        },
        { status: 403 }
      )
    }

    // Check if already purchased
    const existingOrder = await prisma.order.findFirst({
      where: {
        productId: validatedData.productId,
        buyerId: user.id,
        status: 'completed',
      },
    })

    if (existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_PURCHASED',
            message: 'You have already purchased this dataset',
          },
        },
        { status: 400 }
      )
    }

    // Create pending order
    const order = await prisma.order.create({
      data: {
        productId: validatedData.productId,
        buyerId: user.id,
        amount: product.price,
        status: 'pending',
        paymentNetwork: 'x402',
      },
    })

    // Generate x402 payment URL
    // In production, this would integrate with the actual x402 protocol
    // For now, we'll create a placeholder
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const x402Url = `${baseUrl}/api/agent/x402/pay/${order.id}`

    // Set expiration time (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    console.log('✅ x402 payment created:', {
      orderId: order.id,
      productId: validatedData.productId,
      amount: product.price,
      recipient: product.provider.walletAddress,
    })

    return NextResponse.json({
      success: true,
      data: {
        paymentId: order.id,
        x402Url,
        amount: product.price,
        recipient: product.provider.walletAddress,
        expiresAt: expiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Agent API - Create x402 payment error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
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
          message: 'Failed to create payment',
        },
      },
      { status: 500 }
    )
  }
}

