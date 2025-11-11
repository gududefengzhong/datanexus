/**
 * API Key Authentication for Public API
 * 
 * This module provides authentication for the public API (v1)
 * using API keys instead of JWT tokens.
 */

import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export interface ApiAuthResult {
  authenticated: boolean
  userId?: string
  permissions?: string[]
  error?: string
}

/**
 * Verify API key from request headers
 */
export async function verifyApiKeyFromRequest(
  request: NextRequest
): Promise<ApiAuthResult> {
  try {
    // Get API key from header
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return {
        authenticated: false,
        error: 'Missing API key. Include X-API-Key header in your request.',
      }
    }

    // Validate API key format
    if (!apiKey.startsWith('sk_')) {
      return {
        authenticated: false,
        error: 'Invalid API key format',
      }
    }

    // Find all API keys (we need to check hashes)
    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        userId: true,
        keyHash: true,
        permissions: true,
        expiresAt: true,
        lastUsedAt: true,
      },
    })

    // Check each key hash
    for (const key of apiKeys) {
      const isValid = await bcrypt.compare(apiKey, key.keyHash)

      if (isValid) {
        // Check if key is expired
        if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
          return {
            authenticated: false,
            error: 'API key has expired',
          }
        }

        // Update last used timestamp (async, don't wait)
        prisma.apiKey
          .update({
            where: { id: key.id },
            data: { lastUsedAt: new Date() },
          })
          .catch(console.error)

        return {
          authenticated: true,
          userId: key.userId,
          permissions: key.permissions,
        }
      }
    }

    return {
      authenticated: false,
      error: 'Invalid API key',
    }
  } catch (error) {
    console.error('API key verification error:', error)
    return {
      authenticated: false,
      error: 'Authentication failed',
    }
  }
}

/**
 * Verify API key from Bearer token (for Agent API)
 * Returns user object or null if invalid
 */
export async function verifyApiKey(apiKeyOrRequest: string | NextRequest) {
  try {
    // Extract API key from request or use directly
    let apiKey: string | null = null

    if (typeof apiKeyOrRequest === 'string') {
      apiKey = apiKeyOrRequest
    } else {
      // Extract from request headers
      apiKey = apiKeyOrRequest.headers.get('x-api-key') ||
               apiKeyOrRequest.headers.get('authorization')?.replace('Bearer ', '') ||
               null
    }

    if (!apiKey) {
      return null
    }

    // Validate API key format
    if (!apiKey.startsWith('sk_')) {
      return null
    }

    // Find all API keys (we need to check hashes)
    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        userId: true,
        keyHash: true,
        permissions: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
      },
    })

    // Check each key hash
    for (const key of apiKeys) {
      const isValid = await bcrypt.compare(apiKey, key.keyHash)

      if (isValid) {
        // Check if key is expired
        if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
          return null
        }

        // Update last used timestamp (async, don't wait)
        prisma.apiKey
          .update({
            where: { id: key.id },
            data: { lastUsedAt: new Date() },
          })
          .catch(console.error)

        return key.user
      }
    }

    return null
  } catch (error) {
    console.error('API key verification error:', error)
    return null
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  permissions: string[],
  required: string
): boolean {
  return permissions.includes(required) || permissions.includes('*')
}

/**
 * Rate limiting (simple in-memory implementation)
 * In production, use Redis or a proper rate limiting service
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  userId: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || userLimit.resetAt < now) {
    // Reset or create new limit
    rateLimitMap.set(userId, {
      count: 1,
      resetAt: now + windowMs,
    })
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    }
  }

  if (userLimit.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: userLimit.resetAt,
    }
  }

  userLimit.count++
  return {
    allowed: true,
    remaining: limit - userLimit.count,
    resetAt: userLimit.resetAt,
  }
}

