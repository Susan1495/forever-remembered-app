export const dynamic = 'force-dynamic'

/**
 * POST /api/tribute/[slug]/candle
 * Increment candle count — rate limited to 1 per IP per tribute per day
 */

import { NextRequest, NextResponse } from 'next/server'
import { incrementCandleCount, logEvent, getTributeBySlug } from '@/lib/db/tributes'
import { checkCandleLimit } from '@/lib/rate-limit'

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ip = getClientIP(req)
  const { slug } = params

  // Rate limit: 1 candle per IP per tribute per day
  const rateLimit = await checkCandleLimit(ip, slug)
  if (!rateLimit.success) {
    // Return current count without incrementing (graceful)
    const tribute = await getTributeBySlug(slug)
    return NextResponse.json({ candleCount: tribute?.candle_count ?? 0 })
  }

  try {
    const candleCount = await incrementCandleCount(slug)

    // Log analytics event
    const tribute = await getTributeBySlug(slug)
    if (tribute) {
      await logEvent(tribute.id, 'candle').catch(() => {})
    }

    return NextResponse.json({ candleCount })
  } catch (error) {
    console.error('Failed to increment candle:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
