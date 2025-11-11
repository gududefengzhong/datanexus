import { NextRequest, NextResponse } from 'next/server';
import { uploadToIrys } from '@/lib/irys';
import {
  generateEncryptionKey,
  encryptData,
  encryptEncryptionKey,
  getMasterEncryptionKey,
} from '@/lib/encryption';
import { verifyToken } from '@/lib/auth';

/**
 * Upload file with hybrid encryption
 * POST /api/upload/hybrid
 * 
 * This endpoint:
 * 1. Authenticates the user
 * 2. Encrypts the file using AES-256-GCM
 * 3. Uploads encrypted data to Irys
 * 4. Stores encryption key (encrypted) in database
 * 5. Returns transaction details and encryption metadata
 * 
 * Encryption flow:
 * - Generate random AES-256 key for file
 * - Encrypt file with AES-256-GCM
 * - Encrypt the encryption key with master key
 * - Store encrypted key in database
 * - Upload encrypted file to Irys
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (!token || token === 'null' || token === 'undefined') {
      console.error('Empty or invalid token');
      return NextResponse.json({ error: 'Unauthorized - Invalid token format' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.error('Token verification failed');
      return NextResponse.json({ error: 'Invalid token - Please login again' }, { status: 401 });
    }

    console.log('User authenticated:', decoded.walletAddress);

    // Get the file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productName = formData.get('productName') as string;
    const productDescription = formData.get('productDescription') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!productName || !productDescription) {
      return NextResponse.json({ error: 'Product name and description are required' }, { status: 400 });
    }

    // Validate file size (100MB max)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large (max 100MB)' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'application/json', 'application/octet-stream'];
    const fileName = file.name.toLowerCase();
    const isValidType =
      allowedTypes.includes(file.type) ||
      fileName.endsWith('.csv') ||
      fileName.endsWith('.json') ||
      fileName.endsWith('.parquet');

    if (!isValidType) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV, JSON, and Parquet are allowed' },
        { status: 400 }
      );
    }

    // Step 1: Read file data
    console.log('📖 Reading file data...');
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Step 2: Generate encryption key
    console.log('🔑 Generating encryption key...');
    const encryptionKey = generateEncryptionKey();

    // Step 3: Encrypt the raw file data (NOT wrapped in JSON)
    console.log('🔐 Encrypting file data...');
    const fileDataBase64 = fileBuffer.toString('base64');
    const {
      ciphertext: encryptedData,
      iv: encryptionIv,
      authTag: encryptionAuthTag,
    } = encryptData(fileDataBase64, encryptionKey);

    // Step 4: Encrypt the encryption key with master key
    console.log('🔒 Encrypting encryption key...');
    const masterKey = getMasterEncryptionKey();
    const {
      ciphertext: encryptionKeyCiphertext,
      iv: encryptionKeyIv,
      authTag: encryptionKeyAuthTag,
    } = encryptEncryptionKey(encryptionKey, masterKey);

    console.log('✅ File encrypted successfully');

    // Step 5: Upload encrypted file to Irys
    // Only upload the encrypted file data, NOT the encryption key
    console.log('📤 Uploading encrypted file to Irys...');
    const result = await uploadToIrys(
      Buffer.from(encryptedData, 'base64'),
      file.type || 'application/octet-stream',
      {
        'Encryption-Method': 'hybrid',
        'Encryption-Version': '3.0',
        'Encryption-IV': encryptionIv,
        'Encryption-AuthTag': encryptionAuthTag,
        'Provider': decoded.walletAddress,
        'Original-Filename': file.name,
      }
    );

    console.log('✅ Upload successful! Transaction ID:', result.transactionId);

    // Return encryption metadata (to be stored in database)
    // NOTE: We only store the encryption KEY in database, not the encrypted file data
    const response = {
      success: true,
      transactionId: result.transactionId,
      url: result.url,
      cost: result.cost,
      encryption: {
        // Encryption key (encrypted with master key) - stored in database
        encryptionKeyCiphertext,
        encryptionKeyIv,
        encryptionKeyAuthTag,
        // Metadata
        providerAddress: decoded.walletAddress,
        isEncrypted: true,
        encryptionMethod: 'hybrid',
        encryptionVersion: '3.0',
      },
    };

    console.log('📤 Returning response:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Encrypted upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload encrypted file',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

