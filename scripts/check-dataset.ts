/**
 * Check dataset encryption details
 */

import { prisma } from '../lib/prisma';

async function checkDataset() {
  const datasetId = '6756abee-4087-4411-950a-ea2a7d9988f5';
  
  console.log('🔍 Checking dataset:', datasetId);
  console.log('');
  
  const dataset = await prisma.dataProduct.findUnique({
    where: { id: datasetId },
    select: {
      id: true,
      name: true,
      fileName: true,
      fileType: true,
      fileUrl: true,
      irysTransactionId: true,
      isEncrypted: true,
      encryptionMethod: true,
      encryptionVersion: true,
      encryptionKeyCiphertext: true,
      encryptionKeyIv: true,
      encryptionKeyAuthTag: true,
    },
  });
  
  if (!dataset) {
    console.log('❌ Dataset not found');
    return;
  }
  
  console.log('📊 Dataset Info:');
  console.log('  - Name:', dataset.name);
  console.log('  - File Name:', dataset.fileName);
  console.log('  - File Type:', dataset.fileType);
  console.log('  - File URL:', dataset.fileUrl);
  console.log('  - Irys TX ID:', dataset.irysTransactionId);
  console.log('');
  
  console.log('🔐 Encryption Info:');
  console.log('  - Is Encrypted:', dataset.isEncrypted);
  console.log('  - Encryption Method:', dataset.encryptionMethod);
  console.log('  - Encryption Version:', dataset.encryptionVersion);
  console.log('  - Has Key Ciphertext:', !!dataset.encryptionKeyCiphertext);
  console.log('  - Has Key IV:', !!dataset.encryptionKeyIv);
  console.log('  - Has Key AuthTag:', !!dataset.encryptionKeyAuthTag);
  console.log('');
  
  // Check what's actually stored on Irys
  console.log('📥 Fetching from Irys...');
  const response = await fetch(dataset.fileUrl);
  const text = await response.text();
  
  console.log('  - Response size:', text.length, 'chars');
  console.log('  - First 200 chars:', text.substring(0, 200));
  console.log('');
  
  // Try to parse as JSON
  try {
    const json = JSON.parse(text);
    console.log('  - ⚠️  File is JSON (old format!)');
    console.log('  - JSON keys:', Object.keys(json));
  } catch (e) {
    console.log('  - ✅ File is binary (new format)');
  }
  
  await prisma.$disconnect();
}

checkDataset().catch(console.error);

