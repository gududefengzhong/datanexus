'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null)

  useEffect(() => {
    fetch('/api/agent/docs')
      .then((res) => res.json())
      .then((data) => setSpec(data))
      .catch((error) => console.error('Failed to load API spec:', error))
  }, [])

  if (!spec) {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Agent API Documentation</h1>
        <p className="text-muted-foreground">
          RESTful API for AI Agents to search, purchase, and download datasets
        </p>
      </div>
      <SwaggerUI spec={spec} />
    </div>
  )
}



