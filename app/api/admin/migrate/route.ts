/**
 * POST /api/admin/migrate
 * One-shot admin endpoint to apply pending data migrations.
 *
 * Protected by ADMIN_SECRET header.
 *
 * IMPORTANT: Schema (DDL) changes like ADD COLUMN must be run manually in
 * Supabase dashboard → SQL editor. This endpoint only handles data backfills
 * that can run through the service role REST API.
 *
 * Usage:
 *   curl -X POST https://foreverremembered.ai/api/admin/migrate \
 *     -H "x-admin-secret: YOUR_ADMIN_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"migration": "005"}'
 *
 * Before calling 005: Run this in Supabase SQL editor first:
 *   ALTER TABLE tributes ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ NULL;
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { migration?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  if (body.migration === '005') {
    // Backfill: set generated_at = published_at for published tributes where generated_at is null
    // Requires ALTER TABLE to have been run first in Supabase dashboard.

    // Fetch all published tributes missing generated_at
    const { data: tributes, error: fetchError } = await db
      .from('tributes')
      .select('id, slug, published_at')
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .is('generated_at', null)

    if (fetchError) {
      // Column likely doesn't exist yet
      return NextResponse.json({
        error: `Fetch failed: ${fetchError.message}. Have you run the ALTER TABLE in Supabase SQL editor?`,
        sql: 'ALTER TABLE tributes ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ NULL;',
      }, { status: 500 })
    }

    if (!tributes || tributes.length === 0) {
      return NextResponse.json({ migration: '005', updated: 0, message: 'Nothing to backfill' })
    }

    const results = []
    for (const tribute of tributes) {
      const { error: updateError } = await db
        .from('tributes')
        .update({ generated_at: tribute.published_at })
        .eq('id', tribute.id)

      results.push({
        slug: tribute.slug,
        generated_at: tribute.published_at,
        success: !updateError,
        error: updateError?.message,
      })
    }

    return NextResponse.json({ migration: '005', updated: results.length, results })
  }

  return NextResponse.json({ error: 'Unknown migration. Supported: 005' }, { status: 400 })
}
