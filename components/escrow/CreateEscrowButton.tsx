/**
 * Create Escrow Button Component
 * Used to create smart contract escrow in the request marketplace
 */

'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CreateEscrowButtonProps {
  requestId: string
  proposalId: string
  providerPublicKey: string
  amount: number
  onSuccess?: (escrowPda: string, signature: string) => void
  className?: string
}

export default function CreateEscrowButton({
  requestId,
  proposalId,
  providerPublicKey,
  amount,
  onSuccess,
  className = '',
}: CreateEscrowButtonProps) {
  const wallet = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateEscrow = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError('Please connect your wallet first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Build transaction on backend
      const buildResponse = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerPublicKey: wallet.publicKey.toBase58(),
          providerPublicKey,
          amount,
          requestId,
          proposalId,
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
      const confirmResponse = await fetch('/api/escrow/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          escrowPda: buildData.escrowPda,
          buyerPublicKey: wallet.publicKey.toBase58(),
          providerPublicKey,
          amount,
          requestId,
          proposalId,
        }),
      })

      const confirmData = await confirmResponse.json()

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || 'Failed to confirm escrow')
      }

      // Success
      if (onSuccess) {
        onSuccess(confirmData.escrowPda, signature)
      }

      // Show success toast
      toast.success('Escrow Created Successfully!', {
        description: (
          <div className="space-y-2">
            <p className="text-xs">Escrow PDA: {confirmData.escrowPda.slice(0, 8)}...{confirmData.escrowPda.slice(-8)}</p>
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
      console.error('Create escrow error:', err)
      setError(err.message || 'Failed to create Escrow')
      toast.error('Failed to Create Escrow', {
        description: err.message || 'Failed to create Escrow',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleCreateEscrow}
        disabled={loading || !wallet.publicKey}
        className={`
          flex items-center justify-center gap-2 px-6 py-3
          bg-gradient-to-r from-blue-600 to-purple-600
          text-white font-semibold rounded-lg
          hover:from-blue-700 hover:to-purple-700
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${className}
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Creating...</span>
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            <span>Create Smart Contract Escrow</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {!wallet.publicKey && (
        <p className="mt-2 text-sm text-gray-500">
          Please connect your wallet to create Escrow
        </p>
      )}

      {/* Explanation */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Smart Contract Escrow
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Funds are held in a Solana smart contract, fully decentralized</li>
          <li>• After delivery, you can confirm and release funds (95% to provider, 5% to platform)</li>
          <li>• If there's an issue, you can raise a dispute for platform arbitration</li>
          <li>• Before delivery, you can cancel anytime and get a full refund</li>
          <li>• Escrow Amount: {amount} USDC</li>
        </ul>
      </div>
    </div>
  )
}

