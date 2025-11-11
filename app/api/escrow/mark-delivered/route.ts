/**
 * API: Build Mark Delivered Transaction
 * POST /api/escrow/mark-delivered - Build transaction for provider to sign
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { ANCHOR_CONFIG } from '@/lib/anchor-escrow-client'
import idl from '@/target/idl/datanexus_escrow.json'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      providerPublicKey,
      buyerPublicKey,
      requestId
    } = body

    // Validate required fields
    if (!providerPublicKey || !buyerPublicKey || !requestId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create connection and program
    const connection = new Connection(ANCHOR_CONFIG.DEVNET_RPC, 'confirmed')
    
    const provider = new AnchorProvider(
      connection,
      {} as any,
      { commitment: 'confirmed' }
    )
    
    const program = new Program(idl as any, provider)

    // Parse public keys
    const providerPubkey = new PublicKey(providerPublicKey)
    const buyer = new PublicKey(buyerPublicKey)
    
    // Calculate Escrow PDA
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('escrow'),
        buyer.toBuffer(),
        Buffer.from(requestId),
      ],
      program.programId
    )

    // Build the mark delivered instruction
    const tx = new Transaction()
    
    const markDeliveredIx = await program.methods
      .markDelivered()
      .accounts({
        provider: providerPubkey,
        escrow: escrowPda,
      })
      .instruction()

    tx.add(markDeliveredIx)

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash
    tx.feePayer = providerPubkey

    // Serialize transaction
    const serializedTx = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })

    return NextResponse.json({
      success: true,
      transaction: serializedTx.toString('base64'),
      escrowPda: escrowPda.toBase58(),
      requestId,
      message: 'Please sign the transaction in your wallet',
    })

  } catch (error: any) {
    console.error('Build mark delivered transaction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to build transaction' },
      { status: 500 }
    )
  }
}

