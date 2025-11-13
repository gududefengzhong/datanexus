/**
 * AI Analysis API Endpoint
 * 
 * Allows AI agents to analyze purchased datasets using EigenAI
 * verifiable inference.
 * 
 * Features:
 * - x402 payment verification
 * - EigenAI verifiable inference
 * - On-chain proof generation
 * - Multiple analysis types
 * 
 * @swagger
 * /api/agent/datasets/{id}/analyze:
 *   post:
 *     summary: Analyze dataset with verifiable AI
 *     description: |
 *       Perform AI analysis on a purchased dataset using EigenAI verifiable inference.
 *       
 *       **Requirements:**
 *       - Valid API key
 *       - Dataset must be purchased (or payment via x402)
 *       
 *       **Features:**
 *       - Cryptographically verified AI results
 *       - On-chain proof generation
 *       - Multiple AI models supported
 *       
 *       **x402 Payment Flow:**
 *       1. Request without prior purchase → 402 Payment Required
 *       2. Agent pays via x402 protocol
 *       3. Request with payment token → Analysis performed
 *     tags:
 *       - Agent API
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset ID
 *       - in: header
 *         name: x-payment-token
 *         schema:
 *           type: string
 *         description: Payment token (Solana transaction signature)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Analysis prompt/question
 *                 example: "Analyze the overall market sentiment and predict price trends"
 *               model:
 *                 type: string
 *                 description: AI model to use
 *                 default: "gpt-4"
 *                 enum: ["gpt-4", "gpt-3.5-turbo", "claude-2"]
 *               analysisType:
 *                 type: string
 *                 description: Type of analysis
 *                 enum: ["general", "sentiment", "trading-signals", "prediction"]
 *                 default: "general"
 *               maxTokens:
 *                 type: integer
 *                 description: Maximum tokens for response
 *                 default: 2000
 *               temperature:
 *                 type: number
 *                 description: Temperature for AI generation (0-1)
 *                 default: 0.7
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     datasetId:
 *                       type: string
 *                     datasetName:
 *                       type: string
 *                     analysis:
 *                       type: string
 *                       description: AI analysis result
 *                     verified:
 *                       type: boolean
 *                       description: Whether the result is cryptographically verified
 *                     proof:
 *                       type: string
 *                       description: Cryptographic proof of inference
 *                     txHash:
 *                       type: string
 *                       description: Solana transaction hash for verification
 *                     model:
 *                       type: string
 *                     tokensUsed:
 *                       type: integer
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       402:
 *         description: Payment Required
 *         headers:
 *           x-payment-amount:
 *             schema:
 *               type: string
 *             description: Amount in USDC
 *           x-payment-currency:
 *             schema:
 *               type: string
 *             description: Currency (USDC)
 *           x-payment-recipient:
 *             schema:
 *               type: string
 *             description: Seller's Solana address
 *           x-payment-network:
 *             schema:
 *               type: string
 *             description: Network (solana-devnet)
 *           x-payment-facilitator:
 *             schema:
 *               type: string
 *             description: Facilitator URL
 *       401:
 *         description: Unauthorized - Invalid API key
 *       404:
 *         description: Dataset not found
 *       500:
 *         description: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-auth';
import { getEigenAIClient } from '@/lib/eigenai-client';
import { prisma } from '@/lib/prisma';

/**
 * Helper function to create a 402 Payment Required response
 */
