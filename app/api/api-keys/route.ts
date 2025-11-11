import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, generateApiKey } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Validation schema for API key creation
const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).default(['read', 'purchase']),
})

// GET /api/api-keys - Get user's API keys
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

    // Get API keys (without showing the actual key)
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: payload.userId,
      },
      select: {
        id: true,
        name: true,
        keyHash: true,
        keyPrefix: true,  // Include prefix for display
        permissions: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error('Get API keys error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// POST /api/api-keys - Create a new API key
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
    const validatedData = createApiKeySchema.parse(body)

    // Generate a random API key
    const apiKey = `sk_${Buffer.from(`${payload.userId}-${Date.now()}-${Math.random()}`).toString('base64').slice(0, 32)}`

    // Extract prefix for display (first 10 characters)
    const keyPrefix = apiKey.substring(0, 10)

    // Hash the API key before storing
    const keyHash = await bcrypt.hash(apiKey, 10)

    // Create API key in database
    const createdKey = await prisma.apiKey.create({
      data: {
        userId: payload.userId,
        name: validatedData.name,
        keyHash,
        keyPrefix,  // Store prefix for display
        permissions: validatedData.permissions,
      },
    })

    // Return the API key (only time it will be shown)
    return NextResponse.json({
      id: createdKey.id,
      key: apiKey, // Only returned once!
      name: createdKey.name,
      permissions: createdKey.permissions,
      createdAt: createdKey.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Create API key error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}

