'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DataRequest {
  id: string
  title: string
  description: string
  budget: number
  deadline: string
  status: string
  createdAt: string
  buyer: {
    walletAddress: string
  }
  _count: {
    proposals: number
  }
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<DataRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'my'>('all')

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    try {
      setLoading(true)

      let url = '/api/requests?limit=20'
      if (filter === 'pending') {
        url += '&status=pending'
      } else if (filter === 'my') {
        url += '&myRequests=true'
      }

      const headers: Record<string, string> = {}

      // Only send authentication for "My Requests"
      if (filter === 'my') {
        const authToken = localStorage.getItem('auth_token')
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`
        } else {
          // If no auth token, show error
          console.error('Please login to view your requests')
          setRequests([])
          setLoading(false)
          return
        }
      }
      // For "All Requests" and "Pending", no authentication needed

      const response = await fetch(url, { headers })

      const data = await response.json()
      if (data.success) {
        setRequests(data.requests)
      } else {
        console.error('Failed to fetch requests:', data.error)
        setRequests([])
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      matched: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      disputed: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isExpired = (deadline: string) => {
    return new Date(deadline) < new Date()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Data Request Marketplace</h1>
              <p className="mt-2 text-gray-600">
                Post data requests and let providers create custom datasets for you
              </p>
            </div>
            <Link
              href="/marketplace/requests/new"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Create Request
            </Link>
          </div>

          {/* Filters */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Requests
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('my')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'my'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              My Requests
            </button>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No data requests found</p>
            <Link
              href="/marketplace/requests/new"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              Create your first request →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map((request) => (
              <Link
                key={request.id}
                href={`/marketplace/requests/${request.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {request.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                      {isExpired(request.deadline) && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {request.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Budget:</span>
                        <span className="text-green-600 font-semibold">
                          {request.budget} USDC
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Deadline:</span>
                        <span>{formatDate(request.deadline)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Proposals:</span>
                        <span className="text-blue-600 font-semibold">
                          {request._count.proposals}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Posted:</span>
                        <span>{formatDate(request.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Buyer</div>
                      <div className="text-xs font-mono text-gray-700">
                        {request.buyer.walletAddress.slice(0, 6)}...
                        {request.buyer.walletAddress.slice(-4)}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

