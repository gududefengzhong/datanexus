import { Redis } from '@upstash/redis'

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error('Missing Redis environment variables')
}

export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

// Helper functions for common operations
export const redisHelpers = {
  // Cache user data
  async cacheUser(userId: string, userData: any, ttl: number = 3600) {
    await redis.set(`user:${userId}`, JSON.stringify(userData), { ex: ttl })
  },

  async getUser(userId: string) {
    const data = await redis.get(`user:${userId}`)
    return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null
  },

  // Cache product data
  async cacheProduct(productId: string, productData: any, ttl: number = 1800) {
    await redis.set(`product:${productId}`, JSON.stringify(productData), { ex: ttl })
  },

  async getProduct(productId: string) {
    const data = await redis.get(`product:${productId}`)
    return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null
  },

  // Increment counters
  async incrementViews(productId: string) {
    return await redis.incr(`views:${productId}`)
  },

  async incrementPurchases(productId: string) {
    return await redis.incr(`purchases:${productId}`)
  },

  // Rate limiting
  async checkRateLimit(key: string, limit: number, window: number) {
    const current = await redis.incr(key)
    if (current === 1) {
      await redis.expire(key, window)
    }
    return current <= limit
  },
}

