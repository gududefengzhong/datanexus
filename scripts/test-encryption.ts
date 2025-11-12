/**
 * Test encryption/decryption flow
 * This script tests the complete encryption and decryption process
 * to ensure files are properly encrypted and decrypted
 */

import { generateEncryptionKey, encryptData, decryptData } from '../lib/encryption';

async function testEncryption() {
  console.log('🧪 Testing Encryption/Decryption Flow\n');

  // Step 1: Create test data (simulating a CSV file)
  const testData = `name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago`;

  console.log('📄 Original Data:');
  console.log(testData);
  console.log('\n' + '='.repeat(60) + '\n');

  // Step 2: Convert to base64 (like upload does)
  const fileBuffer = Buffer.from(testData, 'utf-8');
  const fileDataBase64 = fileBuffer.toString('base64');
  
  console.log('📦 Step 1: Convert to Base64');
  console.log('  - Original size:', fileBuffer.length, 'bytes');
  console.log('  - Base64 size:', fileDataBase64.length, 'chars');
  console.log('  - Base64 preview:', fileDataBase64.substring(0, 50) + '...');
  console.log('\n' + '='.repeat(60) + '\n');

  // Step 3: Generate encryption key
  const encryptionKey = generateEncryptionKey();
  console.log('🔑 Step 2: Generate Encryption Key');
  console.log('  - Key length:', encryptionKey.length, 'chars');
  console.log('  - Key preview:', encryptionKey.substring(0, 20) + '...');
  console.log('\n' + '='.repeat(60) + '\n');

  // Step 4: Encrypt the base64 string
  const { ciphertext, iv, authTag } = encryptData(fileDataBase64, encryptionKey);
  
  console.log('🔐 Step 3: Encrypt Data');
  console.log('  - Ciphertext length:', ciphertext.length, 'chars');
  console.log('  - IV:', iv);
  console.log('  - AuthTag:', authTag);
  console.log('  - Ciphertext preview:', ciphertext.substring(0, 50) + '...');
  console.log('\n' + '='.repeat(60) + '\n');

  // Step 5: Decrypt the data (like download does)
  console.log('🔓 Step 4: Decrypt Data');
  
  try {
    const decryptedBuffer = decryptData(ciphertext, iv, authTag, encryptionKey);
    console.log('  - Decrypted buffer size:', decryptedBuffer.length, 'bytes');
    console.log('  - First 50 chars:', decryptedBuffer.toString('utf8').substring(0, 50));
    
    // Step 6: Convert back from base64
    const decryptedBase64 = decryptedBuffer.toString('utf8');
    console.log('  - Decrypted base64 length:', decryptedBase64.length, 'chars');
    console.log('  - Base64 matches original?', decryptedBase64 === fileDataBase64);
    
    const originalFileBuffer = Buffer.from(decryptedBase64, 'base64');
    console.log('  - Final buffer size:', originalFileBuffer.length, 'bytes');
    
    const finalData = originalFileBuffer.toString('utf8');
    console.log('\n' + '='.repeat(60) + '\n');
    
    console.log('📄 Final Decrypted Data:');
    console.log(finalData);
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Verify
    if (finalData === testData) {
      console.log('✅ SUCCESS: Decrypted data matches original!');
    } else {
      console.log('❌ FAILURE: Decrypted data does NOT match original!');
      console.log('\nExpected:');
      console.log(testData);
      console.log('\nGot:');
      console.log(finalData);
    }
  } catch (error) {
    console.error('❌ Decryption failed:', error);
  }
}

// Run the test
testEncryption().catch(console.error);

