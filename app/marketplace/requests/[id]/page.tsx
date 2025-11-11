/**
 * Data Request Detail Page
 * Display request details, proposal list, and accept proposal (create Escrow) functionality
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Star,
  Send
} from 'lucide-react'
import CreateEscrowButton from '@/components/escrow/CreateEscrowButton'

interface DataRequest {
  id: string
  title: string
  description: string
  budget: number
  deadline: string
  status: string
  createdAt: string
  buyer: {
    id: string
    walletAddress: string
  }
  proposals: Proposal[]
}

interface Proposal {
  id: string
  description: string
  price: number
  deliveryTime: number
  sampleDataUrl: string | null
  status: string
  createdAt: string
  provider: {
    id: string
    walletAddress: string
    providerReputation: {
      reputationScore: number
      badges: string[]
    } | null
  }
}

export default function RequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const wallet = useWallet()
  const [request, setRequest] = useState<DataRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acceptingProposal, setAcceptingProposal] = useState<string | null>(null)

  const requestId = params.id as string

  useEffect(() => {
    fetchRequest()
  }, [requestId])

  const fetchRequest = async () => {
    try {
      setLoading(true)

      // No authentication needed for viewing request details
      const response = await fetch(`/api/requests/${requestId}`)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to load')
      }

      setRequest(data.request)
    } catch (err: any) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProposalStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'accepted':
        return 'Accepted'
      case 'rejected':
        return 'Rejected'
      default:
        return status
    }
  }

  const isBuyer = wallet.publicKey?.toBase58() === request?.buyer.walletAddress

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load</h2>
          <p className="text-gray-600 mb-6">{error || 'Request not found'}</p>
          <Link
            href="/marketplace/requests"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/marketplace/requests"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Requests
        </Link>

        {/* Request Details */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{request.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{request.buyer.walletAddress.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Posted on {formatDate(request.createdAt)}</span>
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
              {getStatusText(request.status)}
            </span>
          </div>

          <div className="prose max-w-none mb-6">
            <p className="text-gray-700">{request.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="text-xl font-bold text-green-600">{request.budget} USDC</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Deadline</p>
                <p className="text-xl font-bold text-blue-600">{formatDate(request.deadline)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Proposals Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Proposals ({request.proposals.length})
            </h2>

            {/* Submit Proposal Button (for non-buyers) */}
            {!isBuyer && request.status === 'pending' && (
              <Link
                href={`/marketplace/requests/${request.id}/submit-proposal`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Submit Proposal
              </Link>
            )}
          </div>

          {request.proposals.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">No proposals yet</p>
              {!isBuyer && request.status === 'pending' && (
                <Link
                  href={`/marketplace/requests/${request.id}/submit-proposal`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Be the First to Submit a Proposal
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {request.proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="font-mono text-sm text-gray-600">
                          {proposal.provider.walletAddress.slice(0, 16)}...
                        </span>
                        {proposal.provider.providerReputation && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">
                              {proposal.provider.providerReputation.reputationScore.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 mb-3">{proposal.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProposalStatusColor(proposal.status)}`}>
                      {getProposalStatusText(proposal.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="text-lg font-bold text-green-600">{proposal.price} USDC</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Delivery Time</p>
                      <p className="text-lg font-bold text-blue-600">{proposal.deliveryTime} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Submitted</p>
                      <p className="text-sm text-gray-900">{formatDate(proposal.createdAt)}</p>
                    </div>
                  </div>

                  {proposal.sampleDataUrl && (
                    <div className="mb-4">
                      <a
                        href={proposal.sampleDataUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        View Sample Data →
                      </a>
                    </div>
                  )}

                  {/* Accept Proposal Button (only for buyer when proposal is pending) */}
                  {isBuyer && proposal.status === 'pending' && request.status === 'pending' && (
                    <CreateEscrowButton
                      requestId={request.id}
                      proposalId={proposal.id}
                      providerPublicKey={proposal.provider.walletAddress}
                      amount={proposal.price}
                      onSuccess={() => {
                        // Refresh page data
                        fetchRequest()
                        // Navigate to Escrow page
                        router.push('/escrow')
                      }}
                      className="w-full"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

