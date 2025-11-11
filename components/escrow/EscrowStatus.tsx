/**
 * Escrow Status Display Component
 * Displays current escrow status and available actions
 */

'use client'

import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { CheckCircle, XCircle, Clock, AlertTriangle, Package, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface EscrowStatusProps {
  escrowPda: string
  buyer: string
  provider: string
  platform: string
  amount: number
  status: string
  requestId: string
  proposalId: string
  createdAt: Date
  onStatusChange?: () => void
}

const statusConfig = {
  created: {
    label: 'Created',
    color: 'bg-gray-100 text-gray-800',
    icon: Clock,
  },
  funded: {
    label: 'Funded',
    color: 'bg-blue-100 text-blue-800',
    icon: DollarSign,
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-purple-100 text-purple-800',
    icon: Package,
  },
  disputed: {
    label: 'Disputed',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertTriangle,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-orange-100 text-orange-800',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
}

export default function EscrowStatus({
  escrowPda,
  buyer,
  provider,
  platform,
  amount,
  status,
  requestId,
  proposalId,
  createdAt,
  onStatusChange,
}: EscrowStatusProps) {
  const wallet = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.created
  const Icon = config.icon

  const isBuyer = wallet.publicKey?.toBase58() === buyer
  const isProvider = wallet.publicKey?.toBase58() === provider
  const isPlatform = wallet.publicKey?.toBase58() === platform

  // Mark delivered
  const handleMarkDelivered = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError('Please connect your wallet first')
      toast.error('Wallet Not Connected', {
        description: 'Please connect your wallet first',
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Build transaction on backend
      const buildResponse = await fetch('/api/escrow/mark-delivered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerPublicKey: wallet.publicKey.toBase58(),
          buyerPublicKey: buyer,
          requestId,
        }),
      })

      const buildData = await buildResponse.json()

      if (!buildResponse.ok) {
        throw new Error(buildData.error || 'Failed to build transaction')
      }

      // Step 2: Deserialize and sign transaction
      const { Transaction } = await import('@solana/web3.js')
      const tx = Transaction.from(Buffer.from(buildData.transaction, 'base64'))

      const signedTx = await wallet.signTransaction(tx)

      // Step 3: Send transaction
      const { Connection } = await import('@solana/web3.js')
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

      const signature = await connection.sendRawTransaction(signedTx.serialize())

      // Wait for confirmation
      const latestBlockhash = await connection.getLatestBlockhash()
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      }, 'confirmed')

      // Step 4: Confirm on backend
      const confirmResponse = await fetch('/api/escrow/mark-delivered/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          escrowPda: buildData.escrowPda,
          requestId,
        }),
      })

      const confirmData = await confirmResponse.json()

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || 'Failed to confirm mark delivered')
      }

      // Success
      if (onStatusChange) {
        onStatusChange()
      }

      toast.success('Delivery Marked Successfully!', {
        description: (
          <div className="space-y-2">
            <p className="font-mono text-xs">{signature}</p>
            <a
              href={confirmData.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs"
            >
              View on Solana Explorer →
            </a>
          </div>
        ),
        duration: 6000,
      })
    } catch (err: any) {
      console.error('Mark delivered error:', err)
      setError(err.message || 'Failed to mark delivered')
      toast.error('Failed to Mark Delivered', {
        description: err.message || 'Failed to mark delivered',
      })
    } finally {
      setLoading(false)
    }
  }

  // Confirm and release
  const handleConfirm = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError('Please connect your wallet first')
      toast.error('Wallet Not Connected', {
        description: 'Please connect your wallet first',
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Build transaction on backend
      const buildResponse = await fetch('/api/escrow/confirm-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerPublicKey: wallet.publicKey.toBase58(),
          requestId,
        }),
      })

      const buildData = await buildResponse.json()

      if (!buildResponse.ok) {
        throw new Error(buildData.error || 'Failed to build transaction')
      }

      // Step 2: Deserialize and sign transaction
      const { Transaction } = await import('@solana/web3.js')
      const tx = Transaction.from(Buffer.from(buildData.transaction, 'base64'))

      const signedTx = await wallet.signTransaction(tx)

      // Step 3: Send transaction
      const { Connection } = await import('@solana/web3.js')
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

      const signature = await connection.sendRawTransaction(signedTx.serialize())

      // Wait for confirmation
      const latestBlockhash = await connection.getLatestBlockhash()
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      }, 'confirmed')

      // Step 4: Confirm on backend
      const confirmResponse = await fetch('/api/escrow/confirm-release/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          escrowPda: buildData.escrowPda,
          requestId,
        }),
      })

      const confirmData = await confirmResponse.json()

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || 'Failed to confirm release')
      }

      // Success
      if (onStatusChange) {
        onStatusChange()
      }

      toast.success('Funds Released Successfully!', {
        description: (
          <div className="space-y-2">
            <p className="text-xs">95% to provider, 5% to platform</p>
            <p className="font-mono text-xs">{signature}</p>
            <a
              href={confirmData.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs"
            >
              View on Solana Explorer →
            </a>
          </div>
        ),
        duration: 6000,
      })
    } catch (err: any) {
      console.error('Confirm release error:', err)

      let errorMessage = err.message || 'Failed to confirm release'

      if (err.message?.includes('0x1770') || err.message?.includes('InvalidStatus')) {
        errorMessage = 'Cannot confirm: Escrow must be in "Delivered" status. Please wait for the provider to mark delivery first.'
      }

      setError(errorMessage)
      toast.error('Failed to Release Funds', {
        description: errorMessage,
        duration: 8000,
      })
    } finally {
      setLoading(false)
    }
  }

  // Cancel order
  const handleCancel = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError('Please connect your wallet first')
      toast.error('Wallet Not Connected', {
        description: 'Please connect your wallet first',
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Build transaction on backend
      const buildResponse = await fetch('/api/escrow/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerPublicKey: wallet.publicKey.toBase58(),
          requestId,
        }),
      })

      const buildData = await buildResponse.json()

      if (!buildResponse.ok) {
        throw new Error(buildData.error || 'Failed to build transaction')
      }

      // Step 2: Deserialize and sign transaction
      const { Transaction } = await import('@solana/web3.js')
      const tx = Transaction.from(Buffer.from(buildData.transaction, 'base64'))

      const signedTx = await wallet.signTransaction(tx)

      // Step 3: Send transaction
      const { Connection } = await import('@solana/web3.js')
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

      const signature = await connection.sendRawTransaction(signedTx.serialize())

      // Wait for confirmation
      const latestBlockhash = await connection.getLatestBlockhash()
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      }, 'confirmed')

      // Step 4: Confirm on backend
      const confirmResponse = await fetch('/api/escrow/cancel/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          escrowPda: buildData.escrowPda,
          requestId,
        }),
      })

      const confirmData = await confirmResponse.json()

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || 'Failed to confirm cancel')
      }

      // Success
      if (onStatusChange) {
        onStatusChange()
      }

      toast.success('Order Cancelled Successfully!', {
        description: (
          <div className="space-y-2">
            <p className="text-xs">Full refund issued to buyer</p>
            <p className="font-mono text-xs">{signature}</p>
            <a
              href={confirmData.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs"
            >
              View on Solana Explorer →
            </a>
          </div>
        ),
        duration: 6000,
      })
    } catch (err: any) {
      console.error('Cancel order error:', err)

      let errorMessage = err.message || 'Failed to cancel order'

      if (err.message?.includes('0x1770') || err.message?.includes('InvalidStatus')) {
        errorMessage = 'Cannot cancel: Escrow must be in "Funded" status. Once delivered, you can only raise a dispute.'
      }

      setError(errorMessage)
      toast.error('Failed to Cancel Order', {
        description: errorMessage,
        duration: 8000,
      })
    } finally {
      setLoading(false)
    }
  }

  // Raise dispute
  const handleRaiseDispute = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError('Please connect your wallet first')
      toast.error('Wallet Not Connected', {
        description: 'Please connect your wallet first',
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Build transaction on backend
      const buildResponse = await fetch('/api/escrow/raise-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerPublicKey: wallet.publicKey.toBase58(),
          requestId,
        }),
      })

      const buildData = await buildResponse.json()

      if (!buildResponse.ok) {
        throw new Error(buildData.error || 'Failed to build transaction')
      }

      // Step 2: Deserialize and sign transaction
      const { Transaction } = await import('@solana/web3.js')
      const tx = Transaction.from(Buffer.from(buildData.transaction, 'base64'))

      const signedTx = await wallet.signTransaction(tx)

      // Step 3: Send transaction
      const { Connection } = await import('@solana/web3.js')
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

      const signature = await connection.sendRawTransaction(signedTx.serialize())

      // Wait for confirmation
      const latestBlockhash = await connection.getLatestBlockhash()
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      }, 'confirmed')

      // Step 4: Confirm on backend
      const confirmResponse = await fetch('/api/escrow/raise-dispute/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          escrowPda: buildData.escrowPda,
          requestId,
        }),
      })

      const confirmData = await confirmResponse.json()

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || 'Failed to confirm raise dispute')
      }

      // Success
      if (onStatusChange) {
        onStatusChange()
      }

      toast.success('Dispute Raised Successfully!', {
        description: (
          <div className="space-y-2">
            <p className="text-xs">Platform will investigate</p>
            <p className="font-mono text-xs">{signature}</p>
            <a
              href={confirmData.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs"
            >
              View on Solana Explorer →
            </a>
          </div>
        ),
        duration: 6000,
      })
    } catch (err: any) {
      console.error('Raise dispute error:', err)

      // Check for specific error codes
      let errorMessage = err.message || 'Failed to raise dispute'

      if (err.message?.includes('0x1770') || err.message?.includes('InvalidStatus')) {
        errorMessage = 'Cannot raise dispute: Escrow must be in "Delivered" status. Please wait for the provider to mark delivery first.'
      }

      setError(errorMessage)
      toast.error('Failed to Raise Dispute', {
        description: errorMessage,
        duration: 8000,
      })
    } finally {
      setLoading(false)
    }
  }

  // Resolve dispute (platform)
  const handleResolveDispute = async (refundToBuyer: boolean) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError('Please connect your wallet first')
      toast.error('Wallet Not Connected', {
        description: 'Please connect your wallet first',
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Build transaction on backend
      const buildResponse = await fetch('/api/escrow/resolve-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformPublicKey: wallet.publicKey.toBase58(),
          requestId,
          refundToBuyer,
        }),
      })

      const buildData = await buildResponse.json()

      if (!buildResponse.ok) {
        throw new Error(buildData.error || 'Failed to build transaction')
      }

      // Step 2: Deserialize and sign transaction
      const { Transaction } = await import('@solana/web3.js')
      const tx = Transaction.from(Buffer.from(buildData.transaction, 'base64'))

      const signedTx = await wallet.signTransaction(tx)

      // Step 3: Send transaction
      const { Connection } = await import('@solana/web3.js')
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

      const signature = await connection.sendRawTransaction(signedTx.serialize())

      // Wait for confirmation
      const latestBlockhash = await connection.getLatestBlockhash()
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      }, 'confirmed')

      // Step 4: Confirm on backend
      const confirmResponse = await fetch('/api/escrow/resolve-dispute/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          escrowPda: buildData.escrowPda,
          requestId,
          refundToBuyer,
        }),
      })

      const confirmData = await confirmResponse.json()

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || 'Failed to confirm resolve dispute')
      }

      // Success
      if (onStatusChange) {
        onStatusChange()
      }

      const actionText = refundToBuyer ? 'Refunded to Buyer' : 'Released to Provider'
      toast.success('Dispute Resolved Successfully!', {
        description: (
          <div className="space-y-2">
            <p className="text-xs">{actionText}</p>
            <p className="font-mono text-xs">{signature}</p>
            <a
              href={confirmData.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs"
            >
              View on Solana Explorer →
            </a>
          </div>
        ),
        duration: 6000,
      })
    } catch (err: any) {
      console.error('Resolve dispute error:', err)
      setError(err.message || 'Failed to resolve dispute')
      toast.error('Failed to Resolve Dispute', {
        description: err.message || 'Failed to resolve dispute',
        duration: 8000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Status header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-gray-600" />
          <h3 className="text-xl font-semibold">Escrow Status</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
      </div>

      {/* Escrow info */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Escrow PDA:</span>
          <a
            href={`https://explorer.solana.com/address/${escrowPda}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-mono"
          >
            {escrowPda.slice(0, 8)}...{escrowPda.slice(-8)}
          </a>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold">{amount} USDC</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Created At:</span>
          <span>{new Date(createdAt).toLocaleString('en-US')}</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Workflow hints */}
      {status === 'funded' && isBuyer && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>⏳ Waiting for Provider:</strong> The provider needs to mark delivery first. You can cancel anytime before delivery.
          </p>
        </div>
      )}

      {status === 'funded' && isProvider && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs text-purple-800">
            <strong>📦 Next Step:</strong> After delivering the data, click "Mark Delivered" to notify the buyer.
          </p>
        </div>
      )}

      {status === 'delivered' && isBuyer && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800">
            <strong>✅ Review Required:</strong> Check the delivered data. If satisfied, confirm and release funds. If there's an issue, raise a dispute.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2">
        {/* Provider: Mark delivered */}
        {isProvider && status === 'funded' && (
          <button
            onClick={handleMarkDelivered}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Mark Delivered'}
          </button>
        )}

        {/* Buyer: Confirm and release */}
        {isBuyer && status === 'delivered' && (
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Confirm & Release Funds (95/5)'}
          </button>
        )}

        {/* Buyer: Cancel order */}
        {isBuyer && status === 'funded' && (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Cancel Order (Full Refund)'}
          </button>
        )}

        {/* Buyer: Raise dispute */}
        {isBuyer && status === 'delivered' && (
          <button
            onClick={handleRaiseDispute}
            disabled={loading}
            className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Raise Dispute'}
          </button>
        )}

        {/* Platform: Resolve dispute */}
        {isPlatform && status === 'disputed' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-2">Platform Arbitration:</p>
            <button
              onClick={() => handleResolveDispute(true)}
              disabled={loading}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Refund to Buyer'}
            </button>
            <button
              onClick={() => handleResolveDispute(false)}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Release to Provider (95/5)'}
            </button>
          </div>
        )}

        {/* Completed/Refunded/Cancelled - No actions */}
        {(status === 'completed' || status === 'refunded' || status === 'cancelled') && (
          <div className="text-center text-gray-500 text-sm py-2">
            This escrow has ended
          </div>
        )}
      </div>

      {/* Status description */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Status Description</h4>
        <div className="text-xs text-gray-600 space-y-1">
          {status === 'funded' && (
            <>
              <p>• Provider can mark delivery</p>
              <p>• Buyer can cancel order and get full refund</p>
            </>
          )}
          {status === 'delivered' && (
            <>
              <p>• Buyer can confirm delivery and release funds (95% to provider, 5% to platform)</p>
              <p>• Buyer can raise dispute for platform arbitration</p>
            </>
          )}
          {status === 'disputed' && (
            <>
              <p>• Platform is investigating the dispute</p>
              <p>• Platform can choose to refund buyer or release to provider</p>
            </>
          )}
          {status === 'completed' && (
            <p>• Funds released: 95% to provider, 5% to platform</p>
          )}
          {status === 'refunded' && (
            <p>• Full refund issued to buyer</p>
          )}
          {status === 'cancelled' && (
            <p>• Order cancelled, full refund issued to buyer</p>
          )}
        </div>
      </div>
    </div>
  )
}

