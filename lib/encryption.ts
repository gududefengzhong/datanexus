/**
 * Hybrid Encryption Utilities
 * 
 * This module provides AES-256-GCM encryption/decryption for file data.
 * The encryption keys are stored in the database, making it easy for AI agents
 * to access the data through a simple API.
 * 
 * Architecture:
 * 1. Upload: Generate random AES-256 key → Encrypt file → Store key in DB
 * 2. Purchase: Record purchase in DB → Grant access to encryption key
 * 3. Download: Check DB permissions → Return key → Decrypt on client
 * 4. AI Agent: API call with API key → Check permissions → Return decrypted data
 */

import crypto from 'crypto';

// AES-256-GCM configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Generate a random encryption key
 * @returns Base64-encoded encryption key
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(KEY_LENGTH);
  return key.toString('base64');
}

/**
 * Encrypt data using AES-256-GCM
 * @param data - Data to encrypt (string or Buffer)
 * @param encryptionKey - Base64-encoded encryption key
 * @returns Encrypted data with IV and auth tag
 */
export function encryptData(
  data: string | Buffer,
  encryptionKey: string
): {
  ciphertext: string;
  iv: string;
  authTag: string;
} {
  // Convert data to Buffer if it's a string
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;

  // Decode the encryption key
  const key = Buffer.from(encryptionKey, 'base64');

  // Generate a random IV (Initialization Vector)
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the data
  const encrypted = Buffer.concat([
    cipher.update(dataBuffer),
    cipher.final(),
  ]);

  // Get the authentication tag
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Decrypt data using AES-256-GCM
 * @param ciphertext - Base64-encoded encrypted data
 * @param iv - Base64-encoded initialization vector
 * @param authTag - Base64-encoded authentication tag
 * @param encryptionKey - Base64-encoded encryption key
 * @returns Decrypted data as Buffer
 */
export function decryptData(
  ciphertext: string,
  iv: string,
  authTag: string,
  encryptionKey: string
): Buffer {
  // Decode all the inputs
  const key = Buffer.from(encryptionKey, 'base64');
  const ivBuffer = Buffer.from(iv, 'base64');
  const authTagBuffer = Buffer.from(authTag, 'base64');
  const encryptedData = Buffer.from(ciphertext, 'base64');

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  decipher.setAuthTag(authTagBuffer);

  // Decrypt the data
  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  return decrypted;
}

/**
 * Decrypt data and return as string
 * @param ciphertext - Base64-encoded encrypted data
 * @param iv - Base64-encoded initialization vector
 * @param authTag - Base64-encoded authentication tag
 * @param encryptionKey - Base64-encoded encryption key
 * @returns Decrypted data as string
 */
export function decryptDataToString(
  ciphertext: string,
  iv: string,
  authTag: string,
  encryptionKey: string
): string {
  const decrypted = decryptData(ciphertext, iv, authTag, encryptionKey);
  return decrypted.toString('utf-8');
}

/**
 * Encrypt a file for upload
 * @param file - File to encrypt
 * @returns Encrypted file data with metadata
 */
export async function encryptFile(file: File): Promise<{
  encryptedData: string;
  iv: string;
  authTag: string;
  encryptionKey: string;
  originalMetadata: {
    name: string;
    type: string;
    size: number;
  };
}> {
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  // Generate encryption key
  const encryptionKey = generateEncryptionKey();

  // Encrypt the file
  const { ciphertext, iv, authTag } = encryptData(fileBuffer, encryptionKey);

  return {
    encryptedData: ciphertext,
    iv,
    authTag,
    encryptionKey,
    originalMetadata: {
      name: file.name,
      type: file.type,
      size: file.size,
    },
  };
}

/**
 * Encrypt file metadata (for storing file info separately from file data)
 * @param metadata - File metadata object
 * @param encryptionKey - Encryption key to use
 * @returns Encrypted metadata
 */
export function encryptMetadata(
  metadata: {
    name: string;
    type: string;
    size: number;
    data?: string;
  },
  encryptionKey: string
): {
  ciphertext: string;
  iv: string;
  authTag: string;
} {
  const metadataString = JSON.stringify(metadata);
  return encryptData(metadataString, encryptionKey);
}

/**
 * Decrypt file metadata
 * @param ciphertext - Encrypted metadata
 * @param iv - Initialization vector
 * @param authTag - Authentication tag
 * @param encryptionKey - Encryption key
 * @returns Decrypted metadata object
 */
export function decryptMetadata(
  ciphertext: string,
  iv: string,
  authTag: string,
  encryptionKey: string
): {
  name: string;
  type: string;
  size: number;
  data?: string;
} {
  const decryptedString = decryptDataToString(ciphertext, iv, authTag, encryptionKey);
  return JSON.parse(decryptedString);
}

/**
 * Encrypt the encryption key itself using a master key
 * This adds an extra layer of security for storing keys in the database
 * @param encryptionKey - The encryption key to protect
 * @param masterKey - Master key from environment variable
 * @returns Encrypted key data
 */
export function encryptEncryptionKey(
  encryptionKey: string,
  masterKey: string
): {
  ciphertext: string;
  iv: string;
  authTag: string;
} {
  return encryptData(encryptionKey, masterKey);
}

/**
 * Decrypt an encrypted encryption key
 * @param ciphertext - Encrypted key
 * @param iv - Initialization vector
 * @param authTag - Authentication tag
 * @param masterKey - Master key from environment variable
 * @returns Decrypted encryption key
 */
export function decryptEncryptionKey(
  ciphertext: string,
  iv: string,
  authTag: string,
  masterKey: string
): string {
  return decryptDataToString(ciphertext, iv, authTag, masterKey);
}

/**
 * Get or generate master encryption key from environment
 * This key is used to encrypt the individual file encryption keys in the database
 * @returns Master encryption key
 */
export function getMasterEncryptionKey(): string {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY;
  
  if (!masterKey) {
    throw new Error(
      'MASTER_ENCRYPTION_KEY not found in environment variables. ' +
      'Please add it to your .env.local file. ' +
      'You can generate one using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
  }

  // Validate key length
  const keyBuffer = Buffer.from(masterKey, 'base64');
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `MASTER_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 4 / 3} base64 characters). ` +
      `Current key is ${keyBuffer.length} bytes.`
    );
  }

  return masterKey;
}

