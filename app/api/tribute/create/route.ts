export const dynamic = 'force-dynamic'
/**
 * POST /api/tribute/create
 * Create tribute record and kick off AI generation pipeline
 * Rate limited: 3 per IP per hour
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createTribute } from '@/lib/db/tributes'

// Allow up to 60 s of execution time so waitUntil-triggered generation isn't
// cut short on Vercel's hobby/free tier.
export const maxDuration = 60
import { insertTributePhotos } from '@/lib/db/photos'
import { generateSlug, determineAgeGroup, isPersonLiving } from '@/lib/slug'
import { checkTributeCreationLimit } from '@/lib/rate-limit'
import type { CreateTributeRequest, CreateTributeResponse } from '@/lib/types'
import crypto from 'crypto'

// Hash IP for privacy (stored as hash, not raw IP)
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + 'forever-remembered-salt').digest('hex').slice(0, 16)
}

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)

  // Rate limit check
  const rateLimit = await checkTributeCreationLimit(ip)
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "You've created a few tributes recently. Please wait a bit before trying again." },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    )
  }

  let body: CreateTributeRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate required fields
  if (!body.subjectName?.trim()) {
    return NextResponse.json({ error: 'Subject name is required' }, { status: 400 })
  }

  // Determine life status and age group
  const living = isPersonLiving(body.deathDate || null)
  const ageGroup = determineAgeGroup(
    body.birthDate || null,
    body.deathDate || null,
    body.relationship || null
  )

  // Generate slug
  const slug = generateSlug(body.subjectName)

  try {
    // Create tribute record
    const tribute = await createTribute({
      slug,
      subject_name: body.subjectName.trim(),
      subject_bio: body.subjectBio?.trim() || undefined,
      birth_date: body.birthDate || undefined,
      death_date: body.deathDate || undefined,
      relationship: body.relationship || undefined,
      extra_context: body.extraContext?.trim() || undefined,
      creator_email: body.creatorEmail?.trim().toLowerCase() || undefined,
      creator_ip: hashIP(ip),
      is_living: living,
      subject_age_group: ageGroup,
    })

    // Insert photo records if photos were uploaded
    if (body.photoStoragePaths && body.photoStoragePaths.length > 0) {
      // Trim any accidental whitespace/newlines from env var before building URLs
      const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
      const photoRecords = body.photoStoragePaths.map((path, idx) => ({
        storage_path: path,
        cdn_url: `${supabaseUrl}/storage/v1/object/public/tribute-photos/${path}`,
        display_order: idx,
      }))

      await insertTributePhotos(tribute.id, photoRecords)
    }

    // Kick off AI generation pipeline via a separate internal endpoint.
    // waitUntil keeps the Vercel function alive after the HTTP response is
    // sent, so the generation pipeline isn't killed mid-flight.
    const generateUrl = `${process.env.NEXT_PUBLIC_URL}/api/generate-tribute`
    waitUntil(
      fetch(generateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_SECRET!,
        },
        body: JSON.stringify({ tributeId: tribute.id }),
      })
        .then(async res => {
          if (!res.ok) {
            const body = await res.text().catch(() => '(no body)')
            console.error(
              `[create] generate-tribute returned ${res.status} for ${tribute.id}: ${body}`
            )
          }
        })
        .catch(err => console.error('[create] Failed to kick off generation:', err))
    )

    const response: CreateTributeResponse = {
      slug: tribute.slug,
      tributeId: tribute.id,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Failed to create tribute:', error)
    return NextResponse.json(
      { error: 'Something went wrong on our end. Please try again.' },
      { status: 500 }
    )
  }
}
