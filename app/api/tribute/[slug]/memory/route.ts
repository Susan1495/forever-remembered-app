/**
 * POST /api/tribute/[slug]/memory
 * Add a memory to a tribute (guestbook entry).
 * Requires tribute to be a paid tier (cherish_monthly, cherish_annual, legacy).
 * Returns 402 with { requiresUpgrade: true } for free-tier tributes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTributeBySlug } from '@/lib/db/tributes'
import { createMemory } from '@/lib/db/memories'

export const dynamic = 'force-dynamic'

const PAID_TIERS = new Set(['cherish_monthly', 'cherish_annual', 'legacy'])

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  // Fetch tribute
  const tribute = await getTributeBySlug(slug)
  if (!tribute) {
    return NextResponse.json({ error: 'Tribute not found' }, { status: 404 })
  }

  // Tier check — free tributes cannot accept memories
  if (!tribute.tier || !PAID_TIERS.has(tribute.tier)) {
    return NextResponse.json({ requiresUpgrade: true }, { status: 402 })
  }

  // Parse body
  let body: { authorName?: string; body?: string; photoUrl?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { authorName, body: memoryBody, photoUrl } = body

  if (!memoryBody || typeof memoryBody !== 'string' || memoryBody.trim().length === 0) {
    return NextResponse.json({ error: 'Memory text is required' }, { status: 400 })
  }

  if (memoryBody.trim().length > 2000) {
    return NextResponse.json({ error: 'Memory text too long (max 2000 characters)' }, { status: 400 })
  }

  try {
    const memory = await createMemory({
      tributeId: tribute.id,
      authorName: (authorName?.trim()) || 'Anonymous',
      body: memoryBody.trim(),
      photoUrl: photoUrl ?? null,
    })

    return NextResponse.json({ memory }, { status: 201 })
  } catch (error) {
    console.error('Failed to save memory:', error)
    return NextResponse.json({ error: 'Failed to save memory' }, { status: 500 })
  }
}
