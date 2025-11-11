'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

export default function NewRequestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const authToken = localStorage.getItem('auth_token')
      if (!authToken) {
        throw new Error('Please login first')
      }

      // Validate form
      if (!formData.title || !formData.description || !formData.budget || !formData.deadline) {
        throw new Error('Please fill in all fields')
      }

      const budget = parseFloat(formData.budget)
      if (isNaN(budget) || budget <= 0) {
        throw new Error('Budget must be a positive number')
      }

      // Parse MM/DD/YYYY format to Date
      const dateParts = formData.deadline.split('/')
      if (dateParts.length !== 3) {
        throw new Error('Invalid date format. Please use MM/DD/YYYY')
      }

      const [month, day, year] = dateParts.map(p => parseInt(p, 10))
      if (!month || !day || !year || month < 1 || month > 12 || day < 1 || day > 31 || year < 2000) {
        throw new Error('Invalid date. Please check month, day, and year')
      }

      const deadline = new Date(year, month - 1, day)
      if (isNaN(deadline.getTime())) {
        throw new Error('Invalid date')
      }

      if (deadline <= new Date()) {
        throw new Error('Deadline must be in the future')
      }

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          budget,
          deadline: deadline.toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create request')
      }

      // Redirect to request detail page
      router.push(`/marketplace/requests/${data.request.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/marketplace/requests"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Data Request</h1>
          <p className="mt-2 text-gray-600">
            Describe your data needs and let providers submit proposals
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Need 2024 Cryptocurrency Trading Data"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your data requirements in detail..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Include format, time range, data fields, quality requirements, etc.
            </p>
          </div>

          {/* Budget */}
          <div className="mb-6">
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
              Budget (USDC) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="100"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <span className="absolute right-4 top-2 text-gray-500">USDC</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Maximum amount you're willing to pay for this data
            </p>
          </div>

          {/* Deadline */}
          <div className="mb-8">
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline *
            </label>
            <input
              type="text"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={(e) => {
                const value = e.target.value
                // Allow only numbers and slashes
                const cleaned = value.replace(/[^\d/]/g, '')

                // Auto-format as MM/DD/YYYY
                let formatted = cleaned
                if (cleaned.length >= 2 && !cleaned.includes('/')) {
                  formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2)
                }
                if (cleaned.length >= 5 && cleaned.split('/').length === 2) {
                  const parts = cleaned.split('/')
                  formatted = parts[0] + '/' + parts[1].slice(0, 2) + '/' + parts[1].slice(2)
                }

                // Limit to MM/DD/YYYY format (10 characters)
                if (formatted.length <= 10) {
                  setFormData({ ...formData, deadline: formatted })
                }
              }}
              placeholder="MM/DD/YYYY"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              When do you need this data by? (Format: MM/DD/YYYY)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Request'
              )}
            </button>
            <Link
              href="/marketplace/requests"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Your request will be published to the marketplace</li>
            <li>Data providers will submit proposals with their pricing and delivery time</li>
            <li>You can review proposals and accept the one that best fits your needs</li>
            <li>Once accepted, funds will be held in a smart contract escrow</li>
            <li>Provider delivers the data, you confirm, and funds are released automatically</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

