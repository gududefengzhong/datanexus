'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle, Upload, Package } from 'lucide-react'

interface DataRequest {
  id: string
  title: string
  description: string
  budget: number
  deadline: string
}

interface DataProduct {
  id: string
  name: string
  description: string
  price: number
  category: string
}

export default function SubmitProposalPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string

  const [request, setRequest] = useState<DataRequest | null>(null)
  const [myProducts, setMyProducts] = useState<DataProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    description: '',
    price: '',
    deliveryTime: '',
    sampleDataUrl: '',
    useExistingProduct: false,
    selectedProductId: '',
  })

  useEffect(() => {
    fetchData()
  }, [requestId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch request details
      const requestRes = await fetch(`/api/requests/${requestId}`)
      const requestData = await requestRes.json()

      if (!requestData.success) {
        throw new Error(requestData.error?.message || 'Failed to load request')
      }

      setRequest(requestData.request)

      // Fetch user's products
      const authToken = localStorage.getItem('auth_token')
      if (authToken) {
        const productsRes = await fetch('/api/products/my-products', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        })

        const productsData = await productsRes.json()
        if (productsData.success) {
          setMyProducts(productsData.products || [])
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData({ ...formData, [name]: checked })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const authToken = localStorage.getItem('auth_token')
      if (!authToken) {
        throw new Error('Please login first')
      }

      // Validate form
      if (!formData.description || !formData.price || !formData.deliveryTime) {
        throw new Error('Please fill in all required fields')
      }

      const price = parseFloat(formData.price)
      if (isNaN(price) || price <= 0) {
        throw new Error('Price must be a positive number')
      }

      const deliveryTime = parseInt(formData.deliveryTime, 10)
      if (isNaN(deliveryTime) || deliveryTime <= 0) {
        throw new Error('Delivery time must be a positive number')
      }

      // If using existing product, validate selection
      if (formData.useExistingProduct && !formData.selectedProductId) {
        throw new Error('Please select a product')
      }

      const response = await fetch(`/api/requests/${requestId}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          description: formData.description,
          price,
          deliveryTime,
          sampleDataUrl: formData.sampleDataUrl || null,
          datasetId: formData.useExistingProduct ? formData.selectedProductId : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to submit proposal')
      }

      // Success - redirect to request detail page
      router.push(`/marketplace/requests/${requestId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to submit proposal')
    } finally {
      setSubmitting(false)
    }
  }

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

  if (error && !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/marketplace/requests"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href={`/marketplace/requests/${requestId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Request
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Proposal</h1>
          <p className="text-gray-600">
            Submit your proposal for: <span className="font-semibold">{request?.title}</span>
          </p>
        </div>

        {/* Request Info */}
        {request && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">Request Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Budget:</span>
                <span className="ml-2 font-semibold text-blue-900">{request.budget} USDC</span>
              </div>
              <div>
                <span className="text-blue-700">Deadline:</span>
                <span className="ml-2 font-semibold text-blue-900">
                  {new Date(request.deadline).toLocaleDateString('en-US')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Use Existing Product */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="useExistingProduct"
                checked={formData.useExistingProduct}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Use an existing data product
              </span>
            </label>
            <p className="mt-1 text-sm text-gray-500">
              If you already have a suitable dataset, you can select it here
            </p>
          </div>

          {/* Product Selection */}
          {formData.useExistingProduct && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label htmlFor="selectedProductId" className="block text-sm font-medium text-gray-700 mb-2">
                Select Product *
              </label>
              {myProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">You don't have any products yet</p>
                  <Link
                    href="/dashboard/products/upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Product
                  </Link>
                </div>
              ) : (
                <select
                  id="selectedProductId"
                  name="selectedProductId"
                  value={formData.selectedProductId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={formData.useExistingProduct}
                >
                  <option value="">-- Select a product --</option>
                  {myProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.price} USDC ({product.category})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Describe what data you will provide, how it meets the requirements, and any additional details..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Explain how your data meets the buyer's requirements
            </p>
          </div>

          {/* Price and Delivery Time */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price (USDC) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="80"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Budget: {request?.budget} USDC
              </p>
            </div>

            <div>
              <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Time (days) *
              </label>
              <input
                type="number"
                id="deliveryTime"
                name="deliveryTime"
                value={formData.deliveryTime}
                onChange={handleChange}
                placeholder="3"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                How many days to deliver the data
              </p>
            </div>
          </div>

          {/* Sample Data URL */}
          <div className="mb-8">
            <label htmlFor="sampleDataUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Sample Data URL (Optional)
            </label>
            <input
              type="url"
              id="sampleDataUrl"
              name="sampleDataUrl"
              value={formData.sampleDataUrl}
              onChange={handleChange}
              placeholder="https://gateway.irys.xyz/sample123"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-500">
              Provide a link to sample data to help the buyer evaluate your proposal
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Proposal'
              )}
            </button>
            <Link
              href={`/marketplace/requests/${requestId}`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

