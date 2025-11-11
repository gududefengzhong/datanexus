'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { initiatePayment, getExplorerUrl } from '@/lib/x402'
import { Lock, Download, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  fileUrl: string
  irysTransactionId: string
  fileType: string
  fileSize: number
  fileName: string
  views: number
  purchases: number
  provider: {
    id: string
    walletAddress: string
  }
  createdAt: string
  updatedAt: string
  // Encryption fields
  isEncrypted?: boolean
  encryptionVersion?: string
  encryptionMethod?: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { publicKey, signTransaction } = useWallet()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [isOwnProduct, setIsOwnProduct] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [checkingPurchase, setCheckingPurchase] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  // Check if user has purchased this product or owns it
  useEffect(() => {
    if (product && publicKey) {
      // Check if user is the provider (owner)
      const isOwner = product.provider.walletAddress === publicKey.toBase58()
      setIsOwnProduct(isOwner)

      // If owner, automatically enable download
      if (isOwner) {
        setPurchaseSuccess(true)
        setHasPurchased(true)
      } else {
        checkPurchaseStatus()
      }
    }
  }, [product, publicKey])

  const checkPurchaseStatus = async () => {
    if (!product) return

    setCheckingPurchase(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setHasPurchased(false)
        return
      }

      const response = await fetch(`/api/orders/check?productId=${product.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setHasPurchased(data.hasPurchased)
        if (data.hasPurchased) {
          setPurchaseSuccess(true)
        }
      }
    } catch (error) {
      console.error('Failed to check purchase status:', error)
    } finally {
      setCheckingPurchase(false)
    }
  }

  const fetchProduct = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/products/${id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Product fetched from database:', {
          id: data.id,
          name: data.name,
          isEncrypted: data.isEncrypted,
          accessControlConditions: data.accessControlConditions,
        })
        setProduct(data)
      } else {
        console.error('Product not found')
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!product || !publicKey || !signTransaction) {
      setPurchaseError('Please connect your wallet first')
      return
    }

    setPurchasing(true)
    setPurchaseError(null)
    setPurchaseSuccess(false)

    try {
      // Step 1: Create pending order
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Please log in first')
      }

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
        }),
      })

      if (!orderResponse.ok) {
        const error = await orderResponse.json()
        throw new Error(error.error || 'Failed to create order')
      }

      const order = await orderResponse.json()

      // Step 2: Initiate payment
      const paymentResult = await initiatePayment(
        {
          productId: product.id,
          productName: product.name,
          amount: product.price,
          recipientAddress: product.provider.walletAddress,
        },
        publicKey,
        signTransaction
      )

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed')
      }

      // Step 3: Confirm order with payment details
      const confirmResponse = await fetch(`/api/orders/${order.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentTxHash: paymentResult.txHash,
          paymentNetwork: 'solana-devnet',
        }),
      })

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm order')
      }

      // Success!
      setPurchaseSuccess(true)

      // Show success toast with transaction link
      const explorerUrl = getExplorerUrl(paymentResult.txHash!, 'devnet')
      toast.success('Purchase successful!', {
        description: (
          <div className="space-y-2">
            <p>You can now download the dataset.</p>
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-mono text-muted-foreground">
                {paymentResult.txHash}
              </span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View on Solana Explorer →
              </a>
            </div>
          </div>
        ),
        duration: 8000,
      })

      // Refresh product to update purchase count
      fetchProduct(product.id)
    } catch (error) {
      console.error('Purchase failed:', error)
      setPurchaseError(error instanceof Error ? error.message : 'Purchase failed')
    } finally {
      setPurchasing(false)
    }
  }

  const handleDownload = async () => {
    if (!product) return

    setDownloading(true)
    setDownloadError(null)

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Please log in first')
      }

      // Debug: Log product encryption status
      console.log('Product encryption status:', {
        isEncrypted: product.isEncrypted,
        encryptionMethod: product.encryptionMethod,
        fileUrl: product.fileUrl,
      })

      // If encrypted, decrypt on client side
      if (product.isEncrypted) {
        // Check encryption method first
        if (product.encryptionMethod === 'hybrid') {
          // Hybrid encryption (v3.0) - use decrypt API
          console.log('🔐 Using hybrid encryption (v3.0)...')

          // Call decrypt API (returns decrypted file as blob)
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

          if (!decryptResponse.ok) {
            const errorData = await decryptResponse.json()
            throw new Error(errorData.error || 'Failed to decrypt file')
          }

          // Get the decrypted file as a blob
          const blob = await decryptResponse.blob()

          // Create download link
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = product.fileName || 'download'
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)

          console.log('✅ File downloaded successfully')
          toast.success('File decrypted and downloaded successfully!')
          setDownloading(false)
          return // Exit early for hybrid encryption
        }

        // Unsupported encryption method
        throw new Error('Unsupported encryption method. Only hybrid encryption (v3.0) is supported.')
      } else {
        // For non-encrypted files, download directly from Irys
        console.log('Downloading non-encrypted file from Irys...')
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

        toast.success('File downloaded successfully!')
      }
    } catch (error) {
      console.error('Download failed:', error)
      setDownloadError(error instanceof Error ? error.message : 'Download failed')
      toast.error('Download failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setDownloading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-8">
        <div className="text-muted-foreground">Loading product...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Product Not Found</CardTitle>
            <CardDescription>The product you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/marketplace">
              <Button>Back to Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/marketplace" className="hover:text-foreground">
          Marketplace
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold">{product.name}</h1>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary">{product.category}</Badge>
                <Badge variant="outline">{product.fileType.split('/')[1]?.toUpperCase()}</Badge>
                {product.isEncrypted && (
                  <Badge variant="default" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Encrypted
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <p className="mb-6 text-lg text-muted-foreground">{product.description}</p>

          <Separator className="my-6" />

          {/* File Information */}
          <div className="mb-6">
            <h2 className="mb-4 text-2xl font-semibold">File Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">File Name</div>
                <div className="font-medium">{product.fileName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">File Size</div>
                <div className="font-medium">{formatFileSize(product.fileSize)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">File Type</div>
                <div className="font-medium">{product.fileType}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Listed On</div>
                <div className="font-medium">{formatDate(product.createdAt)}</div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Provider Information */}
          <div className="mb-6">
            <h2 className="mb-4 text-2xl font-semibold">Provider</h2>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white">
                {product.provider.walletAddress.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-medium">Wallet Address</div>
                <div className="font-mono text-sm text-muted-foreground">
                  {product.provider.walletAddress}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Irys Information */}
          <div>
            <h2 className="mb-4 text-2xl font-semibold">Permanent Storage</h2>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-muted-foreground">Irys Transaction ID</div>
                <div className="break-all font-mono text-sm">{product.irysTransactionId}</div>
              </div>
              <div>
                <a
                  href={product.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View on Irys Gateway →
                </a>
              </div>
            </div>
          </div>

          {/* Encryption Information */}
          {product.isEncrypted && (
            <>
              <Separator className="my-6" />
              <div>
                <h2 className="mb-4 text-2xl font-semibold">Privacy & Security</h2>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-1 h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-semibold">End-to-End Encrypted</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        This dataset is encrypted using AES-256-GCM. Only authorized users (the
                        provider and buyers) can decrypt and access the data.
                      </p>
                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        <div>• Encryption: AES-256-GCM</div>
                        <div>• Version: {product.encryptionVersion || '3.0'}</div>
                        <div>• Access Control: Provider-only</div>
                        <div>• Storage: Encrypted on Irys</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-3xl">${product.price.toFixed(2)}</CardTitle>
              <CardDescription>USDC (one-time purchase)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {purchaseError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {purchaseError}
                </div>
              )}

              {(purchaseSuccess || hasPurchased) && (
                <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
                  ✅ {isOwnProduct ? 'You are the provider of this dataset' : hasPurchased && !purchaseSuccess ? 'You own this dataset' : 'Purchase successful! You can now download the dataset.'}
                </div>
              )}

              {!isOwnProduct && !hasPurchased && !purchaseSuccess && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={purchasing || !publicKey}
                >
                  {purchasing
                    ? 'Processing Payment...'
                    : !publicKey
                    ? 'Connect Wallet to Purchase'
                    : 'Purchase Dataset'}
                </Button>
              )}

              {!isOwnProduct && (hasPurchased || purchaseSuccess) && (
                <Button
                  className="w-full"
                  size="lg"
                  disabled
                  variant="secondary"
                >
                  ✅ Already Purchased
                </Button>
              )}

              {(purchaseSuccess || hasPurchased) && (
                <>
                  {downloadError && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {downloadError}
                    </div>
                  )}
                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {product.isEncrypted ? 'Decrypting...' : 'Downloading...'}
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        {product.isEncrypted ? 'Decrypt & Download' : 'Download Dataset'}
                      </>
                    )}
                  </Button>
                </>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Views</span>
                  <span className="font-medium">👁️ {product.views}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Purchases</span>
                  <span className="font-medium">🛒 {product.purchases}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="font-semibold">What's included:</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✓ Permanent access to data</li>
                  <li>✓ Stored on Irys (decentralized)</li>
                  <li>✓ Instant download after purchase</li>
                  {product.isEncrypted && <li>✓ Encrypted with AES-256-GCM</li>}
                  <li>✓ API access available</li>
                </ul>
              </div>

              <Separator />

              <div className="text-xs text-muted-foreground">
                <p>
                  By purchasing, you agree to use this data in accordance with the provider's
                  terms and applicable laws.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

