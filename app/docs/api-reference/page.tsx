'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

// Suppress React strict mode warnings from swagger-ui-react
const originalError = console.error
if (typeof window !== 'undefined') {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('UNSAFE_componentWillReceiveProps')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
}

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false }) as any

export default function ApiReferencePage() {
  const [content, setContent] = useState('')
  const [spec, setSpec] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load markdown documentation
    fetch('/docs/API_DOCUMENTATION.md')
      .then((res) => res.text())
      .then((text) => {
        setContent(text)
      })
      .catch((error) => {
        console.error('Failed to load API documentation:', error)
      })

    // Load OpenAPI spec
    fetch('/api/agent/docs')
      .then((res) => res.json())
      .then((data) => {
        setSpec(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load API spec:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading API documentation...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/docs">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Documentation
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
        <p className="text-muted-foreground">
          Complete API reference for integrating DataNexus into your AI agents
        </p>
      </div>

      <Tabs defaultValue="guide" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="guide">Guide & Examples</TabsTrigger>
          <TabsTrigger value="reference">API Reference</TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="mt-6">
          <Card className="p-8">
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-4xl font-bold mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-3xl font-semibold mt-8 mb-4">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-2xl font-semibold mt-6 mb-3">{children}</h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-xl font-semibold mt-4 mb-2">{children}</h4>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-7">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="ml-4">{children}</li>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className
                    if (isInline) {
                      return (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      )
                    }
                    return (
                      <code className={className}>
                        {children}
                      </code>
                    )
                  },
                  pre: ({ children }) => (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic my-4">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-primary hover:underline"
                      target={href?.startsWith('http') ? '_blank' : undefined}
                      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {children}
                    </a>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full divide-y divide-border">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2 bg-muted font-semibold text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2 border-t border-border">
                      {children}
                    </td>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </article>
          </Card>
        </TabsContent>

        <TabsContent value="reference" className="mt-6">
          {spec ? (
            <Card className="p-4">
              <SwaggerUI
                spec={spec}
                docExpansion="list"
                defaultModelsExpandDepth={1}
                defaultModelExpandDepth={1}
                displayRequestDuration={true}
                filter={true}
                showExtensions={true}
                showCommonExtensions={true}
              />
            </Card>
          ) : (
            <Card className="p-8">
              <p className="text-muted-foreground text-center">
                Failed to load API specification
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

