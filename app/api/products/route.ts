import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for product creation
const createProductSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.string().min(1),
  price: z.number().positive(),
  fileUrl: z.string().url(),
  irysTransactionId: z.string().min(1),
  fileType: z.string(),
  fileSize: z.number().positive(),
  fileName: z.string(),
  // Encryption fields (optional)
  isEncrypted: z.boolean().optional().default(false),
  // Legacy encryption (v1.0)
  ciphertext: z.string().optional(),
  dataToEncryptHash: z.string().optional(),
  accessControlConditions: z.any().optional(),
  // Encryption version and method
  encryptionVersion: z.string().optional(),
  encryptionMethod: z.string().optional(),
  // Lit Actions (v2.0)
  litActionCode: z.string().optional(),
  litActionParams: z.any().optional(),
  nftCollectionAddress: z.string().optional(),
  // Hybrid encryption (v3.0) - only encryption key stored in DB
  encryptionKeyCiphertext: z.string().optional(),
  encryptionKeyIv: z.string().optional(),
  encryptionKeyAuthTag: z.string().optional(),
})

// GET /api/products - List all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const myProducts = searchParams.get('myProducts') === 'true'

    // Build where clause
    const where: any = {}

    // Filter by current user's products
    if (myProducts) {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const token = authHeader.replace('Bearer ', '')
      const payload = await verifyToken(token)
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        )
      }

      where.providerId = payload.userId
    }

    if (category && category !== 'all' && category !== 'All Categories') {
      where.category = category
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ]
    }

    // Get total count
    const total = await prisma.dataProduct.count({ where })

    // Get products
    const products = await prisma.dataProduct.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            walletAddress: true,
            providerReputation: {
              select: {
                reputationScore: true,
                averageRating: true,
                badges: true,
              },
            },
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
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
    const validatedData = createProductSchema.parse(body)

    // Create product in database
    const product = await prisma.dataProduct.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        price: validatedData.price,
        fileUrl: validatedData.fileUrl,
        irysTransactionId: validatedData.irysTransactionId,
        fileType: validatedData.fileType,
        fileSize: validatedData.fileSize,
        fileName: validatedData.fileName,
        providerId: payload.userId,
        // Encryption fields
        isEncrypted: validatedData.isEncrypted || false,
        encryptionVersion: validatedData.encryptionVersion,
        encryptionMethod: validatedData.encryptionMethod,
        // Legacy encryption (v1.0)
        ciphertext: validatedData.ciphertext,
        dataToEncryptHash: validatedData.dataToEncryptHash,
        accessControlConditions: validatedData.accessControlConditions,
        // Lit Actions fields (v2.0)
        litActionCode: validatedData.litActionCode,
        litActionParams: validatedData.litActionParams,
        nftCollectionAddress: validatedData.nftCollectionAddress,
        // Hybrid encryption fields (v3.0) - only encryption key stored in DB
        encryptionKeyCiphertext: validatedData.encryptionKeyCiphertext,
        encryptionKeyIv: validatedData.encryptionKeyIv,
        encryptionKeyAuthTag: validatedData.encryptionKeyAuthTag,
      },
      include: {
        provider: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

