/**
 * GET /api/tribute/[slug]/memories
 * Returns all memories for a tribute, ordered by created_at DESC.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTributeBySlug } from '@/lib/db/tributes'
import { getMemories } from '@/lib/db/memories'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  const tribute = await getTributeBySlug(slug)
  if (!tribute) {
    return NextResponse.json({ error: 'Tribute not found' }, { status: 404 })
  }

  try {
    const memories = await getMemories(tribute.id)
    return NextResponse.json({ memories })
  } catch (error) {
    console.error('Failed to fetch memories:', error)
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 })
  }
}
