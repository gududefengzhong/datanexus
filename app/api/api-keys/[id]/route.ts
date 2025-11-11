import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// DELETE /api/api-keys/[id] - Delete an API key
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

    const resolvedParams = await params
    const apiKeyId = resolvedParams.id

    // Check if API key exists and belongs to user
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    })

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    if (apiKey.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this API key' },
        { status: 403 }
      )
    }

    // Delete API key
    await prisma.apiKey.delete({
      where: { id: apiKeyId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete API key error:', error)
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    )
  }
}

