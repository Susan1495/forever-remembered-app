/**
 * Database operations for tributes
 * All writes use service role client (server-side only)
 */

import { createServerClient } from '@/lib/supabase'
import type { Tribute, TributeStatus, TemplateId, TributeBody, AITheme } from '@/lib/types'

export async function getTributeBySlug(slug: string): Promise<Tribute | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from('tributes')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data as Tribute
}

export async function getTributeById(id: string): Promise<Tribute | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from('tributes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Tribute
}

export async function createTribute(tribute: {
  slug: string
  subject_name: string
  subject_bio?: string
  birth_date?: string
  death_date?: string
  relationship?: string
  extra_context?: string
  creator_email?: string
  creator_ip?: string
  is_living: boolean
  subject_age_group: string
}): Promise<Tribute> {
  const db = createServerClient()
  const { data, error } = await db
    .from('tributes')
    .insert({
      ...tribute,
      status: 'processing',
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create tribute: ${error?.message}`)
  }
  return data as Tribute
}

export async function updateTribute(
  id: string,
  updates: Partial<{
    slug: string
    ai_headline: string
    ai_pull_quote: string
    ai_body: TributeBody
    ai_themes: AITheme[]
    ai_photo_captions: Record<string, string>
    hero_photo_idx: number
    template_id: TemplateId
    status: TributeStatus
    published_at: string
    generated_at: string
    creator_email: string
    tier: 'free' | 'keep' | 'cherish' | 'legacy'
    expires_at: string | null
  }>
): Promise<void> {
  const db = createServerClient()
  const { error } = await db
    .from('tributes')
    .update(updates)
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update tribute: ${error.message}`)
  }
}

export async function incrementViewCount(slug: string): Promise<void> {
  const db = createServerClient()
  // Use RPC for atomic increment
  try {
    await db.rpc('increment_view_count', { tribute_slug: slug })
  } catch {
    // Fallback if function doesn't exist yet — no-op
  }
}

export async function incrementCandleCount(slug: string): Promise<number> {
  const db = createServerClient()
  const { error } = await db.rpc('increment_candle_count', { tribute_slug: slug })
  
  if (error) {
    throw new Error(`Failed to increment candle: ${error.message}`)
  }

  // Fetch updated count
  const { data } = await db
    .from('tributes')
    .select('candle_count')
    .eq('slug', slug)
    .single()

  return data?.candle_count ?? 0
}

export async function logEvent(
  tributeId: string,
  eventType: string,
  referrer?: string,
  userAgent?: string
): Promise<void> {
  const db = createServerClient()
  await db.from('tribute_events').insert({
    tribute_id: tributeId,
    event_type: eventType,
    referrer: referrer ?? null,
    user_agent: userAgent ?? null,
  })
}
