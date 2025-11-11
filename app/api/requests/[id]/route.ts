import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     summary: Get a data request
 *     description: Get details of a specific data request
 *     tags:
 *       - Data Requests
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request details
 *       404:
 *         description: Request not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify API key
    await verifyApiKey(request)

    const { id } = await params

    const dataRequest = await prisma.dataRequest.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
        proposals: {
          include: {
            provider: {
              select: {
                id: true,
                walletAddress: true,
                providerReputation: {
                  select: {
                    reputationScore: true,
                    badges: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!dataRequest) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Request not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      request: dataRequest,
    })
  } catch (error) {
    console.error('Get request error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get request',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/requests/{id}:
 *   patch:
 *     summary: Update a data request
 *     description: Update request status or cancel request
 *     tags:
 *       - Data Requests
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [cancelled]
 *     responses:
 *       200:
 *         description: Request updated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Request not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify API key
    const user = await verifyApiKey(request)

    const { id } = await params
    const body = await request.json()
    const { status } = body

    // Get request
    const dataRequest = await prisma.dataRequest.findUnique({
      where: { id },
    })

    if (!dataRequest) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Request not found',
          },
        },
        { status: 404 }
      )
    }

    // Check ownership
    if (dataRequest.buyerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own requests',
          },
        },
        { status: 403 }
      )
    }

    // Only allow cancellation for now
    if (status !== 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Only cancellation is allowed',
          },
        },
        { status: 400 }
      )
    }

    // Cannot cancel if already completed or in progress
    if (['completed', 'in_progress'].includes(dataRequest.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: 'Cannot cancel request in current state',
          },
        },
        { status: 400 }
      )
    }

    // Update request
    const updatedRequest = await prisma.dataRequest.update({
      where: { id },
      data: { status },
      include: {
        buyer: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: 'Request updated successfully',
    })
  } catch (error) {
    console.error('Update request error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update request',
        },
      },
      { status: 500 }
    )
  }
}

