/**
 * x402 Payment Integration
 *
 * Payment flow using USDC SPL tokens:
 * 1. User clicks "Purchase"
 * 2. Connect wallet (already done)
 * 3. Create USDC token transfer transaction
 * 4. Sign and send transaction
 * 5. Backend verifies payment via x402 protocol
 * 6. Download granted upon verification
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

export interface PaymentRequest {
  productId: string
  productName: string
  amount: number // in USDC
  recipientAddress: string
}

export interface PaymentResult {
  success: boolean
  txHash?: string
  error?: string
}

/**
 * Initiate a USDC token payment for a product
 *
 * This function:
 * 1. Gets the USDC mint address (Devnet or Mainnet)
 * 2. Finds or creates Associated Token Accounts (ATAs) for sender and recipient
 * 3. Creates a USDC transfer transaction
 * 4. Signs and sends the transaction
 */
export async function initiatePayment(
  request: PaymentRequest,
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<PaymentResult> {
  try {
    console.log('💰 Initiating USDC payment...')
    console.log('   Amount:', request.amount, 'USDC')
    console.log('   Recipient:', request.recipientAddress)

    // Connect to Solana
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    )

    // USDC Mint Address
    // Devnet: Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
    // Mainnet: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
    const usdcMintAddress = new PublicKey(
      process.env.NEXT_PUBLIC_USDC_MINT || 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'
    )

    // Create recipient public key
    const recipientPubkey = new PublicKey(request.recipientAddress)

    // Get Associated Token Addresses (ATAs)
    const senderTokenAccount = await getAssociatedTokenAddress(
      usdcMintAddress,
      walletPublicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )

    const recipientTokenAccount = await getAssociatedTokenAddress(
      usdcMintAddress,
      recipientPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )

    console.log('   Sender Token Account:', senderTokenAccount.toBase58())
    console.log('   Recipient Token Account:', recipientTokenAccount.toBase58())

    // Check if sender has USDC token account
    const senderAccountInfo = await connection.getAccountInfo(senderTokenAccount)

    if (!senderAccountInfo) {
      console.error('❌ Sender does not have a USDC token account')
      return {
        success: false,
        error: 'You do not have a USDC token account. Please create one first or get some USDC from a faucet.',
      }
    }

    console.log('   ✅ Sender has USDC token account')

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()

    // Create transaction
    const transaction = new Transaction({
      feePayer: walletPublicKey,
      recentBlockhash: blockhash,
    })

    // Check if recipient token account exists
    const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount)

    if (!recipientAccountInfo) {
      console.log('   ⚠️  Recipient does not have USDC token account')
      console.log('   Creating recipient token account...')
      // Create recipient's associated token account if it doesn't exist
      transaction.add(
        createAssociatedTokenAccountInstruction(
          walletPublicKey, // payer
          recipientTokenAccount, // associated token account
          recipientPubkey, // owner
          usdcMintAddress, // mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      )
    } else {
      console.log('   ✅ Recipient has USDC token account')
    }

    // USDC has 6 decimals, so multiply by 10^6
    const usdcAmount = Math.floor(request.amount * 1_000_000)
    console.log('   Transfer amount (raw):', usdcAmount)

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        senderTokenAccount, // source
        recipientTokenAccount, // destination
        walletPublicKey, // owner
        usdcAmount, // amount (in smallest unit)
        [], // multi-signers (none)
        TOKEN_PROGRAM_ID
      )
    )

    console.log('   Signing transaction...')
    // Sign transaction with wallet
    const signedTransaction = await signTransaction(transaction)

    console.log('   Sending transaction...')
    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      }
    )

    console.log('   Transaction sent:', signature)
    console.log('   Waiting for confirmation...')

    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed')

    console.log('✅ Payment successful!')
    console.log('   Signature:', signature)

    return {
      success: true,
      txHash: signature,
    }
  } catch (error) {
    console.error('❌ Payment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed',
    }
  }
}

/**
 * Verify a payment transaction
 * This would be called by the backend to verify the payment before confirming the order
 */
export async function verifyPayment(
  txHash: string,
  expectedAmount: number,
  expectedRecipient: string
): Promise<boolean> {
  try {
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    )

    // Get transaction details
    const tx = await connection.getTransaction(txHash, {
      maxSupportedTransactionVersion: 0,
    })

    if (!tx || !tx.meta) {
      return false
    }

    // Verify transaction was successful
    if (tx.meta.err) {
      return false
    }

    // For MVP: Basic verification
    // In production, verify:
    // - Amount matches
    // - Recipient matches
    // - Token is USDC
    // - Transaction is confirmed

    return true
  } catch (error) {
    console.error('Payment verification error:', error)
    return false
  }
}

/**
 * Get payment status
 */
export async function getPaymentStatus(txHash: string): Promise<{
  confirmed: boolean
  error?: string
}> {
  try {
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    )

    const status = await connection.getSignatureStatus(txHash)

    if (!status || !status.value) {
      return { confirmed: false, error: 'Transaction not found' }
    }

    if (status.value.err) {
      return { confirmed: false, error: 'Transaction failed' }
    }

    return {
      confirmed: status.value.confirmationStatus === 'confirmed' ||
                 status.value.confirmationStatus === 'finalized',
    }
  } catch (error) {
    console.error('Get payment status error:', error)
    return {
      confirmed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Format payment amount for display
 */
export function formatPaymentAmount(amount: number): string {
  return `$${amount.toFixed(2)} USDC`
}

/**
 * Get Solana explorer URL for a transaction
 */
export function getExplorerUrl(txHash: string, network: string = 'devnet'): string {
  return `https://explorer.solana.com/tx/${txHash}?cluster=${network}`
}

