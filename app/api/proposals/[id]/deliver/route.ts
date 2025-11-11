import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

/**
 * @swagger
 * /api/proposals/{id}/deliver:
 *   post:
 *     summary: Deliver data for a proposal
 *     description: Provider delivers the data for an accepted proposal
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - datasetId
 *             properties:
 *               datasetId:
 *                 type: string
 *                 example: "dataset123"
 *               deliveryProof:
 *                 type: string
 *                 example: "https://gateway.irys.xyz/proof123"
 *     responses:
 *       200:
 *         description: Data delivered successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Proposal not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify API key
    const user = await verifyApiKey(request)

    const { id } = await params
    const body = await request.json()
    const { datasetId, deliveryProof } = body

    // Validate required fields
    if (!datasetId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required field: datasetId',
          },
        },
        { status: 400 }
      )
    }

    // Get proposal
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        request: true,
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

    // Check if user is the provider
    if (proposal.providerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only the provider can deliver data',
          },
        },
        { status: 403 }
      )
    }

    // Check if proposal is accepted
    if (proposal.status !== 'accepted') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Proposal must be accepted before delivery',
          },
        },
        { status: 400 }
      )
    }

    // Check if dataset exists and belongs to provider
    const dataset = await prisma.dataProduct.findUnique({
      where: { id: datasetId },
    })

    if (!dataset) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATASET_NOT_FOUND',
            message: 'Dataset not found',
          },
        },
        { status: 404 }
      )
    }

    if (dataset.providerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Dataset does not belong to you',
          },
        },
        { status: 403 }
      )
    }

    // Update proposal
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: 'delivered',
        datasetId,
        deliveryProof,
        deliveredAt: new Date(),
      },
      include: {
        dataset: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            irysTransactionId: true,
          },
        },
        request: {
          select: {
            id: true,
            title: true,
            buyer: {
              select: {
                id: true,
                walletAddress: true,
              },
            },
          },
        },
      },
    })

    // TODO: Upload delivery proof to Irys
    // TODO: Notify buyer

    return NextResponse.json({
      success: true,
      proposal: updatedProposal,
      message: 'Data delivered successfully. Waiting for buyer confirmation.',
    })
  } catch (error) {
    console.error('Deliver proposal error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to deliver data',
        },
      },
      { status: 500 }
    )
  }
}

