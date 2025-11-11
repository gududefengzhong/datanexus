/**
 * API: Confirm resolve dispute transaction
 * POST /api/escrow/resolve-dispute/confirm
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection } from '@solana/web3.js'
import { ANCHOR_CONFIG } from '@/lib/anchor-escrow-client'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { signature, escrowPda, requestId, refundToBuyer } = body

    if (!signature || !escrowPda || !requestId || refundToBuyer === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify transaction on-chain
    const connection = new Connection(ANCHOR_CONFIG.DEVNET_RPC, 'confirmed')
    const txInfo = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    })

    if (!txInfo || txInfo.meta?.err) {
      return NextResponse.json(
        { error: 'Transaction failed or not found' },
        { status: 400 }
      )
    }

    // Update escrow status based on refund decision
    const newStatus = refundToBuyer ? 'refunded' : 'completed'

    await prisma.$transaction([
      prisma.escrow.update({
        where: { escrowPda },
        data: {
          status: newStatus,
        },
      }),
      prisma.dataRequest.update({
        where: { id: requestId },
        data: {
          status: refundToBuyer ? 'cancelled' : 'completed',
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      signature,
      status: newStatus,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    })
  } catch (error: any) {
    console.error('Confirm resolve dispute error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to confirm resolve dispute' },
      { status: 500 }
    )
  }
}

