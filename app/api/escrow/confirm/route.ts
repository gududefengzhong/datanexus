/**
 * API: Confirm Escrow Transaction
 * POST /api/escrow/confirm
 * Called after user signs the transaction
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
      buyerPublicKey,
      providerPublicKey,
      amount,
      requestId,
      proposalId
    } = body

    // Validate required fields
    if (!signature || !escrowPda || !buyerPublicKey || !providerPublicKey || !amount || !requestId || !proposalId) {
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

    // Save to database and update related status
    await prisma.$transaction([
      // Create Escrow record
      prisma.escrow.create({
        data: {
          escrowPda,
          buyer: buyerPublicKey,
          provider: providerPublicKey,
          platform: process.env.PLATFORM_WALLET_PUBLIC_KEY || '',
          amount: parseFloat(amount),
          requestId,
          proposalId,
          status: 'funded',
          signature,
        },
      }),

      // Update proposal status
      prisma.proposal.update({
        where: { id: proposalId },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
        },
      }),

      // Update request status
      prisma.dataRequest.update({
        where: { id: requestId },
        data: {
          status: 'in_progress',
        },
      }),

      // Reject other pending proposals for the same request
      prisma.proposal.updateMany({
        where: {
          requestId,
          id: { not: proposalId },
          status: 'pending',
        },
        data: {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: 'Another proposal was accepted',
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      escrowPda,
      signature,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    })

  } catch (error: any) {
    console.error('Confirm escrow error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to confirm escrow' },
      { status: 500 }
    )
  }
}

