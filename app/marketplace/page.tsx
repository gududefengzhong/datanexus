'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Lock } from 'lucide-react'

const CATEGORIES = [
  'All Categories',
  'Financial Data',
  'Healthcare',
  'E-commerce',
  'Social Media',
  'IoT Sensors',
  'Weather',
  'Transportation',
  'Education',
  'Other',
]

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  fileType: string
  fileSize: number
  views: number
  purchases: number
  provider: {
    walletAddress: string
  }
  createdAt: string
  isEncrypted?: boolean
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Categories')
  const [sortBy, setSortBy] = useState('createdAt')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [purchasedProducts, setPurchasedProducts] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchProducts()
  }, [search, category, sortBy, page])

  // Check purchase status for all products
  useEffect(() => {
    if (products.length > 0) {
      checkPurchaseStatus()
    }
  }, [products])

  const checkPurchaseStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setPurchasedProducts({})
        return
      }

      const productIds = products.map((p) => p.id)
      const response = await fetch('/api/orders/check-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds }),
      })

      if (response.ok) {
        const data = await response.json()
        setPurchasedProducts(data.purchases || {})
      }
    } catch (error) {
      console.error('Failed to check purchase status:', error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy,
        sortOrder: 'desc',
      })

      if (search) params.append('search', search)
      if (category !== 'All Categories') params.append('category', category)

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      setProducts(data.products || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Data Marketplace</h1>
            <p className="mt-2 text-muted-foreground">
              Discover and purchase datasets for your AI agents
            </p>
          </div>
          <Link href="/marketplace/requests">
            <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
              📋 Data Requests
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <Input
            placeholder="Search datasets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:w-1/3"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="md:w-1/4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="md:w-1/4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Newest</SelectItem>
              <SelectItem value="price">Price: Low to High</SelectItem>
              <SelectItem value="views">Most Viewed</SelectItem>
              <SelectItem value="purchases">Most Purchased</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading products...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 text-6xl">📦</div>
            <CardTitle>No Products Found</CardTitle>
            <CardDescription>
              {search || category !== 'All Categories'
                ? 'Try adjusting your filters'
                : 'Be the first to upload a dataset to the marketplace!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/dashboard/upload">
              <Button>Upload Dataset</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Product Grid */}
      {!loading && products.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-2 flex flex-wrap items-start gap-2">
                      <Badge variant="secondary">{product.category}</Badge>
                      <Badge variant="outline">{product.fileType.split('/')[1]?.toUpperCase()}</Badge>
                      {product.isEncrypted && (
                        <Badge variant="default" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Encrypted
                        </Badge>
                      )}
                      {purchasedProducts[product.id] && (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                          ✅ Purchased
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="line-clamp-1">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-semibold">${product.price.toFixed(2)} USDC</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Size</span>
                        <span>{formatFileSize(product.fileSize)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Provider</span>
                        <span className="font-mono text-xs">
                          {formatWalletAddress(product.provider.walletAddress)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="text-muted-foreground">👁️ {product.views}</span>
                        <span className="text-muted-foreground">🛒 {product.purchases}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

