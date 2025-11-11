/**
 * Build unsigned cancel transaction
 * Buyer cancels order and gets full refund
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { AnchorEscrowClient, ANCHOR_CONFIG } from '@/lib/anchor-escrow-client'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token'

// Minimal wallet interface for building transactions
interface Wallet {
  publicKey: PublicKey
  signTransaction<T extends Transaction>(tx: T): Promise<T>
  signAllTransactions<T extends Transaction>(txs: T[]): Promise<T[]>
}

class NodeWallet implements Wallet {
  constructor(readonly payer: { publicKey: PublicKey }) {}

  async signTransaction<T extends Transaction>(tx: T): Promise<T> {
    return tx
  }

  async signAllTransactions<T extends Transaction>(txs: T[]): Promise<T[]> {
    return txs
  }

  get publicKey(): PublicKey {
    return this.payer.publicKey
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { buyerPublicKey, requestId } = body

    // Validate parameters
    if (!buyerPublicKey || !requestId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create connection and client
    const connection = new Connection(ANCHOR_CONFIG.DEVNET_RPC, 'confirmed')
    const buyerPubkey = new PublicKey(buyerPublicKey)

    // Create a temporary wallet for building transaction
    const tempWallet = new NodeWallet({ publicKey: buyerPubkey }) as any
    const client = new AnchorEscrowClient(connection, tempWallet)

    // Get escrow info
    const [escrowPda] = client.getEscrowPDA(buyerPubkey, requestId)

    // Get token accounts
    const escrowTokenAccount = await getAssociatedTokenAddress(
      ANCHOR_CONFIG.USDC_MINT,
      escrowPda,
      true
    )
    const buyerTokenAccount = await client.ensureTokenAccount(buyerPubkey)

    // Build the cancel instruction
    const tx = new Transaction()

    const cancelIx = await (client as any).program.methods
      .cancel()
      .accounts({
        buyer: buyerPubkey,
        escrow: escrowPda,
        escrowTokenAccount,
        buyerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction()

    tx.add(cancelIx)

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash
    tx.feePayer = buyerPubkey

    // Serialize transaction
    const serializedTx = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })

    return NextResponse.json({
      transaction: serializedTx.toString('base64'),
      escrowPda: escrowPda.toBase58(),
    })
  } catch (error: any) {
    console.error('Build cancel transaction error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to build transaction' },
      { status: 500 }
    )
  }
}

