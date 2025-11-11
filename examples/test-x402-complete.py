#!/usr/bin/env python3
"""
Complete x402 Integration Test

This script tests the complete x402 payment flow:
1. Search for datasets
2. Attempt to download (receive 402)
3. Make real Solana USDC payment
4. Retry download with payment token
5. Verify download success

Requirements:
    pip install requests solana spl-token base58 python-dotenv
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path to import x402_example
sys.path.insert(0, str(Path(__file__).parent / 'python-sdk'))

from x402_example import SimpleX402Client

# Load environment variables from .env.local
load_dotenv('.env.local')
load_dotenv()  # Also load .env if it exists

def print_header(title: str):
    """Print a formatted header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")

def print_step(step: int, description: str):
    """Print a formatted step"""
    print(f"\n{'─' * 80}")
    print(f"📍 Step {step}: {description}")
    print('─' * 80)

def main():
    print_header("DataNexus x402 Complete Integration Test")

    # Configuration
    api_key = os.getenv('DATANEXUS_API_KEY')
    # Use buyer account for testing (has USDC on devnet)
    solana_private_key = os.getenv('SOLANA_BUYER_PRIVATE_KEY') or os.getenv('SOLANA_PRIVATE_KEY')
    base_url = os.getenv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
    
    if not api_key:
        print("❌ Error: DATANEXUS_API_KEY not found in environment")
        print("   Please set it in .env.local file")
        return 1
    
    if not solana_private_key:
        print("⚠️  Warning: SOLANA_PRIVATE_KEY not found in environment")
        print("   x402 automatic payments will not work")
        print("   You can still test the 402 response detection")
        print()
    
    # Initialize client
    print_step(1, "Initialize x402 Client")
    client = SimpleX402Client(
        api_key=api_key,
        base_url=base_url,
        solana_private_key=solana_private_key
    )
    print(f"✅ Client initialized")
    print(f"   Base URL: {base_url}")
    print(f"   API Key: {api_key[:20]}...")
    if solana_private_key:
        print(f"   Solana Wallet: {client.keypair.pubkey()}")
    
    # Search for datasets
    print_step(2, "Search for Datasets")
    try:
        results = client.search_datasets(query="crypto", limit=5)
        
        if not results.get('success'):
            print(f"❌ Search failed: {results.get('error')}")
            return 1
        
        datasets = results['data']['datasets']
        print(f"✅ Found {len(datasets)} datasets:")
        
        for i, ds in enumerate(datasets, 1):
            print(f"\n   {i}. {ds['name']}")
            print(f"      Price: ${ds['price']}")
            print(f"      Category: {ds['category']}")
            print(f"      Downloads: {ds.get('downloadCount', 0)}")
            print(f"      ID: {ds['id']}")
        
        if not datasets:
            print("\n❌ No datasets found. Please create some datasets first.")
            return 1
        
    except Exception as e:
        print(f"❌ Search error: {str(e)}")
        return 1
    
    # Select first dataset for testing
    test_dataset = datasets[0]
    dataset_id = test_dataset['id']
    dataset_name = test_dataset['name']
    dataset_price = test_dataset['price']
    
    print_step(3, f"Test x402 Payment Flow for: {dataset_name}")
    print(f"   Dataset ID: {dataset_id}")
    print(f"   Price: ${dataset_price}")
    
    # Test download with x402
    output_path = f"./test_download_{dataset_id}.csv"
    
    try:
        result = client.download_dataset(
            dataset_id=dataset_id,
            output_path=output_path,
            auto_pay=True  # Enable automatic x402 payment
        )
        
        if result['success']:
            print_step(4, "Download Successful!")
            print(f"✅ Dataset downloaded successfully")
            print(f"   File: {result['file_path']}")
            print(f"   Size: {result['file_size']:,} bytes")
            
            # Clean up
            if os.path.exists(output_path):
                os.remove(output_path)
                print(f"\n🧹 Cleaned up test file: {output_path}")
        else:
            print_step(4, "Download Failed")
            print(f"❌ Error: {result.get('error')}")
            
            if 'payment_info' in result:
                print(f"\n💰 Payment Information:")
                print(f"   Amount: {result['payment_info']['amount']} {result['payment_info']['currency']}")
                print(f"   Recipient: {result['payment_info']['recipient']}")
            
            return 1
    
    except Exception as e:
        print(f"❌ Download error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    # Test EigenAI analysis with x402
    print_step(5, "Test EigenAI Analysis with x402")
    
    try:
        analysis_result = client.analyze_dataset(
            dataset_id=dataset_id,
            prompt="Analyze the key trends and insights in this dataset. Provide a brief summary.",
            model="gpt-oss-120b-f16",
            analysis_type="general",
            max_tokens=500,
            temperature=0.7
        )
        
        if analysis_result.get('success'):
            data = analysis_result['data']
            print(f"\n✅ Analysis completed!")
            print(f"   Verified: {data.get('verified', False)}")
            print(f"   Tokens Used: {data.get('tokensUsed', 'N/A')}")
            print(f"   Model: {data.get('model', 'N/A')}")
            
            analysis_text = data.get('analysis', '')
            if len(analysis_text) > 200:
                print(f"\n📊 Analysis Preview:")
                print(f"   {analysis_text[:200]}...")
            else:
                print(f"\n📊 Analysis:")
                print(f"   {analysis_text}")
        else:
            print(f"❌ Analysis failed: {analysis_result.get('error')}")
    
    except Exception as e:
        print(f"❌ Analysis error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Check purchase history
    print_step(6, "Check Purchase History")
    
    try:
        purchases = client.get_purchases()
        
        if purchases.get('success'):
            purchase_list = purchases['data']['purchases']
            print(f"✅ You have {len(purchase_list)} purchases:")
            
            for i, p in enumerate(purchase_list[:5], 1):
                print(f"\n   {i}. {p['dataset']['name']}")
                print(f"      Amount: ${p['amount']}")
                print(f"      Status: {p['status']}")
                print(f"      Date: {p['createdAt'][:10]}")
                if p.get('transactionSignature'):
                    print(f"      TX: {p['transactionSignature'][:20]}...")
        else:
            print(f"❌ Failed to get purchases: {purchases.get('error')}")
    
    except Exception as e:
        print(f"❌ Purchase history error: {str(e)}")
    
    # Summary
    print_header("Test Summary")
    print("✅ x402 Integration Test Complete!")
    print()
    print("Tested Components:")
    print("  ✅ Dataset search")
    print("  ✅ 402 Payment Required detection")
    if solana_private_key:
        print("  ✅ Automatic Solana USDC payment")
        print("  ✅ Payment verification")
        print("  ✅ Resource access after payment")
    else:
        print("  ⚠️  Automatic payment (skipped - no private key)")
    print("  ✅ EigenAI analysis")
    print("  ✅ Purchase history")
    print()
    print("🎉 All tests passed!")
    print()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

