import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/api-auth'
import { verifyPaymentToken } from '@/lib/x402-middleware'
import { z } from 'zod'

// Validation schema for purchase request
const purchaseSchema = z.object({
  paymentMethod: z.enum(['solana', 'x402']),
  paymentTxHash: z.string().optional(),
  x402Token: z.string().optional(),
})

/**
 * POST /api/agent/datasets/:id/purchase
 * Purchase a dataset
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: productId } = await params

    // Get dataset
    const product = await prisma.dataProduct.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        providerId: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Dataset not found',
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
        productId,
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = purchaseSchema.parse(body)

    // Validate payment method specific fields
    if (validatedData.paymentMethod === 'solana' && !validatedData.paymentTxHash) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'paymentTxHash is required for Solana payment',
          },
        },
        { status: 400 }
      )
    }

    if (validatedData.paymentMethod === 'x402' && !validatedData.x402Token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'x402Token is required for x402 payment',
          },
        },
        { status: 400 }
      )
    }

    // Verify x402 payment if using x402 method
    if (validatedData.paymentMethod === 'x402' && validatedData.x402Token) {
      console.log('🔍 Verifying x402 payment...')

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
              code: 'PAYMENT_VERIFICATION_FAILED',
              message: verification.error || 'Invalid x402 payment token',
            },
          },
          { status: 400 }
        )
      }

      console.log('✅ x402 payment verified:', verification.transactionSignature)
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        productId,
        buyerId: user.id,
        amount: product.price,
        status: 'completed',
        paymentTxHash: validatedData.paymentTxHash || validatedData.x402Token || null,
        paymentNetwork: validatedData.paymentMethod,
      },
      select: {
        id: true,
        productId: true,
        amount: true,
        status: true,
        paymentTxHash: true,
        createdAt: true,
      },
    })

    // Increment purchase count
    await prisma.dataProduct.update({
      where: { id: productId },
      data: {
        purchases: {
          increment: 1,
        },
      },
    })

    console.log('✅ Agent purchase completed:', {
      orderId: order.id,
      productId,
      buyerId: user.id,
      amount: product.price,
      paymentMethod: validatedData.paymentMethod,
    })

    return NextResponse.json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error('Agent API - Purchase dataset error:', error)

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
          message: 'Failed to purchase dataset',
        },
      },
      { status: 500 }
    )
  }
}

