import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  decryptData,
  decryptEncryptionKey,
  getMasterEncryptionKey,
} from '@/lib/encryption';

/**
 * Decrypt and download file
 * POST /api/decrypt
 * 
 * This endpoint:
 * 1. Authenticates the user
 * 2. Checks if user has permission (provider or purchased)
 * 3. Retrieves encryption key from database
 * 4. Decrypts the encryption key
 * 5. Returns decrypted file data
 * 
 * Request body:
 * {
 *   "productId": "uuid",
 *   "encryptedData": "base64...",
 *   "encryptionIv": "base64...",
 *   "encryptionAuthTag": "base64..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing productId' },
        { status: 400 }
      );
    }

    console.log('🔓 Decryption request for product:', productId);
    console.log('👤 User:', decoded.walletAddress);

    // Get product from database
    const product = await prisma.dataProduct.findUnique({
      where: { id: productId },
      include: {
        provider: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if encryption method is hybrid
    if (product.encryptionMethod !== 'hybrid') {
      return NextResponse.json(
        { error: 'This product does not use hybrid encryption' },
        { status: 400 }
      );
    }

    // Check if user has permission
    const isProvider = product.providerId === decoded.userId;

    let hasPurchased = false;
    let order = null;
    if (!isProvider) {
      // Check if user has purchased this product
      order = await prisma.order.findFirst({
        where: {
          productId: productId,
          buyerId: decoded.userId,
          status: 'completed',
        },
      });

      hasPurchased = !!order;
    }

    if (!isProvider && !hasPurchased) {
      return NextResponse.json(
        { error: 'Access denied. You must purchase this product first.' },
        { status: 403 }
      );
    }

    console.log(isProvider ? '✅ User is provider' : '✅ User has purchased');

    // Track download count for buyers (not providers)
    if (!isProvider && order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          downloadCount: { increment: 1 },
          lastDownloadAt: new Date(),
        },
      });
      console.log('📊 Download count incremented for order:', order.id);
    }

    // Get encryption key from database
    if (
      !product.encryptionKeyCiphertext ||
      !product.encryptionKeyIv ||
      !product.encryptionKeyAuthTag
    ) {
      return NextResponse.json(
        { error: 'Encryption key not found in database' },
        { status: 500 }
      );
    }

    // Get encrypted file from Irys
    if (!product.fileUrl || !product.irysTransactionId) {
      return NextResponse.json(
        { error: 'File URL or transaction ID not found' },
        { status: 500 }
      );
    }

    console.log('📥 Downloading encrypted file from Irys...');
    const fileResponse = await fetch(product.fileUrl);
    if (!fileResponse.ok) {
      throw new Error('Failed to download encrypted file from Irys');
    }

    const encryptedFileBuffer = await fileResponse.arrayBuffer();
    console.log('📦 Downloaded file size:', encryptedFileBuffer.byteLength, 'bytes');

    // Check if the downloaded data is JSON (old format) or binary (new format)
    const firstBytes = Buffer.from(encryptedFileBuffer.slice(0, 100)).toString('utf8');
    console.log('📋 First 100 bytes:', firstBytes.substring(0, 100));

    const encryptedData = Buffer.from(encryptedFileBuffer).toString('base64');

    // Get IV and AuthTag from Irys transaction metadata
    console.log('📋 Fetching Irys transaction metadata...');
    const metadataUrl = `https://gateway.irys.xyz/tx/${product.irysTransactionId}/tags`;
    const metadataResponse = await fetch(metadataUrl);

    if (!metadataResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch encryption metadata from Irys' },
        { status: 500 }
      );
    }

    const tags = await metadataResponse.json();
    const ivTag = tags.find((tag: any) => tag.name === 'Encryption-IV');
    const authTagTag = tags.find((tag: any) => tag.name === 'Encryption-AuthTag');

    if (!ivTag || !authTagTag) {
      return NextResponse.json(
        { error: 'Encryption metadata not found in Irys transaction' },
        { status: 500 }
      );
    }

    const encryptionIv = ivTag.value;
    const encryptionAuthTag = authTagTag.value;

    // Decrypt the encryption key
    console.log('🔑 Decrypting encryption key...');
    console.log('  - Key ciphertext length:', product.encryptionKeyCiphertext.length);
    console.log('  - Key IV length:', product.encryptionKeyIv.length);
    console.log('  - Key AuthTag length:', product.encryptionKeyAuthTag.length);

    const masterKey = getMasterEncryptionKey();
    const encryptionKey = decryptEncryptionKey(
      product.encryptionKeyCiphertext,
      product.encryptionKeyIv,
      product.encryptionKeyAuthTag,
      masterKey
    );
    console.log('  - Decrypted key length:', encryptionKey.length);

    // Decrypt the file data
    console.log('🔓 Decrypting file data...');
    console.log('  - Encrypted data length:', encryptedData.length);
    console.log('  - IV:', encryptionIv);
    console.log('  - AuthTag:', encryptionAuthTag);

    const decryptedBuffer = decryptData(
      encryptedData,
      encryptionIv,
      encryptionAuthTag,
      encryptionKey
    );

    console.log('✅ File decrypted successfully');
    console.log('  - Decrypted buffer size:', decryptedBuffer.length, 'bytes');

    // The decrypted buffer contains base64-encoded file data
    // We need to decode it back to the original binary data
    const decryptedBase64 = decryptedBuffer.toString('utf8');
    const originalFileBuffer = Buffer.from(decryptedBase64, 'base64');

    console.log('  - Original file size:', originalFileBuffer.length, 'bytes');
    console.log('  - First 100 bytes:', originalFileBuffer.toString('utf8').substring(0, 100));

    // Return the decrypted file as a download
    return new NextResponse(originalFileBuffer, {
      headers: {
        'Content-Type': product.fileType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${product.fileName || 'download'}"`,
      },
    });
  } catch (error: any) {
    console.error('Decryption error:', error);
    return NextResponse.json(
      {
        error: 'Failed to decrypt file',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

