/**
 * Test endpoint for x402 payment flow
 * 
 * This is a simple endpoint to test the x402 middleware
 * without the complexity of actual dataset downloads
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePayment } from '@/lib/x402-middleware'

export async function GET(request: NextRequest) {
  // Configure payment
  const paymentConfig = {
    price: "0.001", // 0.001 USDC
    network: process.env.X402_NETWORK || 'solana-devnet',
    recipient: process.env.PAYMENT_WALLET_ADDRESS || '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC1prcxcN8BD',
    facilitatorUrl: process.env.FACILITATOR_URL || 'https://facilitator.payai.network',
    description: 'Test x402 payment',
  }

  // Use x402 middleware
  return requirePayment(paymentConfig)(request, async () => {
    // Payment verified - return protected content
    return NextResponse.json({
      success: true,
      message: '🎉 Payment verified! You have access to this protected resource.',
      data: {
        secret: 'This is protected content that requires payment',
        timestamp: new Date().toISOString(),
      },
    })
  })
}

