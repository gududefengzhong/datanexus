'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface EscrowInfo {
  address: string
  balance: number
  expectedAmount: number
  status: string
  buyer: string
  provider?: string
  createdAt: string
  isFunded: boolean
}

interface EscrowStatusProps {
  escrowAddress: string
  onRefresh?: () => void
}

export default function EscrowStatus({ escrowAddress, onRefresh }: EscrowStatusProps) {
  const [escrow, setEscrow] = useState<EscrowInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (escrowAddress) {
      fetchEscrowStatus()
    }
  }, [escrowAddress])

  const fetchEscrowStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const apiKey = localStorage.getItem('apiKey') || ''
      
      const response = await fetch(`/api/escrow/${escrowAddress}`, {
        headers: {
          'x-api-key': apiKey,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setEscrow(data.escrow)
      } else {
        const data = await response.json()
        setError(data.error?.message || '无法加载托管信息')
      }
    } catch (err) {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchEscrowStatus()
    onRefresh?.()
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
        return '待响应'
      case 'in_progress':
        return '进行中'
      case 'completed':
        return '已完成'
      case 'cancelled':
        return '已取消'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  if (!escrow) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Solana 托管账户</h3>
        </div>
        <button
          onClick={handleRefresh}
          className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Status Badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(escrow.status)}`}>
            {escrow.isFunded ? '✅ 已充值' : '⏳ 待充值'}
          </span>
        </div>

        {/* Escrow Address */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">托管地址</label>
          <div className="flex items-center">
            <code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded font-mono text-gray-800 overflow-x-auto">
              {escrow.address}
            </code>
            <Link
              href={`https://explorer.solana.com/address/${escrow.address}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-indigo-600 hover:text-indigo-500"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Balance Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">当前余额</label>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(escrow.balance)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预期金额</label>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(escrow.expectedAmount)}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">买家</label>
            <code className="text-xs bg-gray-100 px-3 py-2 rounded font-mono text-gray-800 block overflow-x-auto">
              {escrow.buyer}
            </code>
          </div>
          {escrow.provider && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">提供商</label>
              <code className="text-xs bg-gray-100 px-3 py-2 rounded font-mono text-gray-800 block overflow-x-auto">
                {escrow.provider}
              </code>
            </div>
          )}
        </div>

        {/* Created At */}
        <div className="text-sm text-gray-500">
          创建于 {formatDate(escrow.createdAt)}
        </div>

        {/* Warning if not funded */}
        {!escrow.isFunded && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">托管账户未充值</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  买家需要向托管账户转账 {formatCurrency(escrow.expectedAmount)} USDC 以激活合约
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success if funded */}
        {escrow.isFunded && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-green-800">托管账户已充值</h4>
                <p className="text-sm text-green-700 mt-1">
                  资金已安全锁定在 Solana 链上，等待提供商交付数据
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

