/**
 * Test the /api/decrypt endpoint
 */

async function testDecryptAPI() {
  const datasetId = '6756abee-4087-4411-950a-ea2a7d9988f5';
  const baseUrl = 'http://localhost:3000';
  
  // You need to get a valid auth token first
  // For now, let's just test if the endpoint exists
  
  console.log('🧪 Testing /api/decrypt endpoint');
  console.log('Dataset ID:', datasetId);
  console.log('');
  
  // Get auth token from environment or prompt
  const authToken = process.env.AUTH_TOKEN;
  
  if (!authToken) {
    console.log('❌ AUTH_TOKEN not set');
    console.log('Please set AUTH_TOKEN environment variable with a valid JWT token');
    console.log('');
    console.log('To get a token:');
    console.log('1. Open browser dev tools');
    console.log('2. Go to Application > Local Storage');
    console.log('3. Find "auth_token"');
    console.log('4. Copy the value');
    console.log('5. Run: export AUTH_TOKEN="your_token_here"');
    return;
  }
  
  console.log('🔑 Auth token found');
  console.log('');
  
  try {
    console.log('📤 Sending request to /api/decrypt...');
    const response = await fetch(`${baseUrl}/api/decrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        productId: datasetId,
      }),
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:');
    response.headers.forEach((value, key) => {
      console.log(`  - ${key}: ${value}`);
    });
    console.log('');
    
    if (!response.ok) {
      const error = await response.json();
      console.log('❌ Error response:');
      console.log(JSON.stringify(error, null, 2));
      return;
    }
    
    // Get the response as buffer
    const buffer = await response.arrayBuffer();
    const data = Buffer.from(buffer);
    
    console.log('✅ Response received');
    console.log('  - Size:', data.length, 'bytes');
    console.log('  - First 200 chars:', data.toString('utf8').substring(0, 200));
    console.log('');
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(data.toString('utf8'));
      console.log('  - ⚠️  Response is JSON (unexpected!)');
      console.log('  - JSON keys:', Object.keys(json));
    } catch (e) {
      console.log('  - ✅ Response is binary/text (expected)');
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testDecryptAPI().catch(console.error);

