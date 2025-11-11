import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  decryptDataToString,
  decryptEncryptionKey,
  getMasterEncryptionKey,
} from '@/lib/encryption';
import crypto from 'crypto';

/**
 * AI Agent Data Access API
 * GET /api/agent/data?productId=xxx&apiKey=xxx
 * 
 * This endpoint allows AI agents to access purchased data using an API key.
 * 
 * Features:
 * - Simple API key authentication
 * - Automatic permission checking
 * - Returns decrypted data directly
 * - Supports both provider and buyer access
 * 
 * Usage:
 * ```
 * curl -H "X-API-Key: your-api-key" \
 *      "https://your-domain.com/api/agent/data?productId=xxx"
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Please provide X-API-Key header.' },
        { status: 401 }
      );
    }

    // Get product ID from query params
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing productId parameter' },
        { status: 400 }
      );
    }

    console.log('🤖 AI Agent data request');
    console.log('📦 Product ID:', productId);

    // Hash the API key to compare with database
    const apiKeyHash = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');

    // Find API key in database
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyHash: apiKeyHash },
      include: {
        user: true,
      },
    });

    if (!apiKeyRecord) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Check if API key is expired
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'API key has expired' },
        { status: 401 }
      );
    }

    // Check if API key has read permission
    if (!apiKeyRecord.permissions.includes('read')) {
      return NextResponse.json(
        { error: 'API key does not have read permission' },
        { status: 403 }
      );
    }

    console.log('✅ API key validated for user:', apiKeyRecord.user.walletAddress);

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // Get product from database
    const product = await prisma.dataProduct.findUnique({
      where: { id: productId },
      include: {
        provider: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product uses hybrid encryption
    if (product.encryptionMethod !== 'hybrid') {
      return NextResponse.json(
        {
          error: 'This product does not use hybrid encryption',
          hint: 'Only products encrypted with hybrid method (v3.0) are supported',
        },
        { status: 400 }
      );
    }

    // Check if user has permission
    const isProvider = product.providerId === apiKeyRecord.userId;

    let hasPurchased = false;
    if (!isProvider) {
      // Check if user has purchased this product
      const order = await prisma.order.findFirst({
        where: {
          productId: productId,
          buyerId: apiKeyRecord.userId,
          status: 'completed',
        },
      });

      hasPurchased = !!order;
    }

    if (!isProvider && !hasPurchased) {
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'You must purchase this product first to access the data',
          productId: productId,
          productName: product.name,
          price: product.price,
        },
        { status: 403 }
      );
    }

    console.log(isProvider ? '✅ User is provider' : '✅ User has purchased');

    // Get encrypted data from Irys
    console.log('📥 Fetching encrypted data from Irys...');
    const irysUrl = `https://gateway.irys.xyz/${product.irysTransactionId}`;
    const response = await fetch(irysUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch from Irys: ${response.statusText}`);
    }

    const encryptedDataFromIrys = await response.json();

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

    // Decrypt the encryption key
    console.log('🔑 Decrypting encryption key...');
    const masterKey = getMasterEncryptionKey();
    const encryptionKey = decryptEncryptionKey(
      product.encryptionKeyCiphertext,
      product.encryptionKeyIv,
      product.encryptionKeyAuthTag,
      masterKey
    );

    // Decrypt the file data
    console.log('🔓 Decrypting file data...');
    const decryptedString = decryptDataToString(
      encryptedDataFromIrys.encryptedData,
      encryptedDataFromIrys.encryptionIv,
      encryptedDataFromIrys.encryptionAuthTag,
      encryptionKey
    );

    // Parse the decrypted data
    const fileMetadata = JSON.parse(decryptedString);

    console.log('✅ Data decrypted successfully for AI agent');

    // Return the decrypted data
    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        provider: product.provider.walletAddress,
      },
      file: {
        name: fileMetadata.name,
        type: fileMetadata.type,
        size: fileMetadata.size,
        data: fileMetadata.data, // Base64-encoded file data
      },
      metadata: {
        accessedAt: new Date().toISOString(),
        accessMethod: 'api-key',
        apiKeyName: apiKeyRecord.name,
      },
    });
  } catch (error: any) {
    console.error('AI Agent API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve data',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

