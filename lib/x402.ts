/**
 * x402 Payment Integration
 * 
 * For MVP, we'll use a simplified payment flow:
 * 1. User clicks "Purchase"
 * 2. Connect wallet (already done)
 * 3. Sign payment message
 * 4. Submit payment to blockchain
 * 5. Confirm order in database
 * 
 * In production, this would use the full x402 protocol with facilitators.
 */

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'

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
 * Initiate a payment for a product
 * 
 * For MVP on Devnet, we'll use SOL instead of USDC for simplicity
 * In production, this would use USDC SPL token transfers
 */
export async function initiatePayment(
  request: PaymentRequest,
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<PaymentResult> {
  try {
    // Connect to Solana Devnet
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    )

    // For MVP: Convert USDC amount to SOL (1 USDC = 0.001 SOL on devnet for testing)
    const solAmount = request.amount * 0.001
    const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL)

    // Create recipient public key
    const recipientPubkey = new PublicKey(request.recipientAddress)

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()

    // Create transaction
    const transaction = new Transaction({
      feePayer: walletPublicKey,
      recentBlockhash: blockhash,
    }).add(
      SystemProgram.transfer({
        fromPubkey: walletPublicKey,
        toPubkey: recipientPubkey,
        lamports,
      })
    )

    // Sign transaction with wallet
    const signedTransaction = await signTransaction(transaction)

    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    )

    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed')

    return {
      success: true,
      txHash: signature,
    }
  } catch (error) {
    console.error('Payment error:', error)
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

