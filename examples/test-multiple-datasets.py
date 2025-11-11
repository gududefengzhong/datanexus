#!/usr/bin/env python3
"""
Test script for purchasing and downloading multiple datasets with x402 payment
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

# Add python-sdk directory to path
sys.path.insert(0, str(Path(__file__).parent / 'python-sdk'))

from datanexus_client import DataNexusClient

def main():
    print("=" * 80)
    print("  DataNexus - Multiple Datasets Purchase Test")
    print("=" * 80)
    print()

    # Initialize client
    print("📍 Step 1: Initialize Client")
    print("-" * 80)

    base_url = os.getenv('DATANEXUS_API_URL', 'http://localhost:3000')
    api_key = os.getenv('DATANEXUS_API_KEY')

    if not api_key:
        print("❌ Error: DATANEXUS_API_KEY environment variable not set")
        return 1

    client = DataNexusClient(
        api_key=api_key,
        base_url=base_url
    )

    print(f"✅ Client initialized")
    print(f"   Base URL: {base_url}")
    print(f"   API Key: {api_key[:20]}...")
    print()

    # Get purchase history
    print("📍 Step 2: Get Purchase History")
    print("-" * 80)

    try:
        result = client.get_purchases()
        # API returns { success: true, data: { purchases: [...], pagination: {...} } }
        if result.get('success'):
            purchases = result.get('data', {}).get('purchases', [])
        else:
            purchases = result.get('purchases', [])  # Fallback for old format

        print(f"✅ You have {len(purchases)} purchases:")
        print()

        for i, purchase in enumerate(purchases, 1):
            product = purchase.get('product', {})
            print(f"   {i}. {product.get('name', 'Unknown')}")
            print(f"      Price: ${purchase.get('amount', 0)}")
            print(f"      Status: {purchase.get('status', 'unknown')}")
            print(f"      Downloads: {purchase.get('downloadCount', 0)}")
            print(f"      Product ID: {product.get('id', 'unknown')}")
            print()
    except Exception as e:
        print(f"❌ Purchase history error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    # Download each purchased dataset
    print("📍 Step 3: Download All Purchased Datasets")
    print("-" * 80)

    successful_downloads = 0
    failed_downloads = 0

    for i, purchase in enumerate(purchases, 1):
        product = purchase.get('product', {})
        product_id = product.get('id')
        product_name = product.get('name', 'Unknown')
        price = purchase.get('amount', 0)

        print(f"\n[{i}/{len(purchases)}] Processing: {product_name}")
        print(f"   Price: ${price}")
        print(f"   Product ID: {product_id}")

        try:
            # Download dataset
            print(f"   📥 Downloading...")
            file_ext = product.get('fileType', 'csv')
            filename = f"./test_download_{product_id}.{file_ext}"

            # Use the client's download method
            client.download_dataset(product_id, filename)

            # Get file size
            file_size = os.path.getsize(filename)
            print(f"   ✅ Downloaded successfully!")
            print(f"      File: {filename}")
            print(f"      Size: {file_size:,} bytes")

            # Clean up
            os.remove(filename)
            print(f"   🧹 Cleaned up test file")

            successful_downloads += 1

        except Exception as e:
            print(f"   ❌ Failed: {e}")
            failed_downloads += 1
    
    # Summary
    print()
    print("=" * 80)
    print("  Test Summary")
    print("=" * 80)
    print()
    print(f"Total Purchases: {len(purchases)}")
    print(f"✅ Successful Downloads: {successful_downloads}")
    print(f"❌ Failed Downloads: {failed_downloads}")
    print()

    if failed_downloads == 0:
        print("🎉 All datasets downloaded successfully!")
        return 0
    else:
        print(f"⚠️  {failed_downloads} dataset(s) failed to download")
        return 1

if __name__ == '__main__':
    sys.exit(main())

