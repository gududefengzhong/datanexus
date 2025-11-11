"""
AI Analyst Agent - DataNexus Demo

This agent demonstrates the complete workflow of:
1. Searching for datasets
2. Purchasing with x402 automatic payment
3. Analyzing with EigenAI verifiable inference
4. Generating actionable insights

Use Cases:
- Market sentiment analysis
- Trading signal generation
- Price prediction
- Risk assessment

Requirements:
    pip install requests solana spl-token base58
"""

import sys
import os

# Add parent directory to path to import x402_example
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'python-sdk'))

from x402_example import SimpleX402Client
import json

# Load environment variables from .env.local
def load_env_file():
    """Load environment variables from .env.local file"""
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env.local')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes from value
                    value = value.strip().strip('"').strip("'")
                    os.environ[key] = value

load_env_file()


class AIAnalystAgent:
    """
    Autonomous AI Analyst Agent
    
    Capabilities:
    - Search and evaluate datasets
    - Automatic payment via x402
    - Verifiable AI analysis via EigenAI
    - Generate trading signals and predictions
    """
    
    def __init__(self, api_key: str, solana_private_key: str, base_url: str = "http://localhost:3000"):
        self.client = SimpleX402Client(
            api_key=api_key,
            base_url=base_url,
            solana_private_key=solana_private_key
        )
        self.base_url = base_url
    
    def analyze_market_sentiment(self):
        """
        Use Case 1: Market Sentiment Analysis
        
        Workflow:
        1. Search for Twitter/social sentiment datasets
        2. Purchase the best dataset
        3. Analyze sentiment with EigenAI
        4. Generate market prediction
        """
        print("\n" + "="*80)
        print("🎯 USE CASE 1: MARKET SENTIMENT ANALYSIS")
        print("="*80)
        
        # Step 1: Search for sentiment datasets
        print("\n📊 Step 1: Searching for sentiment datasets...")
        datasets = self.client.search_datasets(
            query="Twitter crypto sentiment",
            category="social"
        )
        
        if not datasets.get('success') or not datasets.get('data', {}).get('datasets'):
            print("❌ No sentiment datasets found")
            return None
        
        # Select the first dataset
        dataset = datasets['data']['datasets'][0]
        print(f"✅ Found dataset: {dataset['name']}")
        print(f"   Price: ${dataset['price']}")
        print(f"   Description: {dataset['description'][:100]}...")
        
        # Step 2: Analyze with EigenAI (will auto-purchase if needed)
        print(f"\n🤖 Step 2: Analyzing sentiment with EigenAI...")
        analysis = self.client.analyze_dataset(
            dataset_id=dataset['id'],
            prompt="""You are a professional crypto market analyst. Analyze the social media sentiment data provided.

IMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text, thinking process, or channel markers.

Required JSON structure:
{
  "overall_sentiment": "Bullish" | "Bearish" | "Neutral",
  "sentiment_score": <number between -100 and 100>,
  "key_themes": [<array of strings>],
  "trending_topics": [<array of strings>],
  "price_prediction_24h": {
    "BTC": {"predicted_price": <number>, "change_percent": <number>},
    "ETH": {"predicted_price": <number>, "change_percent": <number>},
    "SOL": {"predicted_price": <number>, "change_percent": <number>}
  },
  "confidence_level": <number between 0 and 100>,
  "summary": "<brief summary of findings>"
}

Respond with ONLY the JSON object, nothing else.""",
            model="gpt-oss-120b-f16",  # EigenAI model
            analysis_type="sentiment"
        )
        
        if analysis.get('success'):
            print("\n✅ Sentiment Analysis Complete!")
            print(f"\n📊 Results:")
            print(json.dumps(analysis['data'], indent=2))
            return analysis['data']
        else:
            print(f"\n❌ Analysis failed: {analysis.get('error')}")
            return None
    
    def generate_trading_signals(self):
        """
        Use Case 2: Trading Signal Generation
        
        Workflow:
        1. Search for DeFi/DEX trading data
        2. Purchase the dataset
        3. Generate trading signals with EigenAI
        4. Output actionable trades
        """
        print("\n" + "="*80)
        print("📈 USE CASE 2: TRADING SIGNAL GENERATION")
        print("="*80)
        
        # Step 1: Search for trading datasets
        print("\n📊 Step 1: Searching for DeFi trading datasets...")
        datasets = self.client.search_datasets(
            query="Solana DEX trading",
            category="defi"
        )
        
        if not datasets.get('success') or not datasets.get('data', {}).get('datasets'):
            print("❌ No trading datasets found")
            return None
        
        # Select the first dataset
        dataset = datasets['data']['datasets'][0]
        print(f"✅ Found dataset: {dataset['name']}")
        print(f"   Price: ${dataset['price']}")
        
        # Step 2: Generate trading signals with EigenAI
        print(f"\n🤖 Step 2: Generating trading signals with EigenAI...")
        analysis = self.client.analyze_dataset(
            dataset_id=dataset['id'],
            prompt="""You are a professional DeFi trading analyst. Analyze the DeFi protocol TVL data provided.

IMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text, thinking process, or channel markers.

Note: This is for educational and informational purposes only, not financial advice.

Required JSON structure:
{
  "market_analysis": {
    "top_protocols": [{"name": "<string>", "tvl": <number>, "chain": "<string>", "trend": "Growing" | "Stable" | "Declining"}],
    "total_tvl": <number>,
    "dominant_chain": "<string>",
    "market_trend": "Bullish" | "Bearish" | "Neutral"
  },
  "insights": [<array of key insights as strings>],
  "opportunities": [<array of potential opportunities as strings>],
  "risk_factors": [<array of risk factors as strings>],
  "confidence_level": <number between 0 and 100>,
  "summary": "<brief summary of findings>",
  "disclaimer": "This analysis is for educational purposes only and should not be considered financial advice."
}

Respond with ONLY the JSON object, nothing else.""",
            model="gpt-oss-120b-f16",  # EigenAI model
            analysis_type="trading-signals",
            temperature=0.3  # Lower temperature for more consistent signals
        )
        
        if analysis.get('success'):
            print("\n✅ Trading Signals Generated!")
            print(f"\n📊 Results:")
            print(json.dumps(analysis['data'], indent=2))
            return analysis['data']
        else:
            print(f"\n❌ Signal generation failed: {analysis.get('error')}")
            return None
    
    def predict_price_trends(self):
        """
        Use Case 3: Price Prediction
        
        Workflow:
        1. Search for historical price datasets
        2. Purchase the dataset
        3. Predict future prices with EigenAI
        4. Generate confidence intervals
        """
        print("\n" + "="*80)
        print("🔮 USE CASE 3: PRICE TREND PREDICTION")
        print("="*80)
        
        # Step 1: Search for price datasets
        print("\n📊 Step 1: Searching for price history datasets...")
        datasets = self.client.search_datasets(
            query="SOL price history",
            category="market"
        )
        
        if not datasets.get('success') or not datasets.get('data', {}).get('datasets'):
            print("❌ No price datasets found")
            return None
        
        # Select the first dataset
        dataset = datasets['data']['datasets'][0]
        print(f"✅ Found dataset: {dataset['name']}")
        print(f"   Price: ${dataset['price']}")
        
        # Step 2: Predict prices with EigenAI
        print(f"\n🤖 Step 2: Predicting price trends with EigenAI...")
        analysis = self.client.analyze_dataset(
            dataset_id=dataset['id'],
            prompt="""You are a professional crypto market analyst. Analyze the market sentiment and price data provided.

IMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text, thinking process, or channel markers.

Note: This is for educational and informational purposes only, not financial advice.

Required JSON structure:
{
  "market_overview": {
    "total_market_cap": <number>,
    "btc_dominance": <number>,
    "fear_greed_index": <number>,
    "overall_trend": "Bullish" | "Bearish" | "Neutral"
  },
  "asset_predictions": {
    "BTC": {
      "current_price": <number>,
      "7d_forecast": [<array of 7 daily price predictions>],
      "trend": "Uptrend" | "Downtrend" | "Sideways",
      "support_levels": [<array of numbers>],
      "resistance_levels": [<array of numbers>]
    },
    "ETH": {
      "current_price": <number>,
      "7d_forecast": [<array of 7 daily price predictions>],
      "trend": "Uptrend" | "Downtrend" | "Sideways",
      "support_levels": [<array of numbers>],
      "resistance_levels": [<array of numbers>]
    },
    "SOL": {
      "current_price": <number>,
      "7d_forecast": [<array of 7 daily price predictions>],
      "trend": "Uptrend" | "Downtrend" | "Sideways",
      "support_levels": [<array of numbers>],
      "resistance_levels": [<array of numbers>]
    }
  },
  "risk_factors": [<array of risk factors as strings>],
  "confidence_level": <number between 0 and 100>,
  "summary": "<brief summary of findings>",
  "disclaimer": "This analysis is for educational purposes only and should not be considered financial advice."
}

Respond with ONLY the JSON object, nothing else.""",
            model="gpt-oss-120b-f16",  # EigenAI model
            analysis_type="prediction"
        )
        
        if analysis.get('success'):
            print("\n✅ Price Prediction Complete!")
            print(f"\n📊 Results:")
            print(json.dumps(analysis['data'], indent=2))
            return analysis['data']
        else:
            print(f"\n❌ Prediction failed: {analysis.get('error')}")
            return None
    
    def run_all_analyses(self):
        """
        Run all analysis use cases
        """
        print("\n" + "="*80)
        print("🚀 AI ANALYST AGENT - COMPLETE DEMO")
        print("="*80)
        print("\nThis agent will demonstrate:")
        print("1. Market Sentiment Analysis")
        print("2. Trading Signal Generation")
        print("3. Price Trend Prediction")
        print("\nAll powered by x402 payments + EigenAI verifiable inference")
        print("="*80)
        
        results = {}
        
        # Run all analyses
        results['sentiment'] = self.analyze_market_sentiment()
        results['trading_signals'] = self.generate_trading_signals()
        results['price_prediction'] = self.predict_price_trends()
        
        # Summary
        print("\n" + "="*80)
        print("📋 ANALYSIS SUMMARY")
        print("="*80)
        
        for analysis_type, result in results.items():
            if result:
                print(f"\n✅ {analysis_type.upper()}: Success")
                print(f"   Verified: {result.get('verified', False)}")
                if result.get('txHash'):
                    print(f"   Proof TX: {result['txHash']}")
            else:
                print(f"\n❌ {analysis_type.upper()}: Failed")
        
        print("\n" + "="*80)
        print("🎉 Demo Complete!")
        print("="*80)
        
        return results


def main():
    """
    Main entry point
    """
    # Load configuration from environment
    API_KEY = os.getenv('DATANEXUS_API_KEY', 'sk_OTk0YjJkNGQtNTY3Yi00MjJkLWI1OGYt')
    # Use buyer account for testing (has USDC on devnet)
    SOLANA_PRIVATE_KEY = os.getenv('SOLANA_BUYER_PRIVATE_KEY') or os.getenv('SOLANA_PRIVATE_KEY')
    BASE_URL = os.getenv('DATANEXUS_BASE_URL', 'http://localhost:3000')

    if not SOLANA_PRIVATE_KEY:
        print("❌ Error: SOLANA_BUYER_PRIVATE_KEY or SOLANA_PRIVATE_KEY environment variable not set")
        print("\nPlease set it in your .env.local file:")
        print("SOLANA_BUYER_PRIVATE_KEY='your_buyer_private_key_here'")
        return
    
    # Create agent
    agent = AIAnalystAgent(
        api_key=API_KEY,
        solana_private_key=SOLANA_PRIVATE_KEY,
        base_url=BASE_URL
    )
    
    # Run all analyses
    agent.run_all_analyses()


if __name__ == "__main__":
    main()

