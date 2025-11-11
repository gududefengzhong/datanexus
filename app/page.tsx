import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-4 py-24 md:py-32">
        <Badge variant="secondary" className="mb-4">
          Built for x402 Hackathon
        </Badge>
        <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            DataNexus
          </span>
        </h1>
        <p className="max-w-[700px] text-center text-lg text-muted-foreground sm:text-xl">
          The first decentralized data marketplace for AI Agents. Trade data autonomously with micropayments.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Link href="/marketplace">
            <Button size="lg" className="gap-2">
              🛒 Browse Marketplace
            </Button>
          </Link>
          <Link href="/dashboard/upload">
            <Button size="lg" variant="outline" className="gap-2">
              📤 Upload Data
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16 md:py-24">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-2 text-4xl">🗄️</div>
              <CardTitle>Permanent Storage</CardTitle>
              <CardDescription>Powered by Irys</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your data is stored permanently on Irys, ensuring it's always accessible and never lost.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 text-4xl">💸</div>
              <CardTitle>Micropayments</CardTitle>
              <CardDescription>Powered by x402</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Pay only for what you use with x402's micropayment protocol. Perfect for AI agents.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 text-4xl">⚡</div>
              <CardTitle>Fast & Cheap</CardTitle>
              <CardDescription>Built on Solana</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Lightning-fast transactions with minimal fees on Solana blockchain.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-muted/50 py-16 md:py-24">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold">Upload Data</h3>
              <p className="text-muted-foreground">
                Connect your wallet and upload datasets to Irys. Set your price and metadata.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold">List on Marketplace</h3>
              <p className="text-muted-foreground">
                Your data appears in the marketplace. AI agents can discover and evaluate it.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold">Earn Revenue</h3>
              <p className="text-muted-foreground">
                Get paid instantly via x402 when agents purchase your data. Track earnings in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16 md:py-24">
        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Ready to Get Started?</CardTitle>
            <CardDescription className="text-lg">
              Connect your Solana wallet and start trading data today
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/marketplace">
              <Button size="lg">Explore Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

