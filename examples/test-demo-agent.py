"""
Test Demo Agent with Real x402 Payments

This script tests the AI Analyst Agent with real Solana USDC payments.
"""

import sys
import os

# Add python-sdk directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sdk_dir = os.path.join(current_dir, 'python-sdk')
sys.path.insert(0, sdk_dir)

from x402_example import SimpleX402Client
import json

# Load environment variables from .env.local
def load_env_file():
    """Load environment variables from .env.local file"""
    # Go up two levels from examples/test-demo-agent.py to project root
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    env_path = os.path.join(project_root, '.env.local')

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


def test_search_and_purchase():
    """
    Test Case: Search for DeFi dataset and purchase with real x402 payment
    """
    print("\n" + "="*80)
    print("🧪 TEST: Search, Purchase, and Download with Real x402 Payment")
    print("="*80)
    
    # Initialize client
    API_KEY = os.getenv('DATANEXUS_API_KEY')
    SOLANA_PRIVATE_KEY = os.getenv('SOLANA_BUYER_PRIVATE_KEY')
    BASE_URL = os.getenv('DATANEXUS_BASE_URL', 'http://localhost:3000')
    
    if not SOLANA_PRIVATE_KEY:
        print("❌ Error: SOLANA_BUYER_PRIVATE_KEY not set")
        return
    
    client = SimpleX402Client(
        api_key=API_KEY,
        base_url=BASE_URL,
        solana_private_key=SOLANA_PRIVATE_KEY
    )
    
    # Step 1: Search for DeFi datasets
    print("\n📊 Step 1: Searching for DeFi datasets...")
    datasets = client.search_datasets(
        query="DeFi",
        category="defi",
        max_price=1.0,
        limit=5
    )
    
    if not datasets.get('success') or not datasets.get('data', {}).get('datasets'):
        print("❌ No DeFi datasets found")
        return
    
    dataset_list = datasets['data']['datasets']
    print(f"✅ Found {len(dataset_list)} datasets:")
    for i, ds in enumerate(dataset_list, 1):
        print(f"   {i}. {ds['name']}")
        print(f"      Price: ${ds['price']}")
        print(f"      Category: {ds['category']}")
        print(f"      File Type: {ds['fileType']}")
        print()
    
    # Step 2: Select first dataset
    dataset = dataset_list[0]
    dataset_id = dataset['id']
    
    print(f"\n📦 Step 2: Selected dataset: {dataset['name']}")
    print(f"   ID: {dataset_id}")
    print(f"   Price: ${dataset['price']} USDC")
    
    # Step 3: Download with automatic x402 payment
    print(f"\n💰 Step 3: Downloading with automatic x402 payment...")
    output_file = f"./test_download_{dataset_id}.csv"
    
    result = client.download_dataset(
        dataset_id=dataset_id,
        output_path=output_file,
        auto_pay=True  # Enable automatic payment
    )
    
    if result.get('success'):
        print(f"\n✅ SUCCESS! Dataset downloaded with real x402 payment")
        print(f"   File: {result['file_path']}")
        print(f"   Size: {result['file_size']:,} bytes")
        
        # Clean up
        if os.path.exists(output_file):
            os.remove(output_file)
            print(f"   🧹 Cleaned up test file")
        
        return True
    else:
        print(f"\n❌ FAILED: {result.get('error')}")
        return False


def test_analyze_with_eigenai():
    """
    Test Case: Analyze dataset with EigenAI verifiable inference
    """
    print("\n" + "="*80)
    print("🧪 TEST: Analyze Dataset with EigenAI")
    print("="*80)
    
    # Initialize client
    API_KEY = os.getenv('DATANEXUS_API_KEY')
    SOLANA_PRIVATE_KEY = os.getenv('SOLANA_BUYER_PRIVATE_KEY')
    BASE_URL = os.getenv('DATANEXUS_BASE_URL', 'http://localhost:3000')
    
    client = SimpleX402Client(
        api_key=API_KEY,
        base_url=BASE_URL,
        solana_private_key=SOLANA_PRIVATE_KEY
    )
    
    # Step 1: Get purchased datasets
    print("\n📊 Step 1: Getting purchased datasets...")
    purchases = client.get_purchases()
    
    if not purchases.get('success'):
        print("❌ Failed to get purchases")
        return False
    
    purchase_list = purchases.get('data', {}).get('purchases', [])
    if not purchase_list:
        print("❌ No purchased datasets found")
        return False
    
    print(f"✅ Found {len(purchase_list)} purchased datasets")
    
    # Step 2: Select first purchased dataset
    purchase = purchase_list[0]
    product = purchase.get('product', {})
    dataset_id = product.get('id')
    dataset_name = product.get('name')
    
    print(f"\n📦 Step 2: Selected dataset: {dataset_name}")
    print(f"   ID: {dataset_id}")
    
    # Step 3: Analyze with EigenAI
    print(f"\n🤖 Step 3: Analyzing with EigenAI...")
    
    analysis = client.analyze_dataset(
        dataset_id=dataset_id,
        prompt="""Analyze this DeFi protocol data and provide insights.

IMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text.

Required JSON structure:
{
  "summary": "<brief summary>",
  "key_insights": [<array of insights>],
  "top_protocols": [<array of top protocols>],
  "confidence_level": <number 0-100>
}

Respond with ONLY the JSON object, nothing else.""",
        model="gpt-oss-120b-f16",
        analysis_type="general",
        temperature=0.3
    )
    
    if analysis.get('success'):
        data = analysis.get('data', {})
        print(f"\n✅ SUCCESS! EigenAI analysis completed")
        print(f"   Verified: {data.get('verified', False)}")
        print(f"   Tokens Used: {data.get('tokensUsed', 'N/A')}")
        if data.get('txHash'):
            print(f"   Verification TX: {data['txHash']}")
        
        print(f"\n📊 Analysis Result:")
        analysis_text = data.get('analysis', 'No result')
        print(f"   {analysis_text[:500]}...")
        
        return True
    else:
        print(f"\n❌ FAILED: {analysis.get('error')}")
        return False


def main():
    """
    Run all tests
    """
    print("\n" + "="*80)
    print("🚀 DEMO AGENT TEST SUITE - Real x402 Payments")
    print("="*80)
    print("\nThis test suite will:")
    print("1. Search for DeFi datasets")
    print("2. Purchase with real Solana USDC payment (0.1 USDC)")
    print("3. Download and decrypt the dataset")
    print("4. Analyze with EigenAI verifiable inference")
    print("="*80)
    
    # Check USDC balance first
    print("\n💰 Checking USDC balance...")
    os.system("python scripts/check-usdc-balance.py 2>&1 | grep -A 5 'Buyer Account'")
    
    # Test 1: Search and Purchase
    test1_passed = test_search_and_purchase()
    
    # Test 2: Analyze with EigenAI
    test2_passed = test_analyze_with_eigenai()
    
    # Summary
    print("\n" + "="*80)
    print("📋 TEST SUMMARY")
    print("="*80)
    print(f"✅ Search & Purchase: {'PASSED' if test1_passed else 'FAILED'}")
    print(f"✅ EigenAI Analysis: {'PASSED' if test2_passed else 'FAILED'}")
    print("="*80)
    
    if test1_passed and test2_passed:
        print("\n🎉 ALL TESTS PASSED!")
        print("\n✅ Demo Agent is ready with real x402 payments!")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")


if __name__ == "__main__":
    main()

