/**
 * Rate limiting using Upstash Redis
 * Falls back gracefully if Redis is not configured
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create Redis client (will fail gracefully if not configured)
function createRedis(): Redis | null {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || 
        process.env.UPSTASH_REDIS_REST_URL.includes('placeholder')) {
      return null
    }
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  } catch {
    return null
  }
}

// 3 tribute creations per IP per hour
export async function checkTributeCreationLimit(ip: string): Promise<{
  success: boolean
  remaining: number
  reset: number
}> {
  const redis = createRedis()
  
  if (!redis) {
    // No Redis configured — allow all requests in dev
    console.warn('Rate limiting disabled: Upstash Redis not configured')
    return { success: true, remaining: 99, reset: Date.now() + 3600000 }
  }

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'tribute_create',
  })

  const result = await ratelimit.limit(ip)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}

// 120 status polls per minute per IP (2/sec — supports simultaneous pollers)
export async function checkStatusPollLimit(ip: string): Promise<{
  success: boolean
}> {
  const redis = createRedis()
  
  if (!redis) {
    return { success: true }
  }

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, '1 m'),
    prefix: 'tribute_status',
  })

  const result = await ratelimit.limit(ip)
  return { success: result.success }
}

// 1 candle per IP per tribute per day
export async function checkCandleLimit(ip: string, slug: string): Promise<{
  success: boolean
}> {
  const redis = createRedis()
  
  if (!redis) {
    return { success: true }
  }

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1, '1 d'),
    prefix: 'candle',
  })

  const result = await ratelimit.limit(`${ip}:${slug}`)
  return { success: result.success }
}
