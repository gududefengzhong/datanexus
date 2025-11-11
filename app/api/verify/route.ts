import { NextRequest, NextResponse } from 'next/server'
import { verifyDataIntegrity } from '@/lib/onchain-reputation'

/**
 * @swagger
 * /api/verify:
 *   get:
 *     summary: Verify data integrity from Irys
 *     description: Verify that data on Irys matches the expected hash stored on Solana
 *     tags:
 *       - Verification
 *     parameters:
 *       - in: query
 *         name: irysId
 *         required: true
 *         schema:
 *           type: string
 *         description: Irys transaction ID
 *       - in: query
 *         name: expectedHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Expected SHA-256 hash
 *     responses:
 *       200:
 *         description: Verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isValid:
 *                   type: boolean
 *                 irysId:
 *                   type: string
 *                 expectedHash:
 *                   type: string
 *                 actualHash:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const irysId = searchParams.get('irysId')
    const expectedHash = searchParams.get('expectedHash')

    if (!irysId || !expectedHash) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required parameters: irysId, expectedHash',
          },
        },
        { status: 400 }
      )
    }

    const isValid = await verifyDataIntegrity(irysId, expectedHash)

    return NextResponse.json({
      success: true,
      isValid,
      irysId,
      expectedHash,
      message: isValid
        ? 'Data integrity verified successfully'
        : 'Data integrity verification failed - data may have been tampered with',
    })
  } catch (error) {
    console.error('Verification error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to verify data',
        },
      },
      { status: 500 }
    )
  }
}

