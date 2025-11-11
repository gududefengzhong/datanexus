import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentation - DataNexus',
  description: 'Complete guides for buyers, sellers, and developers',
}

export default function DocsPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Documentation</h1>
        <p className="mt-2 text-muted-foreground">
          Complete guides for buyers, sellers, and developers
        </p>
      </div>

      {/* Quick Links - Main Guides */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">📚 Main Guides</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/docs/buyer-guide">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50 h-full">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🛒</span>
                  <CardTitle>Buyer's Guide</CardTitle>
                </div>
                <CardDescription>
                  Learn how to find and purchase datasets for your AI agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge className="mb-2 bg-blue-600 hover:bg-blue-700 text-white">For Data Buyers</Badge>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Direct purchase (x402)</li>
                  <li>• Custom requests (Escrow)</li>
                  <li>• Buyer protection</li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          <Link href="/docs/seller-guide">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50 h-full">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💼</span>
                  <CardTitle>Seller's Guide</CardTitle>
                </div>
                <CardDescription>
                  Start earning passive income from your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge className="mb-2 bg-blue-600 hover:bg-blue-700 text-white">For Data Providers</Badge>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Upload datasets</li>
                  <li>• Respond to requests</li>
                  <li>• Build reputation</li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          <Link href="/docs/api-reference">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50 h-full">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔌</span>
                  <CardTitle>API Documentation</CardTitle>
                </div>
                <CardDescription>
                  Complete API reference with guide and interactive docs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge className="mb-2 bg-blue-600 hover:bg-blue-700 text-white">For Developers</Badge>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• x402 payment flow</li>
                  <li>• Python SDK</li>
                  <li>• Interactive API explorer</li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* User Stories */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">📖 User Stories</h2>
        <Link href="/docs/user-stories">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎯</span>
                <CardTitle>Real-World Use Cases</CardTitle>
              </div>
              <CardDescription>
                See how DataNexus solves real problems for AI agents, researchers, and data providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-sm">
                  <h4 className="font-semibold mb-1">🤖 AI Trading Bot</h4>
                  <p className="text-muted-foreground">
                    99.3% cost reduction with autonomous data purchasing
                  </p>
                </div>
                <div className="text-sm">
                  <h4 className="font-semibold mb-1">📊 Research DAO</h4>
                  <p className="text-muted-foreground">
                    Custom datasets with Escrow protection
                  </p>
                </div>
                <div className="text-sm">
                  <h4 className="font-semibold mb-1">🏢 Data Provider</h4>
                  <p className="text-muted-foreground">
                    $1,200+/month passive income
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Quick start guide for new users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <h4 className="font-semibold">1. Connect Wallet</h4>
              <p className="text-muted-foreground">
                Connect your Solana wallet (Phantom or Solflare)
              </p>
            </div>
            <div className="text-sm">
              <h4 className="font-semibold">2. Upload Data</h4>
              <p className="text-muted-foreground">
                Upload your dataset and set pricing
              </p>
            </div>
            <div className="text-sm">
              <h4 className="font-semibold">3. Start Earning</h4>
              <p className="text-muted-foreground">
                Receive payments when agents purchase your data
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
            <CardDescription>Integrate DataNexus into your AI agents</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className="mb-4">Coming Soon</Badge>
            <p className="text-sm text-muted-foreground">
              Full API documentation with code examples in Python and TypeScript
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supported Formats</CardTitle>
            <CardDescription>Data formats we support</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">CSV</Badge>
              <span className="text-sm text-muted-foreground">Comma-separated values</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">JSON</Badge>
              <span className="text-sm text-muted-foreground">JavaScript Object Notation</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Parquet</Badge>
              <span className="text-sm text-muted-foreground">Columnar storage format</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Models</CardTitle>
            <CardDescription>How to price your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <h4 className="font-semibold">One-Time Purchase</h4>
              <p className="text-muted-foreground">
                Buyers pay once for permanent access
              </p>
            </div>
            <div className="text-sm">
              <h4 className="font-semibold">Subscription (Coming Soon)</h4>
              <p className="text-muted-foreground">
                Recurring payments for continuous access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

