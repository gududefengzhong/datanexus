import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/api-auth'
import { verifyPaymentToken } from '@/lib/x402-middleware'
import { z } from 'zod'

// Validation schema
const verifyPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  x402Token: z.string(),
})

/**
 * POST /api/agent/x402/verify-payment
 * Verify an x402 payment
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
    const validatedData = verifyPaymentSchema.parse(body)

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: validatedData.paymentId },
      include: {
        product: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payment not found',
          },
        },
        { status: 404 }
      )
    }

    // Verify user owns this order
    if (order.buyerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to verify this payment',
          },
        },
        { status: 403 }
      )
    }

    // Check if already completed
    if (order.status === 'completed') {
      return NextResponse.json({
        success: true,
        data: {
          verified: true,
          orderId: order.id,
          status: 'completed',
        },
      })
    }

    // Verify x402 token with x402 protocol
    console.log('🔍 Verifying x402 payment token...')

    // Get product details for verification
    const product = await prisma.dataProduct.findUnique({
      where: { id: order.productId },
      select: { price: true, name: true },
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

    const verification = await verifyPaymentToken(
      validatedData.x402Token,
      {
        price: product.price.toString(),
        network: process.env.X402_NETWORK || 'solana-devnet',
        recipient: process.env.PAYMENT_WALLET_ADDRESS!,
        facilitatorUrl: process.env.FACILITATOR_URL || 'https://facilitator.payai.network',
        description: `Purchase dataset: ${product.name}`,
      }
    )

    if (!verification.valid) {
      console.error('❌ x402 payment verification failed:', verification.error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_FAILED',
            message: verification.error || 'Invalid x402 token',
          },
        },
        { status: 400 }
      )
    }

    console.log('✅ x402 payment verified:', verification.transactionSignature)

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: validatedData.paymentId },
      data: {
        status: 'completed',
        paymentTxHash: validatedData.x402Token,
      },
    })

    // Increment purchase count
    await prisma.dataProduct.update({
      where: { id: order.productId },
      data: {
        purchases: {
          increment: 1,
        },
      },
    })

    console.log('✅ x402 payment verified:', {
      orderId: updatedOrder.id,
      productId: order.productId,
      buyerId: user.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        orderId: updatedOrder.id,
        status: updatedOrder.status,
      },
    })
  } catch (error) {
    console.error('Agent API - Verify x402 payment error:', error)

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
          message: 'Failed to verify payment',
        },
      },
      { status: 500 }
    )
  }
}

