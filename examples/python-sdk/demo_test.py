#!/usr/bin/env python3
"""
DataNexus Demo Test Script
Tests all features before recording the demo video
"""

import os
import sys
import time
from datetime import datetime
from datanexus_client import DataNexusClient

# ANSI color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    """Print a formatted header"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(60)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(text):
    """Print success message"""
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")

def print_error(text):
    """Print error message"""
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")

def print_info(text):
    """Print info message"""
    print(f"{Colors.OKCYAN}ℹ️  {text}{Colors.ENDC}")

def print_warning(text):
    """Print warning message"""
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")

def test_environment():
    """Test environment setup"""
    print_header("Testing Environment Setup")
    
    # Check API key
    api_key = os.getenv('DATANEXUS_API_KEY')
    if api_key:
        print_success(f"API Key found: {api_key[:10]}...")
    else:
        print_error("API Key not found in environment")
        print_info("Set DATANEXUS_API_KEY environment variable")
        return False
    
    # Check Solana private key
    solana_key = os.getenv('SOLANA_PRIVATE_KEY')
    if solana_key:
        print_success("Solana private key found")
    else:
        print_warning("Solana private key not found (needed for payments)")
    
    # Check base URL
    base_url = os.getenv('DATANEXUS_BASE_URL', 'https://xdatanexus.vercel.app')
    print_success(f"Base URL: {base_url}")
    
    return True

def test_search_datasets(client):
    """Test dataset search"""
    print_header("Test 1: Search Datasets")
    
    try:
        print_info("Searching for DeFi datasets...")
        result = client.search_datasets(
            query="DeFi",
            category="defi",
            max_price=1.0
        )
        
        if result.get('success'):
            datasets = result.get('data', {}).get('datasets', [])
            print_success(f"Found {len(datasets)} datasets")
            
            if datasets:
                print_info("\nFirst dataset:")
                ds = datasets[0]
                print(f"  📊 Name: {ds.get('name')}")
                print(f"  💰 Price: {ds.get('price')} USDC")
                print(f"  📁 Category: {ds.get('category')}")
                print(f"  ⭐ Rating: {ds.get('rating', 'N/A')}")
                return True, ds.get('id')
            else:
                print_warning("No datasets found")
                return False, None
        else:
            print_error(f"Search failed: {result.get('error')}")
            return False, None
            
    except Exception as e:
        print_error(f"Search error: {str(e)}")
        return False, None

def test_get_dataset_details(client, dataset_id):
    """Test getting dataset details"""
    print_header("Test 2: Get Dataset Details")

    if not dataset_id:
        print_warning("No dataset ID provided, skipping test")
        return False

    try:
        print_info(f"Fetching details for dataset: {dataset_id}")
        result = client.get_dataset(dataset_id)

        if result.get('success'):
            dataset = result.get('data', {})  # ✅ Fixed: data is the dataset directly
            print_success("Dataset details retrieved")
            print(f"\n  📊 Name: {dataset.get('name')}")
            print(f"  💰 Price: {dataset.get('price')} USDC")
            print(f"  📝 Description: {dataset.get('description', 'N/A')[:100]}...")
            print(f"  👤 Provider: {dataset.get('provider', {}).get('walletAddress', 'N/A')[:20]}...")
            print(f"  📥 Purchases: {dataset.get('purchases', 0)}")
            print(f"  👁️  Views: {dataset.get('views', 0)}")
            return True
        else:
            print_error(f"Failed to get details: {result.get('error')}")
            return False

    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_http_402_response(client, dataset_id):
    """Test HTTP 402 payment required response"""
    print_header("Test 3: HTTP 402 Payment Required (x402 Protocol)")

    if not dataset_id:
        print_warning("No dataset ID provided, skipping test")
        return False

    try:
        print_info(f"🛒 Starting x402 purchase flow simulation...")
        print_info(f"📋 Dataset ID: {dataset_id}")
        print()

        # Step 1: Try to download without payment
        print_info("📥 Step 1: Requesting download without payment...")
        print_info(f"   GET /api/agent/datasets/{dataset_id}/download")
        print_info(f"   Headers: {{ Authorization: Bearer <API_KEY> }}")
        print()

        result = client.download_dataset(dataset_id, auto_pay=False)

        if result.get('paymentRequired'):
            # Step 2: Received HTTP 402
            print_success("💰 Step 2: Received HTTP 402 Payment Required")
            print()
            print_info("📋 Payment Details:")
            print(f"   Amount: {result.get('amount')} {result.get('currency')}")
            print(f"   Recipient: {result.get('recipient', 'N/A')}")
            print(f"   Network: {result.get('network', 'solana')}")
            print(f"   Message: {result.get('message')}")
            print()

            # Step 3: Simulate payment (manual step)
            print_info("💳 Step 3: User needs to make Solana payment")
            print_info("   This can be done via:")
            print_info("   - Web UI (recommended)")
            print_info("   - Solana CLI")
            print_info("   - Phantom wallet")
            print()

            # Step 4: After payment, retry with transaction signature
            print_info("📥 Step 4: After payment, retry download with x-payment-token")
            print_info(f"   GET /api/agent/datasets/{dataset_id}/download")
            print_info(f"   Headers: {{")
            print_info(f"     Authorization: Bearer <API_KEY>,")
            print_info(f"     x-payment-token: <TRANSACTION_SIGNATURE>")
            print_info(f"   }}")
            print()

            print_success("✅ x402 protocol flow verified!")
            return True
        else:
            print_warning("Did not receive HTTP 402 (dataset might already be purchased)")
            return False

    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_purchase_history(client):
    """Test getting purchase history"""
    print_header("Test 4: Purchase History")

    try:
        print_info("Fetching purchase history...")
        result = client.get_purchases(limit=5)  # ✅ Fixed: use get_purchases

        if result.get('success'):
            data = result.get('data', {})
            purchases = data.get('purchases', [])
            pagination = data.get('pagination', {})

            print_success(f"Found {pagination.get('total', 0)} total purchases")

            if purchases:
                print_info(f"\nShowing {len(purchases)} recent purchases:")
                for i, purchase in enumerate(purchases[:3], 1):
                    product = purchase.get('product', {})
                    print(f"\n  {i}. {product.get('name', 'Unknown')}")
                    print(f"     💰 Amount: {purchase.get('amount')} USDC")
                    print(f"     📅 Date: {purchase.get('createdAt', 'N/A')[:10]}")
                    print(f"     ✅ Status: {purchase.get('status')}")
                    print(f"     🔗 TX: {purchase.get('paymentTxHash', 'N/A')[:20]}...")
            else:
                print_info("No purchases yet")
            return True
        else:
            print_error(f"Failed: {result.get('error')}")
            return False

    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_api_connectivity(client):
    """Test basic API connectivity"""
    print_header("Test 5: API Connectivity")
    
    try:
        print_info("Testing API connection...")
        
        # Try a simple search
        result = client.search_datasets(query="test", limit=1)
        
        if result.get('success') or result.get('data'):
            print_success("API is reachable and responding")
            return True
        else:
            print_error("API returned unexpected response")
            return False
            
    except Exception as e:
        print_error(f"API connection failed: {str(e)}")
        print_info("Check if the production URL is accessible")
        return False

