/**
 * x402 Payment Middleware for Next.js API Routes
 * 
 * This middleware implements the x402 protocol for requiring payment
 * before accessing protected resources.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'

/**
 * Payment configuration for a protected resource
 */
export interface PaymentConfig {
  /** Price in USDC (e.g., "0.001") */
  price: string
  /** Network: "solana-devnet" or "solana" */
  network: string
  /** Recipient wallet address */
  recipient: string
  /** Facilitator URL */
  facilitatorUrl: string
  /** Optional: Resource description */
  description?: string
}

/**
 * Payment verification result from facilitator
 */
interface PaymentVerificationResult {
  valid: boolean
  transactionSignature?: string
  amount?: string
  recipient?: string
  error?: string
}

/**
 * Create a middleware that requires payment for a resource
 * 
 * Usage:
 * ```typescript
 * const config = {
 *   price: "0.001",
 *   network: "solana-devnet",
 *   recipient: process.env.PAYMENT_WALLET_ADDRESS!,
 *   facilitatorUrl: process.env.FACILITATOR_URL!,
 * }
 * 
 * return requirePayment(config)(request, async () => {
 *   // Your protected handler logic
 *   return NextResponse.json({ data: "protected content" })
 * })
 * ```
 */
export function requirePayment(config: PaymentConfig) {
  return async (
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> => {
    // Check for payment token in headers
    const paymentToken = request.headers.get('x-payment-token')

    if (!paymentToken) {
      // No payment token - return 402 Payment Required
      return createPaymentRequiredResponse(config)
    }

    // Verify payment token
    const verification = await verifyPaymentToken(paymentToken, config)

    if (!verification.valid) {
      // Invalid payment token
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PAYMENT',
            message: verification.error || 'Invalid payment token',
          },
        },
        { status: 402 }
      )
    }

    // Payment verified - execute the protected handler
    const response = await handler()

    // Add payment response headers
    const headers = new Headers(response.headers)
    headers.set('x-payment-verified', 'true')
    if (verification.transactionSignature) {
      headers.set('x-payment-signature', verification.transactionSignature)
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}

/**
 * Create a 402 Payment Required response with payment headers
 */
function createPaymentRequiredResponse(config: PaymentConfig): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: {
        code: 'PAYMENT_REQUIRED',
        message: config.description || 'Payment required to access this resource',
        details: {
          price: config.price,
          currency: 'USDC',
          network: config.network,
        },
      },
    },
    { status: 402 }
  )

  // Set x402 payment headers
  response.headers.set('x-payment-amount', config.price)
  response.headers.set('x-payment-currency', 'USDC')
  response.headers.set('x-payment-recipient', config.recipient)
  response.headers.set('x-payment-facilitator', config.facilitatorUrl)
  response.headers.set('x-payment-network', config.network)

  return response
}

/**
 * Verify a payment token with the facilitator
 */
export async function verifyPaymentToken(
  token: string,
  config: PaymentConfig
): Promise<PaymentVerificationResult> {
  try {
    // Method 1: Try PayAI facilitator first (recommended)
    if (config.facilitatorUrl) {
      console.log('🔍 Verifying payment with PayAI facilitator...')
      console.log('   Token:', token.substring(0, 20) + '...')
      console.log('   Network:', config.network)
      console.log('   Recipient:', config.recipient)
      console.log('   Amount:', config.price, 'USDC')

      const facilitatorResult = await verifyWithFacilitator(token, config)

      if (facilitatorResult.valid) {
        console.log('✅ Payment verified by facilitator')
        return facilitatorResult
      }

      console.warn('⚠️  Facilitator verification failed:', facilitatorResult.error)
      console.warn('   Falling back to Solana blockchain verification...')
    }

    // Method 2: Fallback to direct Solana blockchain verification
    // This verifies USDC token transfers directly on-chain
    console.log('🔍 Verifying payment on Solana blockchain...')
    const solanaResult = await verifyOnSolana(token, config)

    if (solanaResult.valid) {
      console.log('✅ Payment verified on Solana blockchain')
      return solanaResult
    }

    console.error('❌ Payment verification failed')
    return {
      valid: false,
      error: solanaResult.error || 'Payment verification failed. Please ensure you sent the correct USDC amount to the correct address.',
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error)
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    }
  }
}

/**
 * Verify payment using the facilitator's /verify endpoint
 */
