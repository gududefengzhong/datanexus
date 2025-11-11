import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/api-auth'
import { decryptData } from '@/lib/encryption'
import { requirePayment } from '@/lib/x402-middleware'

/**
 * @swagger
 * /api/agent/datasets/{id}/download:
 *   get:
 *     summary: Download a dataset
 *     description: |
 *       Download a purchased dataset. If the dataset hasn't been purchased yet,
 *       this endpoint will return HTTP 402 Payment Required with x402 payment headers.
 *
 *       **x402 Payment Flow:**
 *       1. Request without payment token → Returns 402 with payment headers
 *       2. Make Solana payment to the recipient address
 *       3. Retry request with `x-payment-token` header (transaction signature)
 *       4. Server verifies payment and returns the dataset
 *
 *       **Note:** If you've already purchased the dataset, it will be downloaded directly.
 *     tags:
 *       - Datasets
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Dataset ID
 *       - in: header
 *         name: x-payment-token
 *         required: false
 *         schema:
 *           type: string
 *         description: Solana transaction signature (for x402 payment verification)
 *     responses:
 *       200:
 *         description: Dataset file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *           application/json:
 *             schema:
 *               type: string
 *               format: binary
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             description: Attachment filename
 *           x-payment-verified:
 *             schema:
 *               type: string
 *             description: Set to "true" if payment was verified
 *           x-payment-signature:
 *             schema:
 *               type: string
 *             description: Solana transaction signature
 *       402:
 *         description: Payment Required (x402 protocol)
 *         headers:
 *           x-payment-amount:
 *             schema:
 *               type: string
 *             description: Price in USDC (e.g., "0.5")
 *           x-payment-currency:
 *             schema:
 *               type: string
 *             description: Payment currency (USDC)
 *           x-payment-recipient:
 *             schema:
 *               type: string
 *             description: Solana wallet address to send payment to
 *           x-payment-network:
 *             schema:
 *               type: string
 *             description: Blockchain network (solana-devnet or solana)
 *           x-payment-facilitator:
 *             schema:
 *               type: string
 *             description: PayAI Facilitator URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentRequired'
 *             example:
 *               success: false
 *               error:
 *                 code: PAYMENT_REQUIRED
 *                 message: "Purchase dataset: Test Dataset"
 *                 details:
 *                   price: "0.5"
 *                   currency: "USDC"
 *                   network: "solana-devnet"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Dataset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify API key
    const apiKeyHeader = request.headers.get('authorization')
    if (!apiKeyHeader || !apiKeyHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'API key is required',
          },
        },
        { status: 401 }
      )
    }

    const apiKey = apiKeyHeader.substring(7)
    const user = await verifyApiKey(apiKey)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid API key',
          },
        },
        { status: 401 }
      )
    }

    const { id: productId } = await params

    // Get dataset
    const product = await prisma.dataProduct.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        fileUrl: true,
        fileName: true,
        fileType: true,
        isEncrypted: true,
        encryptionMethod: true,
        encryptionKeyCiphertext: true,
        encryptionKeyIv: true,
        encryptionKeyAuthTag: true,
        providerId: true,
        irysTransactionId: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Dataset not found',
          },
        },
        { status: 404 }
      )
    }

    // Check if user has permission
    const isProvider = product.providerId === user.id

    let hasPurchased = false
    let order = null
    if (!isProvider) {
      // Check if user has purchased this product
      order = await prisma.order.findFirst({
        where: {
          productId,
          buyerId: user.id,
          status: 'completed',
        },
      })

      hasPurchased = !!order
    }

    if (!isProvider && !hasPurchased) {
      // User hasn't purchased - require x402 payment
      const dataset = await prisma.dataProduct.findUnique({
        where: { id: productId },
        select: { price: true, name: true },
      })

      if (!dataset) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Dataset not found',
            },
          },
          { status: 404 }
        )
      }

      // Configure x402 payment
      const paymentConfig = {
        price: dataset.price.toString(),
        network: process.env.X402_NETWORK || 'solana-devnet',
        recipient: process.env.PAYMENT_WALLET_ADDRESS!,
        facilitatorUrl: process.env.FACILITATOR_URL || 'https://facilitator.payai.network',
        description: `Purchase dataset: ${dataset.name}`,
      }

      // Use x402 middleware to require payment
      return requirePayment(paymentConfig)(request, async () => {
        // Payment verified - create order and proceed with download
        console.log('✅ x402 payment verified, creating order...')

        const newOrder = await prisma.order.create({
          data: {
            productId,
            buyerId: user.id,
            amount: dataset.price,
            status: 'completed',
            paymentTxHash: request.headers.get('x-payment-token') || 'x402-payment',
            paymentNetwork: 'solana-devnet',
          },
        })

        console.log('📦 Order created via x402:', newOrder.id)

        // Continue with download logic
        return handleDownload(product, newOrder, user.id, false)
      })
    }

    // User has purchased or is the provider - proceed with download
    return handleDownload(product, order, user.id, isProvider)
  } catch (error) {
    console.error('Agent API - Download dataset error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to download dataset',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * Handle the actual file download logic
 */
