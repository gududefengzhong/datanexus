/**
 * Escrow List Component
 * Display all user's escrows (as buyer or provider)
 */

'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Shield, Loader2, ExternalLink } from 'lucide-react'
import EscrowStatus from './EscrowStatus'

interface Escrow {
  id: string
  escrowPda: string
  buyer: string
  provider: string
  platform: string
  amount: number
  requestId: string
  proposalId: string
  status: string
  signature: string
  createdAt: string
}

export default function EscrowList() {
  const wallet = useWallet()
  const [escrows, setEscrows] = useState<Escrow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'buyer' | 'provider' | 'platform'>('all')

  // Load escrow list
  const loadEscrows = async () => {
    if (!wallet.publicKey) {
      setEscrows([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/escrow/list?walletAddress=${wallet.publicKey.toBase58()}`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load')
      }

      setEscrows(data.escrows || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEscrows()
  }, [wallet.publicKey])

  // Filter escrows
  const filteredEscrows = escrows.filter((escrow) => {
    if (filter === 'buyer') {
      return escrow.buyer === wallet.publicKey?.toBase58()
    }
    if (filter === 'provider') {
      return escrow.provider === wallet.publicKey?.toBase58()
    }
    if (filter === 'platform') {
      return escrow.platform === wallet.publicKey?.toBase58()
    }
    return true
  })

  if (!wallet.publicKey) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Please connect your wallet to view escrows</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 inline-block">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Title and Filters */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          My Escrows
        </h2>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({escrows.length})
          </button>
          <button
            onClick={() => setFilter('buyer')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'buyer'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            As Buyer ({escrows.filter(e => e.buyer === wallet.publicKey?.toBase58()).length})
          </button>
          <button
            onClick={() => setFilter('provider')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'provider'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            As Provider ({escrows.filter(e => e.provider === wallet.publicKey?.toBase58()).length})
          </button>
          <button
            onClick={() => setFilter('platform')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'platform'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            As Platform ({escrows.filter(e => e.platform === wallet.publicKey?.toBase58()).length})
          </button>
        </div>
      </div>

      {/* Escrow List */}
      {filteredEscrows.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {filter === 'all'
              ? 'No escrows found'
              : `No escrows as ${filter === 'buyer' ? 'buyer' : filter === 'provider' ? 'provider' : 'platform'}`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEscrows.map((escrow) => (
            <div key={escrow.id} className="relative">
              {/* Role Badge */}
              <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                {escrow.buyer === wallet.publicKey?.toBase58() && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                    Buyer
                  </span>
                )}
                {escrow.provider === wallet.publicKey?.toBase58() && (
                  <span className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">
                    Provider
                  </span>
                )}
                {escrow.platform === wallet.publicKey?.toBase58() && (
                  <span className="px-2 py-1 bg-orange-600 text-white text-xs font-medium rounded-full">
                    Platform
                  </span>
                )}
              </div>

              {/* Escrow Status Card */}
              <EscrowStatus
                escrowPda={escrow.escrowPda}
                buyer={escrow.buyer}
                provider={escrow.provider}
                platform={escrow.platform}
                amount={escrow.amount}
                status={escrow.status}
                requestId={escrow.requestId}
                proposalId={escrow.proposalId}
                createdAt={new Date(escrow.createdAt)}
                onStatusChange={loadEscrows}
              />

              {/* View Transaction Link */}
              {escrow.signature && (
                <a
                  href={`https://explorer.solana.com/tx/${escrow.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Creation Transaction
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={loadEscrows}
          disabled={loading}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Refreshing...' : 'Refresh List'}
        </button>
      </div>
    </div>
  )
}

