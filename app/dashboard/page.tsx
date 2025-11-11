'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Product {
  id: string
  name: string
  category: string
  price: number
  views: number
  purchases: number
  createdAt: string
}

interface Stats {
  totalProducts: number
  totalSales: number
  totalRevenue: number
  totalViews: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalViews: 0,
  })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyProducts(1)
  }, [])

  const fetchMyProducts = async (page: number) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.log('No auth token found')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/products/my-products?page=${page}&limit=${pagination.limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        setStats(data.stats || stats)
        if (data.pagination) {
          setPagination(data.pagination)
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchMyProducts(newPage)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your data products and track your earnings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProducts === 0 ? 'No products yet' : 'Active listings'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSales === 0 ? 'No sales yet' : 'Purchases'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-2xl">💸</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">USDC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <span className="text-2xl">👁️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalViews === 0 ? 'No views yet' : 'All time'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Data</CardTitle>
            <CardDescription>
              Upload a new dataset to the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/upload">
              <Button className="w-full">📤 Upload Dataset</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage API keys for programmatic access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/api-keys">
              <Button variant="outline" className="w-full">
                🔑 Manage API Keys
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* My Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Products</CardTitle>
              <CardDescription>Your uploaded datasets</CardDescription>
            </div>
            <Link href="/dashboard/upload">
              <Button>Upload New</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 text-6xl">📊</div>
              <p className="text-muted-foreground">No products yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload your first dataset to get started
              </p>
              <Link href="/dashboard/upload">
                <Button className="mt-4">Upload Dataset</Button>
              </Link>
            </div>
          )}

          {!loading && products.length > 0 && (
            <>
              <div className="space-y-4">
                {products.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{product.name}</h3>
                          <Badge variant="secondary">{product.category}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Listed on {formatDate(product.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-semibold">${product.price.toFixed(2)}</div>
                          <div className="text-muted-foreground">Price</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{product.views}</div>
                          <div className="text-muted-foreground">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{product.purchases}</div>
                          <div className="text-muted-foreground">Sales</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage =
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        Math.abs(pageNum - pagination.page) <= 1

                      if (!showPage) {
                        // Show ellipsis
                        if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                          return <span key={pageNum} className="px-2">...</span>
                        }
                        return null
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="min-w-[40px]"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}

              {/* Results Info */}
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} products
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