async function handleDownload(
  product: any,
  order: any | null,
  userId: string,
  isProvider: boolean
): Promise<NextResponse> {
  console.log('📥 Agent download request:', {
    productId: product.id,
    userId,
    isProvider,
    hasPurchased: !!order,
  })

  // Track download count for buyers
  if (!isProvider && order) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadAt: new Date(),
      },
    })
    console.log('📊 Download count incremented for order:', order.id)
  }

  let fileBuffer: Buffer

  // Handle encrypted files
  if (product.isEncrypted && product.encryptionMethod === 'hybrid') {
    console.log('🔐 Downloading and decrypting file...')

    // Download encrypted file from Irys
    const fileResponse = await fetch(product.fileUrl)
    if (!fileResponse.ok) {
      throw new Error('Failed to download file from Irys')
    }

    const encryptedBuffer = Buffer.from(await fileResponse.arrayBuffer())

    // Get IV and AuthTag from Irys metadata
    const metadataUrl = `https://gateway.irys.xyz/tx/${product.fileUrl.split('/').pop()}`
    const metadataResponse = await fetch(metadataUrl)
    const metadata = await metadataResponse.json()

    const iv = metadata.tags?.find((t: any) => t.name === 'Encryption-IV')?.value
    const authTag = metadata.tags?.find((t: any) => t.name === 'Encryption-AuthTag')?.value

    if (!iv || !authTag) {
      throw new Error('Missing encryption metadata')
    }

    // Decrypt encryption key
    const masterKey = process.env.MASTER_ENCRYPTION_KEY
    if (!masterKey) {
      throw new Error('Master encryption key not configured')
    }

    // Decrypt encryption key
    // decryptData(ciphertext, iv, authTag, encryptionKey)
    const encryptionKeyBuffer = decryptData(
      product.encryptionKeyCiphertext!,
      product.encryptionKeyIv!,
      product.encryptionKeyAuthTag!,
      masterKey
    )

    // The decrypted buffer contains the base64-encoded encryption key (as UTF-8 string)
    // Convert buffer to string to get the base64 key
    const encryptionKey = encryptionKeyBuffer.toString('utf-8')

    // Decrypt file
    fileBuffer = decryptData(
      encryptedBuffer.toString('base64'),
      iv,
      authTag,
      encryptionKey
    )

    console.log('✅ File decrypted successfully')
  } else {
    // Download non-encrypted file directly
    console.log('📥 Downloading non-encrypted file...')
    const fileResponse = await fetch(product.fileUrl)
    if (!fileResponse.ok) {
      throw new Error('Failed to download file from Irys')
    }

    fileBuffer = Buffer.from(await fileResponse.arrayBuffer())
  }

  // Determine content type
  const contentTypeMap: Record<string, string> = {
    csv: 'text/csv',
    json: 'application/json',
    parquet: 'application/octet-stream',
    txt: 'text/plain',
  }

  const contentType = contentTypeMap[product.fileType.toLowerCase()] || 'application/octet-stream'

  // Return file
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${product.fileName}"`,
      'Content-Length': fileBuffer.length.toString(),
    },
  })
}

