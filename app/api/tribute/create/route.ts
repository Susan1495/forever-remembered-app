/**
 * POST /api/tribute/create
 * Create tribute record and kick off AI generation pipeline
 * Rate limited: 3 per IP per hour
 */

import { NextRequest, NextResponse } from 'next/server'
import { createTribute } from '@/lib/db/tributes'
import { insertTributePhotos } from '@/lib/db/photos'
import { generateTribute } from '@/lib/ai/generate-tribute'
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
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const photoRecords = body.photoStoragePaths.map((path, idx) => ({
        storage_path: path,
        cdn_url: `${supabaseUrl}/storage/v1/object/public/tribute-photos/${path}`,
        display_order: idx,
      }))

      await insertTributePhotos(tribute.id, photoRecords)
    }

    // Kick off AI generation pipeline asynchronously
    // Using a non-blocking promise (Vercel Edge Runtime compatible)
    // Generation updates tribute status when complete
    const generationPromise = generateTribute(tribute.id)

    // On Vercel, use waitUntil to keep the function alive for generation
    if (typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis) {
      // Edge runtime - generation runs in background
      generationPromise.catch(err => console.error('Generation failed:', err))
    } else {
      // Node runtime - let it run async
      generationPromise.catch(err => console.error('Generation failed:', err))
    }

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
