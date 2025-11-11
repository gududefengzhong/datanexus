/**
 * API: Build unsigned resolve dispute transaction
 * POST /api/escrow/resolve-dispute
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { AnchorEscrowClient, ANCHOR_CONFIG } from '@/lib/anchor-escrow-client'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token'

class NodeWallet {
  constructor(readonly publicKey: PublicKey) {}
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platformPublicKey, requestId, refundToBuyer } = body

    if (!platformPublicKey || !requestId || refundToBuyer === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create connection and client
    const connection = new Connection(ANCHOR_CONFIG.DEVNET_RPC, 'confirmed')
    const platformPubkey = new PublicKey(platformPublicKey)
    
    const tempWallet = new NodeWallet(platformPubkey)
    const client = new AnchorEscrowClient(connection, tempWallet)

    // Get escrow info from database
    const { prisma } = await import('@/lib/prisma')
    const escrowRecord = await prisma.escrow.findFirst({
      where: { requestId },
    })

    if (!escrowRecord) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })
    }

    const buyerPubkey = new PublicKey(escrowRecord.buyer)
    const providerPubkey = new PublicKey(escrowRecord.provider)

    // Get escrow PDA
    const [escrowPda] = client.getEscrowPDA(buyerPubkey, requestId)

    // Get token accounts
    const escrowTokenAccount = await getAssociatedTokenAddress(
      ANCHOR_CONFIG.USDC_MINT,
      escrowPda,
      true
    )
    const buyerTokenAccount = await client.ensureTokenAccount(buyerPubkey)
    const providerTokenAccount = await client.ensureTokenAccount(providerPubkey)
    const platformTokenAccount = await client.ensureTokenAccount(platformPubkey)

    // Build the resolve dispute instruction
    const tx = new Transaction()
    const resolveIx = await client.program.methods
      .resolveDispute(refundToBuyer)
      .accounts({
        platform: platformPubkey,
        escrow: escrowPda,
        escrowTokenAccount,
        buyerTokenAccount,
        providerTokenAccount,
        platformTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction()

    tx.add(resolveIx)

    // Get recent blockhash and serialize
    const { blockhash } = await connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash
    tx.feePayer = platformPubkey

    const serializedTx = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })

    return NextResponse.json({
      transaction: serializedTx.toString('base64'),
      escrowPda: escrowPda.toBase58(),
      refundToBuyer,
    })
  } catch (error: any) {
    console.error('Build resolve dispute transaction error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to build transaction' },
      { status: 500 }
    )
  }
}

