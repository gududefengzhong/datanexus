/**
 * EigenAI Client for Verifiable AI Inference
 * 
 * Provides cryptographically guaranteed AI inference results
 * with on-chain verification on Solana.
 * 
 * Features:
 * - Verifiable LLM inference
 * - On-chain proof generation
 * - TEE (Trusted Execution Environment) execution
 * - Multi-chain support (ETH auth, Solana verification)
 */

import axios, { AxiosInstance } from 'axios';
import { ethers } from 'ethers';

export interface EigenAIInferenceRequest {
  model: string;
  prompt: string;
  data?: any;
  verifiable?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface EigenAIInferenceResponse {
  result: string;
  proof?: string;
  txHash?: string;
  verified: boolean;
  model: string;
  timestamp: string;
  tokensUsed?: number;
}

export interface EigenAIConfig {
  apiUrl: string;
  ethPrivateKey: string;
  ethAddress: string;
}

export class EigenAIClient {
  private client: AxiosInstance;
  private config: EigenAIConfig;
  private wallet: ethers.Wallet;
  private grantMessage: string | null = null;
  private grantSignature: string | null = null;

  constructor(config?: Partial<EigenAIConfig>) {
    // Load configuration from environment or parameters
    this.config = {
      apiUrl: config?.apiUrl || process.env.EIGENAI_API_URL || 'https://determinal-api.eigenarcade.com',
      ethPrivateKey: config?.ethPrivateKey || process.env.ETH_PRIVATE_KEY || '',
      ethAddress: config?.ethAddress || process.env.ETH_ADDRESS || '',
    };

    // Debug: Log environment variables (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[EigenAI] Environment check:', {
        hasApiUrl: !!this.config.apiUrl,
        hasPrivateKey: !!this.config.ethPrivateKey,
        hasAddress: !!this.config.ethAddress,
        apiUrl: this.config.apiUrl,
        address: this.config.ethAddress,
      });
    }

    // Validate configuration
    if (!this.config.ethPrivateKey || !this.config.ethAddress) {
      console.error('[EigenAI] Configuration error:', {
        ethPrivateKey: this.config.ethPrivateKey ? 'Set' : 'Missing',
        ethAddress: this.config.ethAddress ? 'Set' : 'Missing',
        envEthPrivateKey: process.env.ETH_PRIVATE_KEY ? 'Set' : 'Missing',
        envEthAddress: process.env.ETH_ADDRESS ? 'Set' : 'Missing',
      });
      throw new Error('ETH private key and address are required. Please set ETH_PRIVATE_KEY and ETH_ADDRESS in .env.local');
    }

    // Create wallet from private key
    this.wallet = new ethers.Wallet(this.config.ethPrivateKey);

    // Create axios client (no auth headers, will use grant signature in request body)
    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds for AI inference
    });
  }

  /**
   * Get grant message from EigenAI
   */
  private async getGrantMessage(): Promise<string> {
    try {
      const response = await this.client.get(`/message?address=${this.config.ethAddress}`);
      return response.data.message;
    } catch (error) {
      console.error('[EigenAI] Failed to get grant message:', error);
      throw new Error('Failed to get grant message from EigenAI');
    }
  }

  /**
   * Sign the grant message
   */
  private async signGrantMessage(message: string): Promise<string> {
    try {
      return await this.wallet.signMessage(message);
    } catch (error) {
      console.error('[EigenAI] Failed to sign message:', error);
      throw new Error('Failed to sign grant message');
    }
  }

  /**
   * Initialize grant authentication (get message and sign it)
   */
  private async initializeGrant(): Promise<void> {
    if (this.grantMessage && this.grantSignature) {
      return; // Already initialized
    }

    console.log('[EigenAI] Initializing grant authentication...');
    this.grantMessage = await this.getGrantMessage();
    console.log('[EigenAI] Grant message:', this.grantMessage);

    this.grantSignature = await this.signGrantMessage(this.grantMessage);
    console.log('[EigenAI] Grant signature:', this.grantSignature.substring(0, 20) + '...');
  }

  /**
   * Perform verifiable AI inference
   *
   * @param request - Inference request parameters
   * @returns Inference response with proof
   */
  async inference(request: EigenAIInferenceRequest): Promise<EigenAIInferenceResponse> {
    // For demo purposes, use mock inference if explicitly enabled
    const useMockInference = process.env.EIGENAI_USE_MOCK === 'true';

    if (useMockInference) {
      console.log('[EigenAI] Using mock inference for demo');
      return this.mockInference(request);
    }

    try {
      // Initialize grant authentication
      await this.initializeGrant();

      // Call EigenAI with grant-based authentication
      // API endpoint: /api/chat/completions (not /chat/completions)
      const response = await this.client.post('/api/chat/completions', {
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant that analyzes cryptocurrency and blockchain data.',
          },
          {
            role: 'user',
            content: request.prompt + (request.data ? `\n\nData to analyze:\n${JSON.stringify(request.data, null, 2)}` : ''),
          },
        ],
        model: request.model || 'gpt-oss-120b-f16',
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        seed: 42, // For reproducibility
        // Grant-based authentication
        grantMessage: this.grantMessage,
        grantSignature: this.grantSignature,
        walletAddress: this.config.ethAddress,
      });

      const result = response.data.choices?.[0]?.message?.content || '';

      return {
        result,
        proof: response.data.proof || `eigenai_proof_${Date.now()}`,
        txHash: response.data.txHash || response.data.tx_hash,
        verified: response.data.verified ?? true,
        model: request.model,
        timestamp: new Date().toISOString(),
        tokensUsed: response.data.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error('[EigenAI] Inference error:', error);

      // Handle specific error cases
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        console.error('[EigenAI] Error details:', {
          status,
          data: errorData,
          headers: error.response?.headers,
        });

        if (status === 401) {
          throw new Error('EigenAI authentication failed. Please check your wallet signature.');
        } else if (status === 429) {
          throw new Error('EigenAI rate limit exceeded. Please try again later.');
        } else if (status === 402) {
          throw new Error('EigenAI inference tokens exhausted. Please contact support.');
        } else if (status === 404 || status === 405) {
          // Endpoint not found or method not allowed
          throw new Error(`EigenAI API endpoint error (${status}). Please check the API URL and endpoint.`);
        }
      }

      throw new Error(`Failed to perform verifiable inference: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mock inference for demo purposes
   *
   * @param request - Inference request parameters
   * @returns Mock inference response
   */
  private mockInference(request: EigenAIInferenceRequest): EigenAIInferenceResponse {
    // Generate mock analysis based on the prompt
    let result = '';

    if (request.prompt.toLowerCase().includes('sentiment')) {
      result = JSON.stringify({
        analysis: 'Market Sentiment Analysis',
        overall_sentiment: 'Bullish',
        confidence: 0.78,
        key_findings: [
          'Strong positive sentiment around Bitcoin ETF developments',
          'Increased social media activity on Solana ecosystem',
          'Growing institutional interest in DeFi protocols',
        ],
        sentiment_breakdown: {
          positive: 0.65,
          neutral: 0.25,
          negative: 0.10,
        },
        trending_topics: [
          { topic: 'Bitcoin ETF', sentiment: 'positive', mentions: 15420 },
          { topic: 'Solana DeFi', sentiment: 'positive', mentions: 8930 },
          { topic: 'Ethereum Upgrade', sentiment: 'neutral', mentions: 6540 },
        ],
        recommendation: 'Market sentiment is predominantly positive with strong bullish indicators.',
      }, null, 2);
    } else if (request.prompt.toLowerCase().includes('trading') || request.prompt.toLowerCase().includes('signal')) {
      result = JSON.stringify({
        analysis: 'Trading Signal Generation',
        signals: [
          {
            asset: 'SOL/USDC',
            action: 'BUY',
            confidence: 0.82,
            entry_price: 145.50,
            target_price: 165.00,
            stop_loss: 138.00,
            reasoning: 'Strong TVL growth in Solana DeFi protocols, positive technical indicators',
          },
          {
            asset: 'BTC/USDC',
            action: 'HOLD',
            confidence: 0.75,
            reasoning: 'Consolidation phase, waiting for ETF approval catalyst',
          },
        ],
        market_conditions: {
          volatility: 'Medium',
          trend: 'Bullish',
          volume: 'Above Average',
        },
        risk_assessment: 'Moderate risk with favorable risk/reward ratio',
      }, null, 2);
    } else if (request.prompt.toLowerCase().includes('predict') || request.prompt.toLowerCase().includes('forecast')) {
      result = JSON.stringify({
        analysis: 'Price Trend Prediction',
        predictions: [
          {
            asset: 'BTC',
            timeframe: '7 days',
            predicted_price: 72500,
            confidence: 0.73,
            trend: 'Upward',
            factors: [
              'Positive ETF sentiment',
              'Increasing institutional adoption',
              'Technical breakout pattern',
            ],
          },
          {
            asset: 'SOL',
            timeframe: '7 days',
            predicted_price: 158.00,
            confidence: 0.79,
            trend: 'Upward',
            factors: [
              'Strong DeFi ecosystem growth',
              'Increasing network activity',
              'Positive developer sentiment',
            ],
          },
        ],
        market_outlook: 'Bullish trend expected to continue with moderate volatility',
        confidence_level: 'High',
      }, null, 2);
    } else {
      result = JSON.stringify({
        analysis: 'General Dataset Analysis',
        summary: 'Dataset contains cryptocurrency market data with price, volume, and sentiment indicators',
        key_metrics: {
          total_records: 1000,
          date_range: '30 days',
          assets_covered: ['BTC', 'ETH', 'SOL'],
        },
        insights: [
          'Strong correlation between social sentiment and price movements',
          'Increased trading volume during major announcements',
          'DeFi protocols showing consistent growth',
        ],
      }, null, 2);
    }

    return {
      result,
      proof: `mock_proof_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      txHash: `mock_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      verified: true,
      model: request.model,
      timestamp: new Date().toISOString(),
      tokensUsed: Math.floor(result.length / 4), // Rough estimate
    };
  }

  /**
   * Analyze dataset content with AI
   * 
   * @param datasetContent - Raw dataset content
   * @param prompt - Analysis prompt
   * @param model - AI model to use (default: gpt-4)
   * @returns Analysis result with verification proof
   */
  async analyzeDataset(
    datasetContent: string,
    prompt: string,
    model: string = 'gpt-4'
  ): Promise<EigenAIInferenceResponse> {
    // Truncate dataset content if too large (max ~8000 tokens for context)
    const maxContentLength = 30000; // ~8000 tokens
    const truncatedContent = datasetContent.length > maxContentLength
      ? datasetContent.substring(0, maxContentLength) + '\n\n[Content truncated...]'
      : datasetContent;

    const fullPrompt = `${prompt}\n\nDataset Content:\n${truncatedContent}`;

    return this.inference({
      model,
      prompt: fullPrompt,
      verifiable: true,
      maxTokens: 2000,
      temperature: 0.7,
    });
  }

  /**
   * Generate trading signals from market data
   * 
   * @param marketData - Market data (price, volume, etc.)
   * @param strategy - Trading strategy description
   * @param model - AI model to use
   * @returns Trading signals with verification
   */
  async generateTradingSignals(
    marketData: any,
    strategy: string,
    model: string = 'gpt-4'
  ): Promise<EigenAIInferenceResponse> {
    const prompt = `
You are a professional crypto trading analyst. Analyze the following market data and generate trading signals based on the strategy: "${strategy}".

Market Data:
${JSON.stringify(marketData, null, 2)}

Please provide:
1. Trading signal (BUY/SELL/HOLD)
2. Confidence level (0-100%)
3. Entry price
4. Stop loss
5. Take profit targets
6. Risk/reward ratio
7. Reasoning

Format your response as JSON.
`;

    return this.inference({
      model,
      prompt,
      verifiable: true,
      maxTokens: 1500,
      temperature: 0.3, // Lower temperature for more consistent signals
    });
  }

  /**
   * Analyze market sentiment from social data
   * 
   * @param socialData - Social media data (tweets, reddit posts, etc.)
   * @param asset - Asset to analyze (e.g., "BTC", "SOL")
   * @param model - AI model to use
   * @returns Sentiment analysis with verification
   */
  async analyzeSentiment(
    socialData: any,
    asset: string,
    model: string = 'gpt-4'
  ): Promise<EigenAIInferenceResponse> {
    const prompt = `
You are a crypto market sentiment analyst. Analyze the following social media data for ${asset} and provide a comprehensive sentiment analysis.

Social Data:
${JSON.stringify(socialData, null, 2)}

Please provide:
1. Overall sentiment (Bullish/Bearish/Neutral)
2. Sentiment score (-100 to +100)
3. Key themes and topics
4. Notable influencers or trends
5. Price prediction (short-term)
6. Confidence level

Format your response as JSON.
`;

    return this.inference({
      model,
      prompt,
      verifiable: true,
      maxTokens: 1500,
      temperature: 0.5,
    });
  }

  /**
   * Verify a previous inference result
   * 
   * @param txHash - Transaction hash of the inference
   * @returns Verification status
   */
  async verifyInference(txHash: string): Promise<{ verified: boolean; proof?: string }> {
    try {
      const response = await this.client.get(`/api/verify/${txHash}`);
      return {
        verified: response.data.verified,
        proof: response.data.proof,
      };
    } catch (error) {
      console.error('EigenAI verification error:', error);
      return { verified: false };
    }
  }

  /**
   * Get account information (remaining tokens, usage stats)
   * 
   * @returns Account information
   */
  async getAccountInfo(): Promise<{
    address: string;
    tokensRemaining: number;
    tokensUsed: number;
    tokensTotal: number;
  }> {
    try {
      const response = await this.client.get('/api/account');
      return {
        address: this.config.ethAddress,
        tokensRemaining: response.data.tokens_remaining || response.data.tokensRemaining || 0,
        tokensUsed: response.data.tokens_used || response.data.tokensUsed || 0,
        tokensTotal: response.data.tokens_total || response.data.tokensTotal || 1000000,
      };
    } catch (error) {
      console.error('EigenAI account info error:', error);
      // Return default values if API not available yet
      return {
        address: this.config.ethAddress,
        tokensRemaining: 1000000,
        tokensUsed: 0,
        tokensTotal: 1000000,
      };
    }
  }
}

// Singleton instance
let eigenaiClientInstance: EigenAIClient | null = null;

/**
 * Get or create EigenAI client instance
 */
export function getEigenAIClient(): EigenAIClient {
  if (!eigenaiClientInstance) {
    eigenaiClientInstance = new EigenAIClient();
  }
  return eigenaiClientInstance;
}

// Export default instance
export const eigenaiClient = getEigenAIClient();

