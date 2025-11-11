import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/api-auth'

/**
 * GET /api/agent/datasets/:id
 * Get dataset details
 */
export async function GET(
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

    const { id } = await params

    // Get dataset
    const dataset = await prisma.dataProduct.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        fileUrl: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        isEncrypted: true,
        encryptionMethod: true,
        views: true,
        purchases: true,
        createdAt: true,
        updatedAt: true,
        provider: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
      },
    })

    if (!dataset) {
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

    // Increment view count
    await prisma.dataProduct.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: dataset,
    })
  } catch (error) {
    console.error('Agent API - Get dataset error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get dataset',
        },
      },
      { status: 500 }
    )
  }
}

