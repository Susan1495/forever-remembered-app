export const dynamic = 'force-dynamic'
/**
 * POST /api/tribute/generate
 * Internal endpoint: runs the AI generation pipeline synchronously.
 * Called via waitUntil from /api/tribute/create so Vercel keeps the
 * function alive after the HTTP response has been sent to the user.
 *
 * Protected by x-internal-secret header — never call this from the browser.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateTribute } from '@/lib/ai/generate-tribute'

// Allow up to 60 s of execution time (Vercel Pro: up to 300 s)
export const maxDuration = 60

export async function POST(req: NextRequest) {
  // Validate internal secret
  const secret = req.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let tributeId: string
  try {
    const body = await req.json()
    tributeId = body.tributeId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!tributeId) {
    return NextResponse.json({ error: 'tributeId is required' }, { status: 400 })
  }

  try {
    await generateTribute(tributeId)
    return NextResponse.json({ status: 'published' })
  } catch (error) {
    console.error(`[generate] Pipeline error for ${tributeId}:`, error)
    return NextResponse.json(
      { status: 'failed', error: String(error) },
      { status: 500 }
    )
  }
}
