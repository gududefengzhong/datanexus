import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

/**
 * @swagger
 * /api/proposals/{id}:
 *   get:
 *     summary: Get a proposal
 *     description: Get details of a specific proposal
 *     tags:
 *       - Proposals
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
 *         description: Proposal details
 *       404:
 *         description: Proposal not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify API key
    await verifyApiKey(request)

    const { id } = await params

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            walletAddress: true,
            providerReputation: {
              select: {
                reputationScore: true,
                badges: true,
                totalSales: true,
                averageRating: true,
              },
            },
          },
        },
        request: {
          include: {
            buyer: {
              select: {
                id: true,
                walletAddress: true,
              },
            },
          },
        },
        dataset: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            irysTransactionId: true,
          },
        },
      },
    })

    if (!proposal) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Proposal not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      proposal,
    })
  } catch (error) {
    console.error('Get proposal error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get proposal',
        },
      },
      { status: 500 }
    )
  }
}

