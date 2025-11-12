import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { decryptData, decryptEncryptionKey, getMasterEncryptionKey } from '@/lib/encryption'
import { requirePayment } from '@/lib/x402-middleware'

/**
 * GET /api/products/[id]/download
 * 
 * x402 Protocol Flow for Web UI:
 * 1. First request (no payment token) → Returns HTTP 402 with payment headers
 * 2. User makes Solana payment
 * 3. Second request (with x-payment-token header) → Returns the file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid token',
          },
        },
        { status: 401 }
      )
    }

    const { id: productId } = await params

    // Get product
    const product = await prisma.dataProduct.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
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
        provider: {
          select: {
            walletAddress: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
      )
    }

    // Check if user is the provider
    const isProvider = product.providerId === payload.userId

    // Check if user has purchased
    let hasPurchased = false
    let order = null
    if (!isProvider) {
      order = await prisma.order.findFirst({
        where: {
          productId,
          buyerId: payload.userId,
          status: 'completed',
        },
      })
      hasPurchased = !!order
    }

    console.log('🔍 Download request:', {
      productId,
      userId: payload.userId,
      isProvider,
      hasPurchased,
      hasPaymentToken: !!request.headers.get('x-payment-token'),
    })

    // If user hasn't purchased and is not the provider, require x402 payment
    if (!isProvider && !hasPurchased) {
      console.log('💰 User has not purchased - requiring x402 payment')

      // Configure x402 payment
      const paymentConfig = {
        price: product.price.toString(),
        network: process.env.X402_NETWORK || 'solana-devnet',
        recipient: product.provider.walletAddress,
        facilitatorUrl: process.env.FACILITATOR_URL || 'https://facilitator.payai.network',
        description: `Purchase dataset: ${product.name}`,
      }

      // Use x402 middleware to require payment
      return requirePayment(paymentConfig)(request, async () => {
        // Payment verified - create order and proceed with download
        console.log('✅ x402 payment verified, creating order...')

        const newOrder = await prisma.order.create({
          data: {
            productId,
            buyerId: payload.userId,
            amount: product.price,
            status: 'completed',
            paymentTxHash: request.headers.get('x-payment-token') || 'x402-payment',
            paymentNetwork: 'solana-devnet',
          },
        })

        console.log('📦 Order created via x402:', newOrder.id)

        // Increment purchase count
        await prisma.dataProduct.update({
          where: { id: productId },
          data: {
            purchases: {
              increment: 1,
            },
          },
        })

        // Continue with download logic
        return handleDownload(product, newOrder, payload.userId, false)
      })
    }

    // User has purchased or is the provider - proceed with download
    console.log('✅ User has access - proceeding with download')
    return handleDownload(product, order, payload.userId, isProvider)
  } catch (error) {
    console.error('Download error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to download product',
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
  console.log('📥 Handling download:', {
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

  try {
    // Fetch file from Irys
    console.log('📡 Fetching file from Irys:', product.irysTransactionId || product.fileUrl)
    const fileUrl = product.irysTransactionId
      ? `https://gateway.irys.xyz/${product.irysTransactionId}`
      : product.fileUrl

    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.statusText}`)
    }

    const arrayBuffer = await fileResponse.arrayBuffer()
    fileBuffer = Buffer.from(arrayBuffer)
    console.log('✅ File fetched, size:', fileBuffer.length)

    // Decrypt if needed
    if (product.isEncrypted && product.encryptionMethod === 'hybrid') {
      console.log('🔓 Decrypting file...')

      if (
        !product.encryptionKeyCiphertext ||
        !product.encryptionKeyIv ||
        !product.encryptionKeyAuthTag
      ) {
        throw new Error('Missing encryption key metadata in database')
      }

      // Step 1: Decrypt the encryption key using master key
      console.log('🔑 Decrypting encryption key...')
      const masterKey = getMasterEncryptionKey()
      const encryptionKey = decryptEncryptionKey(
        product.encryptionKeyCiphertext,
        product.encryptionKeyIv,
        product.encryptionKeyAuthTag,
        masterKey
      )
      console.log('✅ Encryption key decrypted')

      // Step 2: Get encryption metadata from Irys transaction
      console.log('📋 Fetching encryption metadata from Irys...')
      const metadataResponse = await fetch(
        `https://gateway.irys.xyz/tx/${product.irysTransactionId}`
      )

      if (!metadataResponse.ok) {
        throw new Error('Failed to fetch encryption metadata from Irys')
      }

      const metadata = await metadataResponse.json()
      const encryptionIv = metadata.tags?.find((tag: any) => tag.name === 'Encryption-IV')?.value
      const encryptionAuthTag = metadata.tags?.find((tag: any) => tag.name === 'Encryption-AuthTag')?.value

      if (!encryptionIv || !encryptionAuthTag) {
        throw new Error('Missing encryption IV or AuthTag in Irys metadata')
      }

      console.log('✅ Encryption metadata retrieved')

      // Step 3: Decrypt the file data
      console.log('🔓 Decrypting file data...')
      const encryptedDataBase64 = fileBuffer.toString('base64')
      const decryptedData = decryptData(
        encryptedDataBase64,
        encryptionIv,
        encryptionAuthTag,
        encryptionKey
      )

      fileBuffer = Buffer.from(decryptedData)
      console.log('✅ File decrypted, size:', fileBuffer.length)
    }
  } catch (error) {
    console.error('File processing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FILE_ERROR',
          message: 'Failed to process file',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }

  // Return file
  const headers = new Headers()
  headers.set('Content-Type', product.fileType || 'application/octet-stream')
  headers.set('Content-Disposition', `attachment; filename="${product.fileName}"`)
  headers.set('Content-Length', fileBuffer.length.toString())

  console.log('✅ Returning file:', {
    fileName: product.fileName,
    fileType: product.fileType,
    size: fileBuffer.length,
  })

  return new NextResponse(fileBuffer, {
    status: 200,
    headers,
  })
}

