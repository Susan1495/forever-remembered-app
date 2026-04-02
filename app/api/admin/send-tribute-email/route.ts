export const dynamic = 'force-dynamic'
/**
 * POST /api/admin/send-tribute-email
 * Admin endpoint to manually send a tribute-ready email for a specific tribute.
 *
 * Protected by ADMIN_SECRET header.
 *
 * Body: { slug: string, overrideEmail?: string }
 * - slug: the tribute slug
 * - overrideEmail: optional email override (useful for testing or re-sending to a different address)
 *
 * Usage:
 *   curl -X POST https://foreverremembered.ai/api/admin/send-tribute-email \
 *     -H "x-admin-secret: YOUR_ADMIN_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"slug": "test-1-q3c23t"}'
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTributeBySlug } from '@/lib/db/tributes'
import { getTributePhotos } from '@/lib/db/photos'
import { sendTributeReadyEmail } from '@/lib/email/send'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { slug?: string; overrideEmail?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { slug, overrideEmail } = body

  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const tribute = await getTributeBySlug(slug)
  if (!tribute) {
    return NextResponse.json({ error: `Tribute not found: ${slug}` }, { status: 404 })
  }

  const recipientEmail = overrideEmail || tribute.creator_email
  if (!recipientEmail) {
    return NextResponse.json({
      error: 'No email address on file for this tribute and no overrideEmail provided',
      tribute_slug: slug,
    }, { status: 400 })
  }

  // Fetch photos to get hero photo URL
  const photos = await getTributePhotos(tribute.id)
  const heroPhoto = photos[tribute.hero_photo_idx] || photos[0]

  try {
    await sendTributeReadyEmail({
      to: recipientEmail,
      subjectName: tribute.subject_name,
      tributeSlug: tribute.slug,
      heroPhotoUrl: heroPhoto?.cdn_url,
    })

    return NextResponse.json({
      sent: true,
      to: recipientEmail,
      slug: tribute.slug,
      subject_name: tribute.subject_name,
    })
  } catch (error) {
    return NextResponse.json({
      sent: false,
      error: String(error),
      slug: tribute.slug,
    }, { status: 500 })
  }
}
