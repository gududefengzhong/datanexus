import Irys from '@irys/sdk'

/**
 * Initialize Irys client (server-side only)
 * Configured with optimized settings for better reliability
 */
export function getIrysClient() {
  if (!process.env.IRYS_PRIVATE_KEY) {
    throw new Error('IRYS_PRIVATE_KEY not configured')
  }

  const network = process.env.IRYS_NETWORK || 'devnet'
  const token = process.env.IRYS_TOKEN || 'solana'

  // For Solana devnet, we need to provide the RPC URL
  const config: any = {
    network,
    token,
    key: process.env.IRYS_PRIVATE_KEY,
  }

  // Add RPC URL for devnet with optimized settings
  if (network === 'devnet' && token === 'solana') {
    config.config = {
      providerUrl: process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com',
      // Add timeout settings
      timeout: 60000, // 60 seconds timeout
    }
  }

  console.log(`🔌 Initializing Irys client (${network}, ${token})...`);

  return new Irys(config)
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Upload file to Irys with retry mechanism
 * Retries up to 3 times with exponential backoff
 */
export async function uploadToIrys(
  data: Buffer | string,
  contentType: string,
  metadata: Record<string, string> = {}
) {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Uploading to Irys (attempt ${attempt}/${maxRetries})...`);

      const irys = getIrysClient();

      const tags = [
        { name: 'Content-Type', value: contentType },
        { name: 'App-Name', value: 'DataNexus' },
        { name: 'App-Version', value: '1.0.0' },
        ...Object.entries(metadata).map(([name, value]) => ({ name, value })),
      ];

      const receipt = await irys.upload(data, { tags });

      console.log(`✅ Upload successful! Transaction ID: ${receipt.id}`);

      return {
        transactionId: receipt.id,
        url: `https://gateway.irys.xyz/${receipt.id}`,
        cost: (receipt as any).fee ? irys.utils.fromAtomic((receipt as any).fee) : '0',
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Upload attempt ${attempt} failed:`, error);

      // Check if it's a network error
      const isNetworkError =
        error instanceof Error &&
        (error.message.includes('ECONNRESET') ||
         error.message.includes('socket') ||
         error.message.includes('TLS') ||
         error.message.includes('network'));

      if (isNetworkError && attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying in ${delayMs / 1000} seconds...`);
        await sleep(delayMs);
      } else if (!isNetworkError) {
        // If it's not a network error, don't retry
        throw error;
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to upload to Irys after ${maxRetries} attempts. Last error: ${lastError?.message}`
  );
}

// Get Irys balance
export async function getIrysBalance() {
  const irys = getIrysClient()
  const balance = await irys.getLoadedBalance()
  return irys.utils.fromAtomic(balance)
}

// Fund Irys account
export async function fundIrys(amount: string) {
  const irys = getIrysClient()
  const atomicAmount = irys.utils.toAtomic(amount)
  const receipt = await irys.fund(atomicAmount)
  return receipt
}

// Get file from Irys
export async function getFromIrys(transactionId: string) {
  const url = `https://gateway.irys.xyz/${transactionId}`
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch from Irys: ${response.statusText}`)
  }
  
  return response
}

// Helper to generate Irys URL
export function getIrysUrl(transactionId: string) {
  return `https://gateway.irys.xyz/${transactionId}`
}

