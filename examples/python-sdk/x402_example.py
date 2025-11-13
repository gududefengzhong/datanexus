"""
DataNexus x402 + EigenAI Example

This example demonstrates how an AI Agent can autonomously:
1. Search for datasets
2. Detect 402 Payment Required responses
3. Automatically make Solana payments
4. Download the purchased dataset
5. Analyze datasets with EigenAI verifiable inference

Requirements:
    pip install requests solana spl-token base58
"""

import requests
from typing import Optional, Dict, Any
import json
import os
from solana.rpc.api import Client
from solders.transaction import Transaction
from solana.rpc.types import TxOpts
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import TransferParams, transfer
from solders.message import Message
import base58

# Try to import SPL token, but make it optional for demo
try:
    from spl.token.instructions import transfer_checked, TransferCheckedParams
    from spl.token.constants import TOKEN_PROGRAM_ID
    SPL_AVAILABLE = True
except ImportError:
    SPL_AVAILABLE = False
    print("Warning: spl-token not available, using SOL transfers instead")


class SimpleX402Client:
    """
    x402 client with real Solana payment support

    Features:
    1. Automatic 402 detection
    2. Real USDC SPL token transfers on Solana
    3. Payment verification
    4. Retry logic
    """

    # USDC token mint address on Solana devnet
    USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
    USDC_DECIMALS = 6

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://xdatanexus.vercel.app",
        solana_private_key: Optional[str] = None,
        solana_rpc_url: str = "https://api.devnet.solana.com"
    ):
        self.api_key = api_key
        self.base_url = base_url
        self.solana_rpc_url = solana_rpc_url

        # Backup RPC URLs in case primary fails
        self.backup_rpc_urls = [
            "https://api.devnet.solana.com",
            "https://rpc.ankr.com/solana_devnet",
            "https://solana-devnet-rpc.allthatnode.com",
        ]

        # Initialize Solana client with retry
        self.solana_client = self._init_solana_client(solana_rpc_url)

        # Load private key from parameter or environment
        if solana_private_key:
            self.keypair = self._load_keypair(solana_private_key)
        elif os.getenv('SOLANA_PRIVATE_KEY'):
            self.keypair = self._load_keypair(os.getenv('SOLANA_PRIVATE_KEY'))
        else:
            self.keypair = None

        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })

    def _init_solana_client(self, rpc_url: str) -> Client:
        """Initialize Solana client with fallback to backup RPCs"""
        try:
            client = Client(rpc_url)
            # Test connection
            client.get_latest_blockhash()
            print(f"✅ Connected to Solana RPC: {rpc_url}")
            return client
        except Exception as e:
            print(f"⚠️  Primary RPC failed ({rpc_url}): {str(e)[:50]}")

            # Try backup RPCs
            for backup_url in self.backup_rpc_urls:
                if backup_url == rpc_url:
                    continue
                try:
                    print(f"   Trying backup RPC: {backup_url}")
                    client = Client(backup_url)
                    client.get_latest_blockhash()
                    print(f"   ✅ Connected to backup RPC: {backup_url}")
                    self.solana_rpc_url = backup_url
                    return client
                except Exception as backup_error:
                    print(f"   ❌ Backup RPC failed: {str(backup_error)[:50]}")
                    continue

            # All RPCs failed
            raise Exception("Failed to connect to any Solana RPC node")

    def _load_keypair(self, private_key: str) -> Keypair:
        """Load Solana keypair from private key string"""
        try:
            # Try base58 format first
            secret_key = base58.b58decode(private_key)
            return Keypair.from_bytes(secret_key)
        except:
            # Try JSON array format
            try:
                secret_key = json.loads(private_key)
                return Keypair.from_bytes(bytes(secret_key))
            except:
                raise ValueError("Invalid private key format. Use base58 or JSON array format.")
    
    def _handle_402_response(self, response: requests.Response) -> Optional[str]:
        """
        Handle 402 Payment Required response by making a real Solana payment

        Returns:
            Payment token (transaction signature) if payment successful
        """
        # Extract payment information from headers
        amount_str = response.headers.get('x-payment-amount')
        currency = response.headers.get('x-payment-currency', 'USDC')
        recipient = response.headers.get('x-payment-recipient')
        network = response.headers.get('x-payment-network')
        facilitator = response.headers.get('x-payment-facilitator')

        print(f"\n💰 Payment Required:")
        print(f"   Amount: {amount_str} {currency}")
        print(f"   Recipient: {recipient}")
        print(f"   Network: {network}")
        print(f"   Facilitator: {facilitator}")

        if not self.keypair:
            print("\n❌ No Solana private key provided!")
            print("   To enable automatic payments, set SOLANA_PRIVATE_KEY environment variable")
            print("   or initialize with: client = SimpleX402Client(api_key='...', solana_private_key='...')")
            return None

        try:
            # Convert amount to lamports (USDC has 6 decimals)
            amount = float(amount_str)
            amount_lamports = int(amount * (10 ** self.USDC_DECIMALS))

            print(f"\n🔄 Making real Solana payment...")
            print(f"   From: {self.keypair.pubkey()}")
            print(f"   To: {recipient}")
            print(f"   Amount: {amount} USDC ({amount_lamports} lamports)")

            # Create and send USDC transfer transaction
            signature = self._transfer_usdc(
                recipient_address=recipient,
                amount_lamports=amount_lamports
            )

            print(f"✅ Payment successful!")
            print(f"   Transaction: {signature}")
            print(f"   Explorer: https://explorer.solana.com/tx/{signature}?cluster=devnet")

            return signature

        except Exception as e:
            print(f"\n❌ Payment failed: {str(e)}")
            return None

    def _transfer_usdc(self, recipient_address: str, amount_lamports: int, max_retries: int = 3) -> str:
        """
        Transfer USDC tokens on Solana with retry mechanism

        Args:
            recipient_address: Recipient's Solana address
            amount_lamports: Amount in lamports (USDC has 6 decimals)
            max_retries: Maximum number of retry attempts

        Returns:
            Transaction signature
        """
        import time

        for attempt in range(max_retries):
            try:
                print(f"\n🔄 Attempt {attempt + 1}/{max_retries}...")

                # Get sender's USDC token account
                sender_token_account = self._get_associated_token_address(
                    str(self.keypair.pubkey()),
                    self.USDC_MINT_DEVNET
                )

                # Get recipient's USDC token account
                recipient_token_account = self._get_associated_token_address(
                    recipient_address,
                    self.USDC_MINT_DEVNET
                )

                # Create transfer instruction
                transfer_ix = transfer_checked(
                    TransferCheckedParams(
                        program_id=TOKEN_PROGRAM_ID,
                        source=Pubkey.from_string(sender_token_account),
                        mint=Pubkey.from_string(self.USDC_MINT_DEVNET),
                        dest=Pubkey.from_string(recipient_token_account),
                        owner=self.keypair.pubkey(),
                        amount=amount_lamports,
                        decimals=self.USDC_DECIMALS,
                    )
                )

                # Create transaction
                print("   Getting latest blockhash...")
                recent_blockhash = self.solana_client.get_latest_blockhash().value.blockhash

                # Build transaction with new API
                from solders.message import Message
                message = Message.new_with_blockhash(
                    [transfer_ix],
                    self.keypair.pubkey(),
                    recent_blockhash
                )
                transaction = Transaction([self.keypair], message, recent_blockhash)

                # Send transaction
                print("   Sending transaction...")
                result = self.solana_client.send_transaction(
                    transaction,
                    opts=TxOpts(skip_preflight=False, preflight_commitment="confirmed")
                )

                # Wait for confirmation
                from solders.signature import Signature
                signature = str(result.value)
                print(f"   Transaction sent: {signature[:20]}...")

                # Convert string to Signature object for confirmation
                try:
                    print("   Waiting for confirmation...")
                    sig_obj = Signature.from_string(signature)
                    self.solana_client.confirm_transaction(sig_obj, commitment="confirmed")
                    print("   ✅ Transaction confirmed!")
                except Exception as e:
                    # If confirmation fails, still return the signature
                    print(f"   ⚠️  Confirmation warning: {e}")
                    print(f"   Transaction may still be processing...")

                return signature

            except Exception as e:
                error_msg = str(e)
                print(f"   ❌ Attempt {attempt + 1} failed: {error_msg[:100]}")

                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2  # 2s, 4s, 6s
                    print(f"   Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    # Last attempt failed
                    raise Exception(f"Failed to send transaction after {max_retries} attempts: {error_msg}")

    def _get_associated_token_address(self, owner: str, mint: str) -> str:
        """
        Get associated token account address using proper ATA derivation
        """
        from spl.token.constants import ASSOCIATED_TOKEN_PROGRAM_ID

        owner_pubkey = Pubkey.from_string(owner)
        mint_pubkey = Pubkey.from_string(mint)

        # Derive ATA address using find_program_address
        seeds = [
            bytes(owner_pubkey),
            bytes(TOKEN_PROGRAM_ID),
            bytes(mint_pubkey),
        ]

        ata, _ = Pubkey.find_program_address(seeds, ASSOCIATED_TOKEN_PROGRAM_ID)
        return str(ata)
    
    def search_datasets(
        self,
        query: str = "",
        category: Optional[str] = None,
        max_price: Optional[float] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """Search for datasets"""
        params = {"limit": limit}
        if query:
            params['q'] = query  # API uses 'q' not 'query'
        if category:
            params['category'] = category
        if max_price is not None:
            params['maxPrice'] = max_price

        response = self.session.get(f"{self.base_url}/api/agent/datasets", params=params)
        response.raise_for_status()
        return response.json()
    
    def get_dataset_details(self, dataset_id: str) -> Dict[str, Any]:
        """Get dataset details"""
        response = self.session.get(f"{self.base_url}/api/agent/datasets/{dataset_id}")
        response.raise_for_status()
        return response.json()
    
    def download_dataset(
        self,
        dataset_id: str,
        output_path: str,
        auto_pay: bool = True
    ) -> Dict[str, Any]:
        """
        Download a dataset with automatic x402 payment
        
        Args:
            dataset_id: Dataset ID to download
            output_path: Path to save the downloaded file
            auto_pay: If True, automatically handle 402 payments
        
        Returns:
            Download result information
        """
        url = f"{self.base_url}/api/agent/datasets/{dataset_id}/download"
        
        print(f"\n📥 Requesting dataset: {dataset_id}")
        
        # First attempt - may return 402
        response = self.session.get(url)
        
        # Handle 402 Payment Required
        if response.status_code == 402:
            print("\n⚠️  Payment required to access this dataset")
            
            if not auto_pay:
                print("❌ Auto-pay disabled. Set auto_pay=True to enable automatic payment.")
                return {
                    "success": False,
                    "error": "Payment required",
                    "payment_info": {
                        "amount": response.headers.get('x-payment-amount'),
                        "currency": response.headers.get('x-payment-currency'),
                        "recipient": response.headers.get('x-payment-recipient'),
                    }
                }
            
            # Attempt automatic payment
            payment_token = self._handle_402_response(response)
            
            if not payment_token:
                return {
                    "success": False,
                    "error": "Payment failed - no Solana private key provided"
                }
            
            # Retry with payment token
            print(f"\n🔄 Retrying download with payment token...")
            response = self.session.get(
                url,
                headers={"x-payment-token": payment_token}
            )
        
        # Check if download was successful
        if response.status_code == 200:
            # Save file
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            file_size = len(response.content)
            print(f"\n✅ Dataset downloaded successfully!")
            print(f"   Saved to: {output_path}")
            print(f"   Size: {file_size:,} bytes")
            
            return {
                "success": True,
                "file_path": output_path,
                "file_size": file_size,
            }
        else:
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else {}
            print(f"\n❌ Download failed: {response.status_code}")
            print(f"   Error: {error_data.get('error', {}).get('message', 'Unknown error')}")
            
            return {
                "success": False,
                "error": error_data.get('error', {}).get('message', 'Download failed'),
                "status_code": response.status_code,
            }
    
    def get_purchases(self, limit: int = 50, page: int = 1) -> Dict[str, Any]:
        """
        Get purchase history

        Args:
            limit: Maximum number of purchases to return (1-100)
            page: Page number for pagination

        Returns:
            Purchase history with pagination info
        """
        params = {
            'limit': min(limit, 100),
            'page': page
        }
        response = self.session.get(
            f"{self.base_url}/api/agent/purchases",
            params=params
        )
        response.raise_for_status()
        return response.json()

    def get_purchase_history(self, limit: int = 50, page: int = 1) -> Dict[str, Any]:
        """Alias for get_purchases()"""
        return self.get_purchases(limit=limit, page=page)

    def analyze_dataset(
        self,
        dataset_id: str,
        prompt: str,
        model: str = "gpt-4",
        analysis_type: str = "general",
        max_tokens: int = 2000,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Analyze a dataset with EigenAI verifiable inference

        Args:
            dataset_id: Dataset ID to analyze
            prompt: Analysis prompt/question
            model: AI model to use (gpt-4, gpt-3.5-turbo, claude-2)
            analysis_type: Type of analysis (general, sentiment, trading-signals, prediction)
            max_tokens: Maximum tokens for response
            temperature: Temperature for AI generation (0-1)

        Returns:
            Analysis result with verification proof
        """
        url = f"{self.base_url}/api/agent/datasets/{dataset_id}/analyze"

        print(f"\n🤖 Analyzing dataset with EigenAI...")
        print(f"   Dataset ID: {dataset_id}")
        print(f"   Model: {model}")
        print(f"   Analysis Type: {analysis_type}")

        # Make analysis request
        response = self.session.post(
            url,
            json={
                "prompt": prompt,
                "model": model,
                "analysisType": analysis_type,
                "maxTokens": max_tokens,
                "temperature": temperature,
            }
        )

        # Handle 402 Payment Required
        if response.status_code == 402:
            print(f"\n💰 Payment required for analysis...")

            # Make payment
            payment_token = self._handle_402_response(response)

            if not payment_token:
                return {
                    "success": False,
                    "error": "Payment failed - no Solana private key provided"
                }

            # Retry with payment token
            print(f"\n🔄 Retrying analysis with payment token...")
            response = self.session.post(
                url,
                json={
                    "prompt": prompt,
                    "model": model,
                    "analysisType": analysis_type,
                    "maxTokens": max_tokens,
                    "temperature": temperature,
                },
                headers={"x-payment-token": payment_token}
            )

        # Check if analysis was successful
        if response.status_code == 200:
            result = response.json()
            data = result.get('data', {})

            print(f"\n✅ Analysis completed successfully!")
            print(f"   Verified: {data.get('verified', False)}")
            print(f"   Tokens Used: {data.get('tokensUsed', 'N/A')}")
            if data.get('txHash'):
                print(f"   Verification TX: {data['txHash']}")

            print(f"\n📊 Analysis Result:")
            print(f"   {data.get('analysis', 'No result')[:500]}...")

            return result
        else:
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else {}
            print(f"\n❌ Analysis failed: {response.status_code}")
            print(f"   Error: {error_data.get('error', 'Unknown error')}")

            return {
                "success": False,
                "error": error_data.get('error', 'Analysis failed'),
                "status_code": response.status_code,
            }


def main():
    """
    Example usage of the x402 client
    """
    print("=" * 60)
    print("  DataNexus x402 Payment Demo")
    print("=" * 60)
    
    # Initialize client
    # Note: Replace with your actual API key
    client = SimpleX402Client(
        api_key="sk_Y2MwZTJjMjAtZDI3Mi00YmEwLWFkYzAt",
        # Uncomment and add your Solana private key to enable real payments:
        # solana_private_key="YOUR_SOLANA_PRIVATE_KEY_HERE"
    )
    
    # Example 1: Search for datasets
    print("\n📊 Searching for datasets...")
    results = client.search_datasets(query="solana", max_price=1.0)
    
    if results['success']:
        datasets = results['data']['datasets']
        print(f"\nFound {len(datasets)} datasets:")
        for ds in datasets[:3]:  # Show first 3
            print(f"  - {ds['name']} (${ds['price']})")
    
    # Example 2: Get dataset details
    if datasets:
        dataset_id = datasets[0]['id']
        print(f"\n📋 Getting details for dataset: {dataset_id}")
        details = client.get_dataset_details(dataset_id)

        if details['success']:
            ds = details['data']
            print(f"\nDataset: {ds['name']}")
            print(f"Price: ${ds['price']}")
            print(f"Provider: {ds.get('provider', {}).get('walletAddress', 'N/A')[:8]}...")
            print(f"Purchases: {ds.get('purchases', 0)}")
            print(f"Views: {ds.get('views', 0)}")
    
    # Example 3: Try to download (will trigger 402 if not purchased)
    print("\n" + "=" * 60)
    print("  Testing x402 Payment Flow")
    print("=" * 60)
    
    if datasets:
        dataset_id = datasets[0]['id']
        result = client.download_dataset(
            dataset_id=dataset_id,
            output_path=f"./downloaded_{dataset_id}.csv",
            auto_pay=True  # Enable automatic payment
        )
        
        if result['success']:
            print("\n🎉 Success! Dataset downloaded.")
        else:
            print(f"\n⚠️  Download not completed: {result.get('error')}")
    
    # Example 4: Check purchase history
    print("\n📜 Checking purchase history...")
    purchases = client.get_purchases()

    if purchases['success']:
        purchase_list = purchases['data']['purchases']
        print(f"\nYou have {len(purchase_list)} purchases:")
        for p in purchase_list[:5]:  # Show first 5
            product = p.get('product', {})
            print(f"  - {product.get('name', 'Unknown')} (${p['amount']}) - {p['status']}")
            if p.get('paymentTxHash'):
                print(f"    TX: {p['paymentTxHash'][:20]}...")
    
    print("\n" + "=" * 60)
    print("  Demo Complete")
    print("=" * 60)
    print("\n💡 To enable real payments:")
    print("   1. Get a Solana wallet private key")
    print("   2. Fund it with SOL and USDC on devnet")
    print("   3. Pass it to SimpleX402Client(solana_private_key='...')")
    print("\n")


if __name__ == "__main__":
    main()

