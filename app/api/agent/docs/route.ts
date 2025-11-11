import { NextResponse } from 'next/server'
import { swaggerSpec } from '@/lib/swagger'

/**
 * GET /api/agent/docs
 * Get OpenAPI specification
 */
export async function GET() {
  return NextResponse.json(swaggerSpec)
}

