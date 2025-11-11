import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

/**
 * Server-side decryption proxy for purchased encrypted products
 * 
 * This endpoint allows buyers to decrypt purchased products without needing
 * to be in the original access control list. The server verifies the purchase
 * and returns the decrypted data.
 * 
 * Flow:
 * 1. Buyer requests decryption
 * 2. Server verifies purchase in database
 * 3. Server decrypts using server's Solana wallet (included in access control during encryption)
 * 4. Server returns decrypted data to buyer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.userId

    // Get product
    const product = await prisma.dataProduct.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.isEncrypted) {
      return NextResponse.json(
        { error: 'Product is not encrypted' },
        { status: 400 }
      )
    }

    // Check if user is the provider (owner)
    const isOwner = product.provider.id === userId

    // Check if user has purchased the product
    const purchase = await prisma.order.findFirst({
      where: {
        productId: id,
        buyerId: userId,
        status: 'COMPLETED',
      },
    })

    const hasPurchased = !!purchase

    // User must be either the owner or have purchased the product
    if (!isOwner && !hasPurchased) {
      return NextResponse.json(
        { error: 'You must purchase this product to decrypt it' },
        { status: 403 }
      )
    }

    // TODO: Implement server-side decryption using Lit Protocol
    // For now, return an error indicating this feature is not yet implemented
    return NextResponse.json(
      {
        error: 'Server-side decryption is not yet implemented. Please use client-side decryption if you are the product owner.',
        message: 'This feature requires Lit Actions implementation. Currently, only the product owner can decrypt the data.',
        isOwner,
        hasPurchased,
      },
      { status: 501 } // 501 Not Implemented
    )
  } catch (error) {
    console.error('Decryption error:', error)
    return NextResponse.json(
      { error: 'Failed to decrypt product' },
      { status: 500 }
    )
  }
}

