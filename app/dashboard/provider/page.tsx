'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ProviderDashboard {
  overview: {
    totalRevenue: number
    netRevenue: number
    platformFee: number
    thisMonthRevenue: number
    totalSales: number
    totalDatasets: number
    totalViews: number
    totalProposals: number
  }
  reputation: {
    reputationScore: number
    badges: string[]
    averageRating: number
    totalRatings: number
  }
  datasets: {
    total: number
    topSelling: Array<{
      id: string
      name: string
      sales: number
      revenue: number
    }>
  }
  proposals: {
    total: number
    pending: number
    accepted: number
    delivered: number
    confirmed: number
    rejected: number
  }
  recentActivity: Array<{
    type: 'order' | 'proposal'
    id: string
    title: string
    amount: number
    status: string
    createdAt: string
  }>
}

export default function ProviderDashboardPage() {
  const [dashboard, setDashboard] = useState<ProviderDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const apiKey = localStorage.getItem('apiKey') || ''
      
      const response = await fetch('/api/provider/dashboard', {
        headers: {
          'x-api-key': apiKey,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDashboard(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">无法加载仪表板数据</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">提供商仪表板</h1>
          <p className="mt-2 text-sm text-gray-600">
            查看你的收益、数据集和提案统计
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Revenue */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">总收益</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(dashboard.overview.totalRevenue)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Net Revenue */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      净收益 <span className="text-xs">(扣除5%平台费)</span>
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-green-600">
                        {formatCurrency(dashboard.overview.netRevenue)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Sales */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">总销量</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {dashboard.overview.totalSales}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Reputation Score */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">信誉分数</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {dashboard.reputation.reputationScore.toFixed(1)}
                      </div>
                      <div className="ml-2 text-sm text-gray-500">
                        ({dashboard.reputation.averageRating.toFixed(1)}⭐)
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Selling Datasets */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">热销数据集</h2>
            </div>
            <div className="p-6">
              {dashboard.datasets.topSelling.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">暂无数据</p>
              ) : (
                <div className="space-y-4">
                  {dashboard.datasets.topSelling.map((dataset) => (
                    <div key={dataset.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <Link
                          href={`/datasets/${dataset.id}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          {dataset.name}
                        </Link>
                        <p className="text-xs text-gray-500">{dataset.sales} 次销售</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(dataset.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Proposal Stats */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">提案统计</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">总提案数</span>
                  <span className="text-sm font-semibold">{dashboard.proposals.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">待处理</span>
                  <span className="text-sm font-semibold text-yellow-600">{dashboard.proposals.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">已接受</span>
                  <span className="text-sm font-semibold text-blue-600">{dashboard.proposals.accepted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">已交付</span>
                  <span className="text-sm font-semibold text-indigo-600">{dashboard.proposals.delivered}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">已确认</span>
                  <span className="text-sm font-semibold text-green-600">{dashboard.proposals.confirmed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">已拒绝</span>
                  <span className="text-sm font-semibold text-red-600">{dashboard.proposals.rejected}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">最近活动</h2>
          </div>
          <div className="p-6">
            {dashboard.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">暂无活动</p>
            ) : (
              <div className="space-y-4">
                {dashboard.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.type === 'order' ? '订单' : '提案'} • {formatDate(activity.createdAt)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(activity.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{activity.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

