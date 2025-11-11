/**
 * Escrow Management Page
 * Display all user's Escrows and operations
 */

import { Metadata } from 'next'
import EscrowList from '@/components/escrow/EscrowList'
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Escrow Management - DataNexus',
  description: 'Manage your smart contract escrows',
}

export default function EscrowPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Smart Contract Escrow
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Decentralized escrow system based on Solana Anchor, protecting both buyers and providers
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg">Secure Custody</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Funds held in Solana smart contract, fully decentralized, platform cannot misuse
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">Dual Protection</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Buyers can raise disputes, providers protected by platform arbitration, ensuring fair trade
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg">Dispute Resolution</h3>
            </div>
            <p className="text-gray-600 text-sm">
              In case of disputes, platform investigates and arbitrates to ensure fair resolution
            </p>
          </div>
        </div>

        {/* Escrow List */}
        <EscrowList />

        {/* Status Flow Chart */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Escrow Flow</h2>

          <div className="max-w-4xl mx-auto">
            {/* Flow Chart */}
            <div className="space-y-4">
              {/* Create → Fund */}
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-100 rounded-lg p-4">
                  <div className="font-semibold text-gray-900">1. Create Escrow</div>
                  <div className="text-sm text-gray-600">Buyer creates and funds escrow</div>
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex-1 bg-blue-100 rounded-lg p-4">
                  <div className="font-semibold text-blue-900">2. Funded</div>
                  <div className="text-sm text-blue-700">Funds held in smart contract</div>
                </div>
              </div>

              {/* Branch: Cancel */}
              <div className="ml-8 flex items-center gap-4">
                <div className="text-gray-400">↓ or</div>
                <div className="flex-1 bg-red-100 rounded-lg p-4">
                  <div className="font-semibold text-red-900">Cancel Order</div>
                  <div className="text-sm text-red-700">Buyer cancels, full refund</div>
                </div>
              </div>

              {/* Delivery */}
              <div className="flex items-center gap-4">
                <div className="text-gray-400">↓</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-purple-100 rounded-lg p-4">
                  <div className="font-semibold text-purple-900">3. Delivered</div>
                  <div className="text-sm text-purple-700">Provider marks delivery</div>
                </div>
              </div>

              {/* Branch: Confirm or Dispute */}
              <div className="ml-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-gray-400">↓ confirm</div>
                  <div className="flex-1 bg-green-100 rounded-lg p-4">
                    <div className="font-semibold text-green-900">4a. Completed</div>
                    <div className="text-sm text-green-700">95% to provider, 5% to platform</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-gray-400">↓ or dispute</div>
                  <div className="flex-1 bg-yellow-100 rounded-lg p-4">
                    <div className="font-semibold text-yellow-900">4b. Disputed</div>
                    <div className="text-sm text-yellow-700">Platform investigates</div>
                  </div>
                </div>

                {/* Dispute Resolution */}
                <div className="ml-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-gray-400">↓ arbitrate</div>
                    <div className="flex-1 bg-orange-100 rounded-lg p-4">
                      <div className="font-semibold text-orange-900">5a. Refunded</div>
                      <div className="text-sm text-orange-700">Platform rules in favor of buyer, full refund</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-gray-400">↓ or</div>
                    <div className="flex-1 bg-green-100 rounded-lg p-4">
                      <div className="font-semibold text-green-900">5b. Completed</div>
                      <div className="text-sm text-green-700">Platform rules in favor of provider, release funds</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Technical Features
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <strong>• Smart Contract:</strong> Anchor 0.32.1 + Solana 3.0.10
            </div>
            <div>
              <strong>• Program ID:</strong> gxDTe...9698
            </div>
            <div>
              <strong>• Network:</strong> Solana Devnet
            </div>
            <div>
              <strong>• Custody Method:</strong> PDA (Program Derived Address)
            </div>
            <div>
              <strong>• Fee Split:</strong> 95% provider + 5% platform
            </div>
            <div>
              <strong>• Security:</strong> Access control + State machine + Dispute resolution
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

