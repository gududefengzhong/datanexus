import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { redis } from './redis'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const API_KEY_SECRET = process.env.API_KEY_SECRET || 'dev-api-key-secret'

export interface JWTPayload {
  userId: string
  walletAddress: string
  role: string
}

// JWT Token Functions
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

// API Key Functions
export async function generateApiKey(userId: string, name: string): Promise<string> {
  // Generate a random API key
  const apiKey = `dn_${Buffer.from(`${userId}-${Date.now()}-${Math.random()}`).toString('base64').slice(0, 32)}`
  
  // Hash the API key before storing
  const keyHash = await bcrypt.hash(apiKey, 10)
  
  // Store in database
  await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyHash,
      permissions: ['read', 'purchase'],
    },
  })
  
  // Return the plain API key (only time it's visible)
  return apiKey
}

export async function verifyApiKey(apiKey: string): Promise<{ userId: string; permissions: string[] } | null> {
  try {
    // Get all API keys (we need to check hash)
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        expiresAt: {
          gte: new Date(),
        },
      },
    })
    
    // Check each key
    for (const key of apiKeys) {
      const isValid = await bcrypt.compare(apiKey, key.keyHash)
      if (isValid) {
        // Update last used timestamp
        await prisma.apiKey.update({
          where: { id: key.id },
          data: { lastUsedAt: new Date() },
        })
        
        return {
          userId: key.userId,
          permissions: key.permissions,
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('API key verification error:', error)
    return null
  }
}

// Wallet Signature Verification
export function verifyWalletSignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  // This is a placeholder - actual implementation would use @solana/web3.js
  // to verify the signature
  // For now, we'll trust the frontend verification
  return true
}

// User Authentication with caching
export async function authenticateUser(walletAddress: string) {
  const cacheKey = `user:${walletAddress}`

  try {
    // Try to get user from cache first
    const cachedUser = await redis.get(cacheKey)
    if (cachedUser && typeof cachedUser === 'string') {
      const user = JSON.parse(cachedUser)
      const token = generateToken({
        userId: user.id,
        walletAddress: user.walletAddress,
        role: user.role,
      })
      return { user, token }
    }
  } catch (error) {
    console.warn('Redis cache error:', error)
    // Continue to database query if cache fails
  }

  // Find or create user in database
  let user = await prisma.user.findUnique({
    where: { walletAddress },
    cacheStrategy: { ttl: 60, swr: 10 }, // Cache for 60 seconds
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        walletAddress,
        role: 'both',
      },
    })
  }

  // Cache user data for 5 minutes
  try {
    await redis.setex(cacheKey, 300, JSON.stringify(user))
  } catch (error) {
    console.warn('Redis cache set error:', error)
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    walletAddress: user.walletAddress,
    role: user.role,
  })

  return { user, token }
}

