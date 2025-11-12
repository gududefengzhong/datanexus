'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getExplorerUrl } from '@/lib/x402'
import { toast } from 'sonner'
import { Download } from 'lucide-react'

interface Order {
  id: string
  amount: number
  status: string
  paymentTxHash: string | null
  paymentNetwork: string | null
  createdAt: string
  downloadCount?: number
  lastDownloadAt?: string | null
  product: {
    id: string
    name: string
    category: string
    fileUrl: string
    fileName: string
    fileType: string
    isEncrypted: boolean
    encryptionMethod?: string
    provider: {
      walletAddress: string
    }
  }
}

export default function PurchasesPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.log('No auth token found')
        setLoading(false)
        return
      }

      const response = await fetch('/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600'
      case 'failed':
        return 'bg-red-500/10 text-red-600'
      default:
        return 'bg-gray-500/10 text-gray-600'
    }
  }

  const handleDownload = async (order: Order) => {
    const product = order.product
    setDownloading(order.id)

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Please log in first')
      }

      // Debug: Log product encryption status
      console.log('📋 Product encryption status:', {
        isEncrypted: product.isEncrypted,
        encryptionMethod: product.encryptionMethod,
        fileUrl: product.fileUrl,
      })

      if (product.isEncrypted && product.encryptionMethod === 'hybrid') {
        // For hybrid encryption, call the decrypt API
        console.log('🔐 Product is encrypted (hybrid) - calling /api/decrypt...')

        const decryptResponse = await fetch('/api/decrypt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product.id,
          }),
        })

        console.log('📥 Decrypt API response status:', decryptResponse.status)

        if (!decryptResponse.ok) {
          const error = await decryptResponse.json()
          console.error('❌ Decrypt API error:', error)
          throw new Error(error.error || 'Failed to decrypt file')
        }

        // Get the decrypted file as a blob
        const blob = await decryptResponse.blob()
        console.log('📦 Received blob:', {
          size: blob.size,
          type: blob.type,
        })

        // Create download link
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = product.fileName || 'download'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        console.log('✅ File decrypted and downloaded successfully')
        toast.success('File decrypted and downloaded successfully!')
      } else {
        // For non-encrypted files, download directly from Irys
        console.log('ℹ️  Product is not encrypted - downloading directly from Irys...')
        const response = await fetch(product.fileUrl)
        if (!response.ok) {
          throw new Error('Failed to download file from Irys')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = product.fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        console.log('✅ Non-encrypted file downloaded successfully')
        toast.success('File downloaded successfully!')
      }
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Download failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">My Purchases</h1>
        <p className="mt-2 text-muted-foreground">
          View and download your purchased datasets
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      )}

      {!loading && orders.length === 0 && (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 text-6xl">🛒</div>
            <CardTitle>No Purchases Yet</CardTitle>
            <CardDescription>
              Browse the marketplace to find datasets for your projects
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/marketplace">
              <Button>Browse Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{order.product.name}</CardTitle>
                      <Badge variant="secondary">{order.product.category}</Badge>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <CardDescription className="mt-2">
                      Purchased on {formatDate(order.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${order.amount.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">USDC</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Provider Info */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="font-mono">{formatWalletAddress(order.product.provider.walletAddress)}</span>
                  </div>

                  {/* Transaction Info */}
                  {order.paymentTxHash && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Transaction:</span>
                      <a
                        href={getExplorerUrl(order.paymentTxHash, 'devnet')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-primary hover:underline"
                      >
                        {order.paymentTxHash.slice(0, 8)}...{order.paymentTxHash.slice(-8)}
                      </a>
                    </div>
                  )}

                  {/* Download Stats */}
                  {order.downloadCount !== undefined && order.downloadCount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Downloads:</span>
                      <span className="font-semibold">{order.downloadCount}</span>
                      {order.lastDownloadAt && (
                        <span className="text-muted-foreground">
                          (Last: {formatDate(order.lastDownloadAt)})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {order.status === 'completed' && (
                      <>
                        <Button
                          onClick={() => handleDownload(order)}
                          disabled={downloading === order.id}
                          className="gap-2"
                        >
                          {downloading === order.id ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              {order.product.isEncrypted ? 'Decrypting...' : 'Downloading...'}
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              {order.product.isEncrypted ? 'Decrypt & Download' : 'Download Dataset'}
                            </>
                          )}
                        </Button>
                        <Link href={`/products/${order.product.id}`}>
                          <Button variant="outline">View Product</Button>
                        </Link>
                      </>
                    )}
                    {order.status === 'pending' && (
                      <Button variant="outline" disabled>
                        Payment Pending...
                      </Button>
                    )}
                    {order.status === 'failed' && (
                      <Link href={`/products/${order.product.id}`}>
                        <Button>Try Again</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

