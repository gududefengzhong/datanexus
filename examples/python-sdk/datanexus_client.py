"""
DataNexus Python SDK
A simple Python client for the DataNexus AI Agent API
"""

import requests
from typing import Optional, Dict, List, Any
import json


class DataNexusClient:
    """Client for interacting with the DataNexus API"""

    def __init__(self, api_key: str, base_url: str = "http://localhost:3000"):
        """
        Initialize the DataNexus client

        Args:
            api_key: Your API key from /dashboard/api-keys
            base_url: Base URL of the DataNexus API (default: http://localhost:3000)
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        })

    def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Make an API request"""
        url = f"{self.base_url}{endpoint}"

        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                json=data,
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            error_data = e.response.json() if e.response.content else {}
            raise Exception(
                f"API Error: {error_data.get('error', {}).get('message', str(e))}"
            )
        except Exception as e:
            raise Exception(f"Request failed: {str(e)}")

    def search_datasets(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        sort_by: str = "createdAt",
        order: str = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """
        Search for datasets

        Args:
            query: Search query for name and description
            category: Filter by category
            min_price: Minimum price filter
            max_price: Maximum price filter
            sort_by: Sort field (price, views, purchases, createdAt)
            order: Sort order (asc, desc)
            page: Page number
            limit: Items per page (max 100)

        Returns:
            Dict containing datasets and pagination info
        """
        params = {
            "page": page,
            "limit": limit,
            "sortBy": sort_by,
            "order": order,
        }

        if query:
            params["q"] = query
        if category:
            params["category"] = category
        if min_price is not None:
            params["minPrice"] = min_price
        if max_price is not None:
            params["maxPrice"] = max_price

        return self._request("GET", "/api/agent/datasets", params=params)

    def get_dataset(self, dataset_id: str) -> Dict[str, Any]:
        """
        Get details of a specific dataset

        Args:
            dataset_id: Dataset ID

        Returns:
            Dict containing dataset details
        """
        return self._request("GET", f"/api/agent/datasets/{dataset_id}")

    def preview_dataset(self, dataset_id: str) -> Dict[str, Any]:
        """
        Preview first 10 rows of a dataset (free)

        Args:
            dataset_id: Dataset ID

        Returns:
            Dict containing preview data
        """
        return self._request("GET", f"/api/agent/datasets/{dataset_id}/preview")

    def purchase_dataset(
        self,
        dataset_id: str,
        payment_method: str = "solana",
        payment_tx_hash: Optional[str] = None,
        x402_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Purchase a dataset

        Args:
            dataset_id: Dataset ID
            payment_method: Payment method (solana or x402)
            payment_tx_hash: Solana transaction hash (required for solana payment)
            x402_token: x402 payment token (required for x402 payment)

        Returns:
            Dict containing order details
        """
        data = {"paymentMethod": payment_method}

        if payment_method == "solana":
            if not payment_tx_hash:
                raise ValueError("payment_tx_hash is required for Solana payment")
            data["paymentTxHash"] = payment_tx_hash
        elif payment_method == "x402":
            if not x402_token:
                raise ValueError("x402_token is required for x402 payment")
            data["x402Token"] = x402_token
        else:
            raise ValueError("Invalid payment method. Use 'solana' or 'x402'")

        return self._request("POST", f"/api/agent/datasets/{dataset_id}/purchase", data=data)

    def download_dataset(self, dataset_id: str, output_path: str) -> None:
        """
        Download a purchased dataset

        Args:
            dataset_id: Dataset ID
            output_path: Path to save the downloaded file
        """
        url = f"{self.base_url}/api/agent/datasets/{dataset_id}/download"

        response = self.session.get(url, stream=True)
        response.raise_for_status()

        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        print(f"✅ Dataset downloaded to {output_path}")

    def get_purchases(self, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """
        Get your purchase history

        Args:
            page: Page number
            limit: Items per page (max 100)

        Returns:
            Dict containing purchases and pagination info
        """
        params = {"page": page, "limit": limit}
        return self._request("GET", "/api/agent/purchases", params=params)

    def create_x402_payment(self, product_id: str, amount: float) -> Dict[str, Any]:
        """
        Create an x402 payment request

        Args:
            product_id: Product ID
            amount: Payment amount

        Returns:
            Dict containing payment details and x402 URL
        """
        data = {"productId": product_id, "amount": amount}
        return self._request("POST", "/api/agent/x402/create-payment", data=data)

    def verify_x402_payment(self, payment_id: str, x402_token: str) -> Dict[str, Any]:
        """
        Verify an x402 payment

        Args:
            payment_id: Payment ID
            x402_token: x402 payment token

        Returns:
            Dict containing verification result
        """
        data = {"paymentId": payment_id, "x402Token": x402_token}
        return self._request("POST", "/api/agent/x402/verify-payment", data=data)


# Example usage
if __name__ == "__main__":
    # Initialize client
    client = DataNexusClient(api_key="your_api_key_here")

    # Search for datasets
    print("🔍 Searching for Solana datasets...")
    results = client.search_datasets(query="solana", category="blockchain", max_price=50)
    print(f"Found {results['data']['pagination']['total']} datasets")

    if results['data']['datasets']:
        dataset = results['data']['datasets'][0]
        print(f"\n📊 Dataset: {dataset['name']}")
        print(f"   Price: ${dataset['price']}")
        print(f"   Category: {dataset['category']}")

        # Preview dataset
        print(f"\n👁️ Previewing dataset...")
        try:
            preview = client.preview_dataset(dataset['id'])
            print(f"   Total rows: {preview['data']['totalRows']}")
            print(f"   Preview rows: {preview['data']['previewRows']}")
            print(f"   Columns: {', '.join(preview['data']['columns'])}")
        except Exception as e:
            print(f"   Preview not available: {e}")

        # Purchase dataset (example with Solana)
        # print(f"\n💰 Purchasing dataset...")
        # order = client.purchase_dataset(
        #     dataset_id=dataset['id'],
        #     payment_method="solana",
        #     payment_tx_hash="your_transaction_hash"
        # )
        # print(f"   Order ID: {order['data']['id']}")
        # print(f"   Status: {order['data']['status']}")

        # Download dataset
        # print(f"\n📥 Downloading dataset...")
        # client.download_dataset(dataset['id'], f"{dataset['name']}.csv")

    # Get purchase history
    print(f"\n📜 Getting purchase history...")
    purchases = client.get_purchases()
    print(f"Total purchases: {purchases['data']['pagination']['total']}")

