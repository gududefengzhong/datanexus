/**
 * API: Confirm Mark Delivered Transaction
 * POST /api/escrow/mark-delivered/confirm
 * Called after provider signs the transaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection } from '@solana/web3.js'
import { ANCHOR_CONFIG } from '@/lib/anchor-escrow-client'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      signature,
      escrowPda,
      requestId
    } = body

    // Validate required fields
    if (!signature || !escrowPda || !requestId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify transaction on-chain
    const connection = new Connection(ANCHOR_CONFIG.DEVNET_RPC, 'confirmed')
    
    try {
      const txInfo = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      })

      if (!txInfo) {
        return NextResponse.json(
          { error: 'Transaction not found on-chain' },
          { status: 400 }
        )
      }

      if (txInfo.meta?.err) {
        return NextResponse.json(
          { error: 'Transaction failed on-chain' },
          { status: 400 }
        )
      }
    } catch (err) {
      console.error('Transaction verification error:', err)
      return NextResponse.json(
        { error: 'Failed to verify transaction' },
        { status: 500 }
      )
    }

    // Update database
    await prisma.escrow.updateMany({
      where: {
        requestId,
        escrowPda,
      },
      data: {
        status: 'delivered',
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      signature,
      status: 'delivered',
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    })

  } catch (error: any) {
    console.error('Confirm mark delivered error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to confirm mark delivered' },
      { status: 500 }
    )
  }
}