function createPaymentRequiredResponse(params: {
  amount: string;
  currency: string;
  recipient: string;
  network: string;
  description: string;
}): NextResponse {
  const facilitatorUrl = process.env.X402_FACILITATOR_URL || 'https://facilitator.payai.network';

  const response = NextResponse.json(
    {
      success: false,
      error: {
        code: 'PAYMENT_REQUIRED',
        message: params.description,
        details: {
          price: params.amount,
          currency: params.currency,
          network: params.network,
        },
      },
    },
    { status: 402 }
  );

  // Set x402 payment headers
  response.headers.set('x-payment-amount', params.amount);
  response.headers.set('x-payment-currency', params.currency);
  response.headers.set('x-payment-recipient', params.recipient);
  response.headers.set('x-payment-facilitator', facilitatorUrl);
  response.headers.set('x-payment-network', params.network);

  return response;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Analyze] Starting analysis request');

    // Await params (Next.js 16 requirement)
    const { id } = await params;
    console.log('[Analyze] Dataset ID:', id);

    // 1. Verify API Key
    const apiKeyHeader = request.headers.get('authorization');
    console.log('[Analyze] API key header:', apiKeyHeader ? 'present' : 'missing');

    if (!apiKeyHeader || !apiKeyHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 401 }
      );
    }

    const apiKey = apiKeyHeader.substring(7);
    console.log('[Analyze] Verifying API key...');
    const user = await verifyApiKey(apiKey);

    if (!user) {
      console.log('[Analyze] API key verification failed');
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }

    console.log('[Analyze] User verified:', user.id);

    // 2. Get dataset
    console.log('[Analyze] Fetching dataset...');
    const dataset = await prisma.dataProduct.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!dataset) {
      console.log('[Analyze] Dataset not found');
      return NextResponse.json(
        { success: false, error: 'Dataset not found' },
        { status: 404 }
      );
    }

    console.log('[Analyze] Dataset found:', dataset.name);

    // 3. Check if user has purchased the dataset
    console.log('[Analyze] Checking purchase status...');
    const purchase = await prisma.order.findFirst({
      where: {
        buyerId: user.id,
        productId: id,
        status: 'completed',
      },
    });

    if (!purchase) {
      console.log('[Analyze] No purchase found, returning 402');
      // Return 402 Payment Required
      return createPaymentRequiredResponse({
        amount: dataset.price.toString(),
        currency: 'USDC',
        recipient: dataset.provider.walletAddress,
        network: process.env.X402_NETWORK || 'solana-devnet',
        description: `AI analysis for dataset: ${dataset.name}`,
      });
    }

    console.log('[Analyze] Purchase verified');

    // 4. Parse request body
    console.log('[Analyze] Parsing request body...');
    const body = await request.json();
    const {
      prompt,
      model = 'gpt-4',
      analysisType = 'general',
      maxTokens = 2000,
      temperature = 0.7,
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // 5. Get dataset content from Irys (with decryption if needed)
    console.log('[Analyze API] Fetching dataset content from Irys...');
    console.log('[Analyze API] Irys Transaction ID:', dataset.irysTransactionId);
    console.log('[Analyze API] Is Encrypted:', dataset.isEncrypted);
    console.log('[Analyze API] Encryption Method:', dataset.encryptionMethod);

    const datasetContent = await getDatasetContent(
      dataset.irysTransactionId,
      dataset.isEncrypted,
      dataset.encryptionMethod,
      dataset.fileUrl,
      dataset.encryptionKeyCiphertext,
      dataset.encryptionKeyIv,
      dataset.encryptionKeyAuthTag
    );

    console.log('[Analyze API] Dataset content retrieved:');
    console.log('[Analyze API] Content length:', datasetContent?.length || 0);
    console.log('[Analyze API] Content type:', typeof datasetContent);
    console.log('[Analyze API] Content preview:', datasetContent?.substring(0, 200) + '...');

    // Check if content is valid
    if (!datasetContent || datasetContent.length === 0) {
      console.error('[Analyze API] Dataset content is empty!');
      return NextResponse.json(
        { success: false, error: 'Dataset content is empty or could not be retrieved' },
        { status: 500 }
      );
    }

    // 6. Initialize EigenAI client
    console.log('[Analyze API] Initializing EigenAI client...');
    console.log('[Analyze API] Environment check:', {
      hasEthPrivateKey: !!process.env.ETH_PRIVATE_KEY,
      hasEthAddress: !!process.env.ETH_ADDRESS,
      hasApiUrl: !!process.env.EIGENAI_API_URL,
      ethAddress: process.env.ETH_ADDRESS,
      apiUrl: process.env.EIGENAI_API_URL,
    });

    const eigenai = getEigenAIClient();
    console.log('[Analyze API] EigenAI client initialized successfully');

    // 7. Perform verifiable AI inference based on analysis type
    let analysis;
    
    try {
      switch (analysisType) {
        case 'sentiment':
          // Parse dataset as social data
          const socialData = JSON.parse(datasetContent);
          analysis = await eigenai.analyzeSentiment(socialData, 'crypto', model);
          break;

        case 'trading-signals':
          // Parse dataset as market data
          const marketData = JSON.parse(datasetContent);
          analysis = await eigenai.generateTradingSignals(marketData, prompt, model);
          break;

        case 'general':
        case 'prediction':
        default:
          // General dataset analysis
          analysis = await eigenai.analyzeDataset(datasetContent, prompt, model);
          break;
      }
    } catch (parseError) {
      // If JSON parsing fails, treat as text dataset
      analysis = await eigenai.analyzeDataset(datasetContent, prompt, model);
    }

    // 8. Return analysis result
    return NextResponse.json({
      success: true,
      data: {
        datasetId: id,
        datasetName: dataset.name,
        analysisType,
        analysis: analysis.result,
        verified: analysis.verified,
        proof: analysis.proof,
        txHash: analysis.txHash,
        model: analysis.model,
        tokensUsed: analysis.tokensUsed,
        timestamp: analysis.timestamp,
      },
    });

  } catch (error) {
    console.error('[Analyze API] AI analysis error:', error);
    console.error('[Analyze API] Error type:', error instanceof Error ? 'Error' : typeof error);
    console.error('[Analyze API] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[Analyze API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Handle specific EigenAI errors
    if (error instanceof Error) {
      if (error.message.includes('authentication failed')) {
        return NextResponse.json(
          { success: false, error: 'EigenAI authentication failed. Please contact support.', details: error.message },
          { status: 500 }
        );
      } else if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please try again later.', details: error.message },
          { status: 429 }
        );
      } else if (error.message.includes('tokens exhausted')) {
        return NextResponse.json(
          { success: false, error: 'AI inference quota exhausted. Please contact support.', details: error.message },
          { status: 402 }
        );
      } else if (error.message.includes('ETH private key')) {
        return NextResponse.json(
          { success: false, error: 'EigenAI configuration error. Please check environment variables.', details: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze dataset',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch dataset content from Irys (with decryption support)
 */
async function getDatasetContent(
  irysId: string,
  isEncrypted: boolean = false,
  encryptionMethod: string | null = null,
  fileUrl: string | null = null,
  encryptionKeyCiphertext: string | null = null,
  encryptionKeyIv: string | null = null,
  encryptionKeyAuthTag: string | null = null
): Promise<string> {
  console.log('[getDatasetContent] Fetching content for Irys ID:', irysId);
  console.log('[getDatasetContent] Is Encrypted:', isEncrypted);

  // For demo datasets (mock Irys IDs), return sample data
  if (irysId.startsWith('sample_') || irysId.startsWith('demo_')) {
    console.log('[getDatasetContent] Using mock data for demo dataset');
    return getMockDatasetContent(irysId);
  }

  try {
    const url = fileUrl || `https://gateway.irys.xyz/${irysId}`;
    console.log('[getDatasetContent] Fetching from URL:', url);

    const response = await fetch(url);
    console.log('[getDatasetContent] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[getDatasetContent] Error response:', errorText);
      throw new Error(`Failed to fetch dataset from Irys: ${response.status} ${response.statusText}`);
    }

    // If encrypted, decrypt the content
    if (isEncrypted && encryptionMethod === 'hybrid') {
      console.log('[getDatasetContent] Decrypting encrypted content...');

      const encryptedBuffer = Buffer.from(await response.arrayBuffer());

      // Get IV and AuthTag from Irys metadata
      const metadataUrl = `https://gateway.irys.xyz/tx/${url.split('/').pop()}`;
      const metadataResponse = await fetch(metadataUrl);
      const metadata = await metadataResponse.json();

      const iv = metadata.tags?.find((t: any) => t.name === 'Encryption-IV')?.value;
      const authTag = metadata.tags?.find((t: any) => t.name === 'Encryption-AuthTag')?.value;

      if (!iv || !authTag) {
        throw new Error('Missing encryption metadata');
      }

      // Decrypt encryption key
      const masterKey = process.env.MASTER_ENCRYPTION_KEY;
      if (!masterKey) {
        throw new Error('Master encryption key not configured');
      }

      if (!encryptionKeyCiphertext || !encryptionKeyIv || !encryptionKeyAuthTag) {
        throw new Error('Missing encryption key data');
      }

      const { decryptData } = await import('@/lib/encryption');

      const encryptionKeyBuffer = decryptData(
        encryptionKeyCiphertext,
        encryptionKeyIv,
        encryptionKeyAuthTag,
        masterKey
      );

      const encryptionKey = encryptionKeyBuffer.toString('utf-8');

      // Decrypt file
      const decryptedBuffer = decryptData(
        encryptedBuffer.toString('base64'),
        iv,
        authTag,
        encryptionKey
      );

      const content = decryptedBuffer.toString('utf-8');
      console.log('[getDatasetContent] Content decrypted, length:', content.length);
      console.log('[getDatasetContent] Content preview:', content.substring(0, 200));

      return content;
    } else {
      // Non-encrypted content
      const content = await response.text();
      console.log('[getDatasetContent] Content retrieved, length:', content.length);
      console.log('[getDatasetContent] Content preview:', content.substring(0, 200));

      return content;
    }
  } catch (error) {
    console.error('[getDatasetContent] Error fetching dataset from Irys:', error);
    console.error('[getDatasetContent] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Failed to retrieve dataset content: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get mock dataset content for demo purposes
 */
function getMockDatasetContent(irysId: string): string {
  // Sample crypto market data
  const mockData = {
    timestamp: new Date().toISOString(),
    data: [
      {
        symbol: 'BTC',
        price: 67500,
        change_24h: 2.5,
        volume: 28500000000,
        sentiment: 'bullish',
        social_mentions: 15420,
      },
      {
        symbol: 'ETH',
        price: 3200,
        change_24h: 3.2,
        volume: 12300000000,
        sentiment: 'bullish',
        social_mentions: 8950,
      },
      {
        symbol: 'SOL',
        price: 145,
        change_24h: 5.8,
        volume: 2100000000,
        sentiment: 'very_bullish',
        social_mentions: 12300,
      },
    ],
    market_summary: {
      total_market_cap: 2450000000000,
      btc_dominance: 52.3,
      fear_greed_index: 68,
      trending_topics: ['Bitcoin ETF', 'Solana DeFi', 'Ethereum Upgrade'],
    },
  };

  return JSON.stringify(mockData, null, 2);
}

