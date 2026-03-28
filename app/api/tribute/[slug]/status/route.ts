/**
 * GET /api/tribute/[slug]/status
 * Poll generation status — called every 3 seconds from the loading screen
 * Rate limited: 20 req/min per IP
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTributeBySlug } from '@/lib/db/tributes'
import { checkStatusPollLimit } from '@/lib/rate-limit'

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ip = getClientIP(req)

  // Rate limit polling
  const rateLimit = await checkStatusPollLimit(ip)
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const tribute = await getTributeBySlug(params.slug)

  if (!tribute) {
    return NextResponse.json(
      { status: 'failed' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache',
        },
      }
    )
  }

  return NextResponse.json(
    { status: tribute.status },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache',
      },
    }
  )
}
