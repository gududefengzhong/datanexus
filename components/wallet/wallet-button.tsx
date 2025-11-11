'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Authenticate user when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      authenticateUser()
    } else {
      setUser(null)
    }
  }, [connected, publicKey])

  const authenticateUser = async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        // Store token in localStorage
        localStorage.setItem('auth_token', data.token)
      }
    } catch (error) {
      console.error('Authentication error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setUser(null)
    localStorage.removeItem('auth_token')
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Button variant="outline" className="gap-2" disabled>
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    )
  }

  if (!connected) {
    return <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
  }

  const shortAddress = publicKey
    ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
    : ''

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {shortAddress.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{shortAddress}</span>
          {user && (
            <Badge variant="secondary" className="ml-1 hidden md:inline">
              {user.role}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">My Account</p>
            <p className="text-xs text-muted-foreground">{shortAddress}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => (window.location.href = '/dashboard')}>
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => (window.location.href = '/dashboard/products')}>
          My Products
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => (window.location.href = '/dashboard/purchases')}>
          My Purchases
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => (window.location.href = '/dashboard/api-keys')}>
          API Keys
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="text-red-600">
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

