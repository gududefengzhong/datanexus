import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { redis, redisHelpers } from '@/lib/redis'

// GET /api/products/[id] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to get from cache first
    const cached = await redisHelpers.getProduct(id)
    if (cached) {
      // Increment view count asynchronously
      redisHelpers.incrementViews(id).catch(console.error)
      return NextResponse.json(cached)
    }

    // Get from database
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

    // Update view count in database
    await prisma.dataProduct.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    // Cache the product
    await redisHelpers.cacheProduct(id, product)

    // Increment view count in Redis
    await redisHelpers.incrementViews(id)

    return NextResponse.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PATCH /api/products/[id] - Update a product
export async function PATCH(
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

    // Check if product exists and user owns it
    const existingProduct = await prisma.dataProduct.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (existingProduct.providerId !== payload.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this product' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Only allow updating certain fields
    const allowedUpdates = {
      name: body.name,
      description: body.description,
      category: body.category,
      price: body.price,
    }

    // Remove undefined values
    const updates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, v]) => v !== undefined)
    )

    // Update product
    const product = await prisma.dataProduct.update({
      where: { id },
      data: updates,
      include: {
        provider: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
      },
    })

    // Invalidate cache
    await redis.del(`product:${id}`)

    return NextResponse.json(product)
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
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

    // Check if product exists and user owns it
    const existingProduct = await prisma.dataProduct.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (existingProduct.providerId !== payload.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this product' },
        { status: 403 }
      )
    }

    // Delete product
    await prisma.dataProduct.delete({
      where: { id },
    })

    // Invalidate cache
    await redis.del(`product:${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}