async function verifyWithFacilitator(
  token: string,
  config: PaymentConfig
): Promise<PaymentVerificationResult> {
  try {
    const response = await fetch(`${config.facilitatorUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        network: config.network,
        recipient: config.recipient,
        amount: config.price,
        currency: 'USDC',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return {
        valid: false,
        error: `Facilitator verification failed: ${error}`,
      }
    }

    const result = await response.json()
    
    return {
      valid: result.valid === true,
      transactionSignature: result.signature || token,
      amount: result.amount,
      recipient: result.recipient,
      error: result.error,
    }
  } catch (error) {
    console.error('Facilitator verification error:', error)
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Facilitator error',
    }
  }
}

/**
 * Verify USDC token payment directly on Solana blockchain
 * This is a fallback method when facilitator is not available
 */
async function verifyOnSolana(
  signature: string,
  config: PaymentConfig
): Promise<PaymentVerificationResult> {
  try {
    console.log('🔍 Verifying USDC payment on Solana blockchain...')
    console.log('   Signature:', signature)

    // Connect to Solana
    const rpcUrl =
      config.network === 'solana-devnet'
        ? process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
        : 'https://api.mainnet-beta.solana.com'

    const connection = new Connection(rpcUrl, 'confirmed')

    // Get transaction details
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    })

    if (!tx) {
      console.error('❌ Transaction not found')
      return {
        valid: false,
        error: 'Transaction not found',
      }
    }

    // Verify transaction was successful
    if (tx.meta?.err) {
      console.error('❌ Transaction failed:', tx.meta.err)
      return {
        valid: false,
        error: 'Transaction failed',
      }
    }

    // Check if this is a token transfer by looking at the program IDs
    const accountKeys = tx.transaction.message.getAccountKeys()
    const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

    const hasTokenProgram = accountKeys.staticAccountKeys.some(
      (key) => key.toBase58() === TOKEN_PROGRAM_ID
    )

    if (!hasTokenProgram) {
      console.error('❌ Not a token transfer transaction')
      return {
        valid: false,
        error: 'Not a token transfer transaction',
      }
    }

    // Verify the transaction has post token balances (indicates successful token transfer)
    if (!tx.meta?.postTokenBalances || tx.meta.postTokenBalances.length === 0) {
      console.error('❌ No token transfers found in transaction')
      return {
        valid: false,
        error: 'No token transfers found in transaction',
      }
    }

    // Verify USDC amount
    // USDC has 6 decimals, so we need to convert
    const expectedAmount = parseFloat(config.price) * 1_000_000 // Convert to smallest unit

    // Get the token balance changes
    const preBalances = tx.meta.preTokenBalances || []
    const postBalances = tx.meta.postTokenBalances || []

    console.log('   Pre-balances:', preBalances.length)
    console.log('   Post-balances:', postBalances.length)

    // Find the transfer amount by comparing balances
    let transferAmount = 0
    for (const postBalance of postBalances) {
      const preBalance = preBalances.find(
        (pre) => pre.accountIndex === postBalance.accountIndex
      )
      if (preBalance && postBalance.uiTokenAmount && preBalance.uiTokenAmount) {
        const diff = postBalance.uiTokenAmount.uiAmount! - preBalance.uiTokenAmount.uiAmount!
        if (diff > 0) {
          // This account received tokens
          transferAmount = diff
          console.log('   Transfer amount:', transferAmount, 'USDC')
          break
        }
      }
    }

    // Verify amount (allow small rounding differences)
    const expectedUsdcAmount = parseFloat(config.price)
    const amountDiff = Math.abs(transferAmount - expectedUsdcAmount)

    if (amountDiff > 0.01) {
      console.error('❌ Amount mismatch')
      console.error('   Expected:', expectedUsdcAmount, 'USDC')
      console.error('   Received:', transferAmount, 'USDC')
      return {
        valid: false,
        error: `Amount mismatch: expected ${expectedUsdcAmount} USDC, got ${transferAmount} USDC`,
      }
    }

    console.log('✅ Solana verification passed:')
    console.log('   - Transaction succeeded')
    console.log('   - Token transfer detected')
    console.log('   - Amount verified:', transferAmount, 'USDC')

    return {
      valid: true,
      transactionSignature: signature,
      amount: transferAmount.toString(),
    }
  } catch (error) {
    console.error('❌ Solana verification error:', error)
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Blockchain verification failed',
    }
  }
}

/**
 * Helper function to check if a request has a valid payment
 * without requiring payment (useful for optional payments)
 */
export async function hasValidPayment(
  request: NextRequest,
  config: PaymentConfig
): Promise<boolean> {
  const paymentToken = request.headers.get('x-payment-token')
  if (!paymentToken) {
    return false
  }

  const verification = await verifyPaymentToken(paymentToken, config)
  return verification.valid
}

