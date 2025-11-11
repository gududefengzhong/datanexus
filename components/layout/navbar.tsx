'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletButton } from '@/components/wallet/wallet-button'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Marketplace', href: '/marketplace' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Escrow', href: '/escrow' },
  { name: 'Docs', href: '/docs' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
            <span className="text-lg font-bold text-white">DN</span>
          </div>
          <span className="hidden font-bold sm:inline-block">DataNexus</span>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'transition-colors hover:text-foreground/80',
                pathname === item.href ? 'text-foreground' : 'text-foreground/60'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <WalletButton />
        </div>
      </div>
    </header>
  )
}

