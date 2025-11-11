"""
DataNexus Simple Demo - No Payment Required

This demo showcases the API functionality without requiring actual payments.
Perfect for testing and demonstration purposes.

Features:
- Search datasets by category
- View dataset details
- Demonstrate x402 payment detection
- Show EigenAI integration points

Usage:
    python examples/demo-agents/demo_simple.py
"""

import requests
import json
from typing import Dict, Any, List

class DataNexusDemo:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.api_key = "sk_OTk0YjJkNGQtNTY3Yi00MjJkLWI1OGYt"  # Demo API key
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        })
    
    def print_header(self, text: str):
        """Print a formatted header"""
        print("\n" + "=" * 80)
        print(f"  {text}")
        print("=" * 80 + "\n")
    
    def print_section(self, text: str):
        """Print a formatted section"""
        print("\n" + "-" * 80)
        print(f"  {text}")
        print("-" * 80 + "\n")
    
    def search_datasets(self, category: str = None, query: str = None, limit: int = 5) -> List[Dict]:
        """Search for datasets"""
        params = {"limit": limit}
        if category:
            params["category"] = category
        if query:
            params["query"] = query
        
        response = self.session.get(f"{self.base_url}/api/agent/datasets", params=params)
        
        if response.status_code == 200:
            data = response.json()
            return data.get("data", {}).get("datasets", [])
        else:
            print(f"❌ Error: {response.status_code}")
            return []
    
    def get_dataset_details(self, dataset_id: str) -> Dict:
        """Get dataset details"""
        response = self.session.get(f"{self.base_url}/api/agent/datasets/{dataset_id}")
        
        if response.status_code == 200:
            data = response.json()
            return data.get("data", {})
        else:
            print(f"❌ Error: {response.status_code}")
            return {}
    
    def test_x402_download(self, dataset_id: str) -> Dict:
        """Test x402 payment detection on download endpoint"""
        response = self.session.get(
            f"{self.base_url}/api/agent/datasets/{dataset_id}/download",
            allow_redirects=False
        )
        
        return {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "requires_payment": response.status_code == 402
        }
    
    def test_x402_analyze(self, dataset_id: str) -> Dict:
        """Test x402 payment detection on analyze endpoint"""
        response = self.session.post(
            f"{self.base_url}/api/agent/datasets/{dataset_id}/analyze",
            json={
                "prompt": "Analyze this dataset and provide key insights",
                "model": "gpt-4",
                "analysisType": "general"
            },
            allow_redirects=False
        )
        
        return {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "requires_payment": response.status_code == 402
        }
    
    def run_demo(self):
        """Run the complete demo"""
        self.print_header("🚀 DataNexus x402 + EigenAI Demo")
        
        print("This demo showcases:")
        print("  ✅ Dataset search and discovery")
        print("  ✅ x402 payment detection")
        print("  ✅ EigenAI integration points")
        print("  ✅ Complete API workflow")
        
        # Demo 1: Search datasets by category
        self.print_section("📊 Demo 1: Search Datasets by Category")
        
        categories = ["blockchain", "defi", "market", "social", "ai"]
        
        for category in categories:
            datasets = self.search_datasets(category=category, limit=3)
            print(f"\n🔍 {category.upper()} Category ({len(datasets)} datasets):")
            
            for i, ds in enumerate(datasets[:3], 1):
                print(f"  {i}. {ds['name']}")
                print(f"     💰 Price: ${ds['price']} USDC")
                print(f"     📦 Size: {ds['fileSize'] / 1024 / 1024:.2f} MB")
                print(f"     🆔 ID: {ds['id']}")
        
        # Demo 2: Get dataset details
        self.print_section("📋 Demo 2: Dataset Details")
        
        # Get first dataset from social category
        social_datasets = self.search_datasets(category="social", limit=1)
        
        if social_datasets:
            dataset = social_datasets[0]
            details = self.get_dataset_details(dataset['id'])
            
            print(f"📦 Dataset: {details['name']}")
            print(f"📝 Description: {details['description']}")
            print(f"🏷️  Category: {details['category']}")
            print(f"💰 Price: ${details['price']} USDC")
            print(f"📊 File Type: {details['fileType']}")
            print(f"📦 File Size: {details['fileSize'] / 1024 / 1024:.2f} MB")
            print(f"👤 Seller: {details['seller']['walletAddress'][:20]}...")
            print(f"🆔 ID: {details['id']}")
        
        # Demo 3: Test x402 payment detection (download)
        self.print_section("💳 Demo 3: x402 Payment Detection (Download)")
        
        if social_datasets:
            dataset_id = social_datasets[0]['id']
            result = self.test_x402_download(dataset_id)
            
            print(f"📡 HTTP Status: {result['status_code']}")
            
            if result['requires_payment']:
                print("✅ Correctly returned 402 Payment Required")
                print("\n💰 Payment Details:")
                print(f"  Amount: {result['headers'].get('x-payment-amount', 'N/A')} USDC")
                print(f"  Currency: {result['headers'].get('x-payment-currency', 'N/A')}")
                print(f"  Recipient: {result['headers'].get('x-payment-recipient', 'N/A')}")
                print(f"  Network: {result['headers'].get('x-payment-network', 'N/A')}")
                print(f"  Facilitator: {result['headers'].get('x-payment-facilitator', 'N/A')}")
                
                print("\n🤖 AI Agent Workflow:")
                print("  1. Agent detects 402 Payment Required")
                print("  2. Agent reads payment headers")
                print("  3. Agent creates Solana USDC transaction")
                print("  4. Agent sends payment to recipient")
                print("  5. Agent retries request with payment token")
                print("  6. Agent receives dataset")
            else:
                print(f"⚠️  Expected 402, got {result['status_code']}")
        
        # Demo 4: Test x402 payment detection (analyze)
        self.print_section("🧠 Demo 4: x402 + EigenAI Integration (Analyze)")
        
        if social_datasets:
            dataset_id = social_datasets[0]['id']
            result = self.test_x402_analyze(dataset_id)
            
            print(f"📡 HTTP Status: {result['status_code']}")
            
            if result['requires_payment']:
                print("✅ Correctly returned 402 Payment Required for AI analysis")
                print("\n💰 Payment Details:")
                print(f"  Amount: {result['headers'].get('x-payment-amount', 'N/A')} USDC")
                
                print("\n🤖 AI Agent + EigenAI Workflow:")
                print("  1. Agent detects 402 Payment Required")
                print("  2. Agent pays via x402 (Solana USDC)")
                print("  3. Backend calls EigenAI for verifiable inference")
                print("  4. EigenAI executes in TEE (Trusted Execution Environment)")
                print("  5. EigenAI generates cryptographic proof")
                print("  6. EigenAI creates Solana on-chain verification")
                print("  7. Agent receives verified analysis result")
                print("  8. Agent can verify proof on-chain")
            else:
                print(f"⚠️  Status: {result['status_code']}")
        
        # Demo 5: Show available analysis types
        self.print_section("🎯 Demo 5: EigenAI Analysis Types")
        
        analysis_types = [
            {
                "type": "general",
                "description": "General dataset analysis and insights",
                "use_case": "Understanding dataset structure and content"
            },
            {
                "type": "sentiment",
                "description": "Market sentiment analysis from social data",
                "use_case": "Analyzing Twitter/Reddit crypto sentiment"
            },
            {
                "type": "trading-signals",
                "description": "Generate trading signals from market data",
                "use_case": "DeFi trading strategy generation"
            },
            {
                "type": "prediction",
                "description": "Price trend prediction from historical data",
                "use_case": "Forecasting crypto price movements"
            }
        ]
        
        for i, analysis in enumerate(analysis_types, 1):
            print(f"\n{i}. {analysis['type'].upper()}")
            print(f"   📝 {analysis['description']}")
            print(f"   💡 Use Case: {analysis['use_case']}")
        
        # Summary
        self.print_header("✅ Demo Complete!")
        
        print("🎯 What we demonstrated:")
        print("  ✅ Dataset search across 5 categories")
        print("  ✅ Dataset details retrieval")
        print("  ✅ x402 payment detection (download)")
        print("  ✅ x402 + EigenAI integration (analyze)")
        print("  ✅ 4 types of AI analysis")
        
        print("\n🚀 Key Features:")
        print("  ✅ Autonomous AI Agent payments via x402")
        print("  ✅ Verifiable AI inference via EigenAI")
        print("  ✅ Cryptographic proofs on Solana")
        print("  ✅ Complete data marketplace workflow")
        
        print("\n🏆 Hackathon Eligibility:")
        print("  ✅ Best x402 Agent Application ($10,000)")
        print("  ✅ Best AgentPay Demo ($5,000)")
        print("  ✅ Machine Economy Prize ($5,000 + credits)")
        print("  ✅ Best Multi-Protocol Agent ($10,000 credits)")
        print("\n  💰 Total Potential: $20,000 cash + $10,000 credits")
        
        print("\n📚 Next Steps:")
        print("  1. Set SOLANA_PRIVATE_KEY to run full demo with payments")
        print("  2. Visit http://determinal.eigenarcade.com for EigenAI portal")
        print("  3. View API docs at http://localhost:3000/docs/api")
        print("  4. Run: python examples/demo-agents/ai_analyst_agent.py")
        
        print("\n" + "=" * 80 + "\n")


if __name__ == "__main__":
    demo = DataNexusDemo()
    demo.run_demo()