def main():
    """Main test runner"""
    print(f"\n{Colors.BOLD}{Colors.HEADER}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║         DataNexus Demo Test Suite                         ║")
    print("║         Solana x402 Hackathon 2025                         ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}\n")
    
    print_info(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test environment
    if not test_environment():
        print_error("\nEnvironment setup failed. Please fix and try again.")
        sys.exit(1)
    
    # Initialize client
    try:
        base_url = os.getenv('DATANEXUS_BASE_URL', 'https://xdatanexus.vercel.app')
        api_key = os.getenv('DATANEXUS_API_KEY')
        
        client = DataNexusClient(
            base_url=base_url,
            api_key=api_key
        )
        print_success("DataNexus client initialized")
    except Exception as e:
        print_error(f"Failed to initialize client: {str(e)}")
        sys.exit(1)
    
    # Run tests
    results = {}
    
    # Test 1: API Connectivity
    results['connectivity'] = test_api_connectivity(client)
    
    # Test 2: Search
    success, dataset_id = test_search_datasets(client)
    results['search'] = success
    
    # Test 3: Dataset Details
    if dataset_id:
        results['details'] = test_get_dataset_details(client, dataset_id)
        
        # Test 4: HTTP 402
        results['http_402'] = test_http_402_response(client, dataset_id)
    else:
        print_warning("Skipping detail and HTTP 402 tests (no dataset found)")
        results['details'] = False
        results['http_402'] = False
    
    # Test 5: Purchase History
    results['history'] = test_purchase_history(client)
    
    # Summary
    print_header("Test Summary")
    
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {Colors.OKGREEN}{passed_tests}{Colors.ENDC}")
    print(f"Failed: {Colors.FAIL}{total_tests - passed_tests}{Colors.ENDC}")
    print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%\n")
    
    for test_name, result in results.items():
        status = f"{Colors.OKGREEN}✅ PASS{Colors.ENDC}" if result else f"{Colors.FAIL}❌ FAIL{Colors.ENDC}"
        print(f"  {test_name.upper()}: {status}")
    
    print(f"\n{Colors.BOLD}Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.ENDC}\n")
    
    if passed_tests == total_tests:
        print(f"{Colors.OKGREEN}{Colors.BOLD}🎉 All tests passed! Ready to record demo video!{Colors.ENDC}\n")
        return 0
    else:
        print(f"{Colors.WARNING}{Colors.BOLD}⚠️  Some tests failed. Fix issues before recording.{Colors.ENDC}\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())

