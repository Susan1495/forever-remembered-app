export const dynamic = 'force-dynamic'
/**
 * POST /api/internal/send-tribute-ready-email
 *
 * Decoupled email-send route so the tribute generation pipeline doesn't
 * get killed by Vercel's serverless timeout before the email fires.
 * Called fire-and-forget from lib/ai/generate-tribute.ts after the tribute
 * is marked as published.
 *
 * Protected by x-internal-secret header — never called from the browser.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTributeById } from '@/lib/db/tributes'
import { getTributePhotos } from '@/lib/db/photos'
import { sendTributeReadyEmail } from '@/lib/email/send'

// Give the email send its own generous timeout budget
export const maxDuration = 30

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

  // Look up tribute
  const tribute = await getTributeById(tributeId)
  if (!tribute) {
    return NextResponse.json({ error: 'Tribute not found' }, { status: 404 })
  }

  if (!tribute.creator_email) {
    // No email on record — nothing to send, but not an error
    return NextResponse.json({ ok: true, skipped: 'no creator_email' })
  }

  // Resolve the hero photo for the email
  const photos = await getTributePhotos(tributeId)
  const heroIdx = (tribute.hero_photo_idx as number | null | undefined) ?? 0
  const heroPhoto = photos[heroIdx] || photos[0]

  try {
    await sendTributeReadyEmail({
      to: tribute.creator_email,
      subjectName: tribute.subject_name,
      tributeSlug: tribute.slug,
      heroPhotoUrl: heroPhoto?.cdn_url,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(
      `[send-tribute-ready-email] Failed to send email for tribute ${tributeId}:`,
      error
    )
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
