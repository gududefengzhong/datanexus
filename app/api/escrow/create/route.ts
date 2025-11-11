/**
 * API: Build Escrow Transaction
 * POST /api/escrow/create - Build transaction for frontend to sign
 * POST /api/escrow/confirm - Confirm transaction after signing
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js'
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor'
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token'
import { ANCHOR_CONFIG } from '@/lib/anchor-escrow-client'
import { prisma } from '@/lib/prisma'
import idl from '@/target/idl/datanexus_escrow.json'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      buyerPublicKey,
      providerPublicKey,
      amount,
      requestId,
      proposalId
    } = body

    // Validate required fields
    if (!buyerPublicKey || !providerPublicKey || !amount || !requestId || !proposalId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Load platform keypair
    const platformSecretKey = process.env.PLATFORM_WALLET_SECRET_KEY
    if (!platformSecretKey) {
      return NextResponse.json(
        { error: 'Platform wallet not configured' },
        { status: 500 }
      )
    }

    const platformKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(platformSecretKey))
    )

    // Create connection and program
    const connection = new Connection(ANCHOR_CONFIG.DEVNET_RPC, 'confirmed')

    // Create a minimal provider
    const provider = new AnchorProvider(
      connection,
      {} as any,
      { commitment: 'confirmed' }
    )

    const program = new Program(idl as any, provider)

    // Parse public keys
    const buyer = new PublicKey(buyerPublicKey)
    const provider_pubkey = new PublicKey(providerPublicKey)
    const platform = platformKeypair.publicKey

    // Calculate Escrow PDA
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('escrow'),
        buyer.toBuffer(),
        Buffer.from(requestId),
      ],
      program.programId
    )

    // Get token accounts
    const buyerTokenAccount = await getAssociatedTokenAddress(
      ANCHOR_CONFIG.USDC_MINT,
      buyer
    )

    const escrowTokenAccount = await getAssociatedTokenAddress(
      ANCHOR_CONFIG.USDC_MINT,
      escrowPda,
      true
    )

    // Convert amount to lamports (USDC has 6 decimals)
    const amountLamports = new BN(parseFloat(amount) * 1_000_000)

    // Create transaction
    const tx = new Transaction()

    // Check if escrow token account exists, if not, add instruction to create it
    const escrowTokenAccountInfo = await connection.getAccountInfo(escrowTokenAccount)
    if (!escrowTokenAccountInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          buyer, // payer
          escrowTokenAccount, // ata
          escrowPda, // owner
          ANCHOR_CONFIG.USDC_MINT, // mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      )
    }

    // Add the create escrow instruction
    const createEscrowIx = await program.methods
      .createEscrow(
        amountLamports,
        requestId,
        proposalId
      )
      .accounts({
        buyer,
        provider: provider_pubkey,
        platform,
        escrow: escrowPda,
        buyerTokenAccount,
        escrowTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: new PublicKey('11111111111111111111111111111111'),
      })
      .instruction()

    tx.add(createEscrowIx)

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash
    tx.feePayer = buyer

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
      proposalId,
      message: 'Please sign the transaction in your wallet',
    })

  } catch (error: any) {
    console.error('Build escrow transaction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to build transaction' },
      { status: 500 }
    )
  }
}

