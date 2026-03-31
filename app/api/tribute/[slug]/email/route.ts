/**
 * PATCH /api/tribute/[slug]/email
 * Save (or update) the creator_email on a tribute record.
 * Called from the GenerationLoader when the user submits their email
 * on the loading screen — ensures the "tribute ready" email gets sent
 * even if no email was provided at creation time.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTributeBySlug, updateTribute } from '@/lib/db/tributes'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  let email: string
  try {
    const body = await req.json()
    email = (body.email || '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const tribute = await getTributeBySlug(slug)
  if (!tribute) {
    return NextResponse.json({ error: 'Tribute not found' }, { status: 404 })
  }

  // Update creator_email in DB
  await updateTribute(tribute.id, { creator_email: email })

  // If the tribute is already published, send the ready email immediately
  if (tribute.status === 'published') {
    const { sendTributeReadyEmail } = await import('@/lib/email/send')
    const { getTributePhotos } = await import('@/lib/db/photos')

    const photos = await getTributePhotos(tribute.id)
    const heroPhoto = photos[tribute.hero_photo_idx ?? 0] || photos[0]

    await sendTributeReadyEmail({
      to: email,
      subjectName: tribute.subject_name,
      tributeSlug: tribute.slug,
      heroPhotoUrl: heroPhoto?.cdn_url,
    }).catch(err => console.error('[email route] Failed to send ready email:', err))
  }

  return NextResponse.json({ ok: true })
}
