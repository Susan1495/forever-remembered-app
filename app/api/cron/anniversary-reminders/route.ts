export const dynamic = 'force-dynamic'
/**
 * GET /api/cron/anniversary-reminders
 *
 * Vercel cron job — runs daily at 9:00 AM UTC.
 * Schedule: "0 9 * * *" (see vercel.json)
 *
 * For each active anniversary_automations record, checks whether today's
 * month+day matches any of the stored dates (birth, passing, custom 1,
 * custom 2). Year is ignored — these are annual recurring reminders.
 *
 * If a match is found AND the automation hasn't been sent in the last
 * 11 months (to prevent same-year double-sends), it:
 *   1. Generates an AI reflection via OpenAI GPT-4o
 *   2. Sends anniversary reminder emails to all family_emails
 *   3. Updates last_sent_at on the automation record
 *
 * Protected by CRON_SECRET (Authorization: Bearer <secret>) or
 * x-internal-secret header for manual testing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateAnniversaryReflection, type AnniversaryDateType } from '@/lib/ai/generate-anniversary-reflection'
import { sendAnniversaryReminderEmail } from '@/lib/email/send'
import type { Tribute } from '@/lib/types'

// Vercel cron: max 60s on Pro, 10s on Hobby
export const maxDuration = 60

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnniversaryAutomation {
  id: string
  tribute_id: string
  customer_email: string
  stripe_subscription_id: string | null
  date_of_birth: string | null         // "YYYY-MM-DD"
  date_of_passing: string | null
  custom_date_1: string | null
  custom_date_1_label: string | null
  custom_date_2: string | null
  custom_date_2_label: string | null
  family_emails: string[]
  last_sent_at: string | null          // ISO timestamp
  active: boolean
  created_at: string
  // Joined tribute data
  tributes: Pick<Tribute, 'id' | 'subject_name' | 'ai_body' | 'ai_headline'> | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the YYYY-MM-DD date string's month+day matches today */
function matchesToday(dateStr: string | null, today: { month: number; day: number }): boolean {
  if (!dateStr) return false
  try {
    // dateStr is "YYYY-MM-DD"; parse month and day only
    const [, mm, dd] = dateStr.split('-')
    return parseInt(mm, 10) === today.month && parseInt(dd, 10) === today.day
  } catch {
    return false
  }
}

/**
 * Returns true if last_sent_at is null OR more than 11 months ago.
 * This prevents double-sends within the same calendar year.
 */
function shouldSend(lastSentAt: string | null): boolean {
  if (!lastSentAt) return true
  const lastSent = new Date(lastSentAt).getTime()
  const elevenMonthsAgo = Date.now() - 11 * 30 * 24 * 60 * 60 * 1000
  return lastSent < elevenMonthsAgo
}

/** Build a minimal Tribute object for the AI generator */
function toTributeShape(automation: AnniversaryAutomation): Tribute {
  const t = automation.tributes
  return {
    id: automation.tribute_id,
    slug: '',
    creator_email: automation.customer_email,
    creator_ip: null,
    subject_name: t?.subject_name ?? 'this person',
    subject_bio: null,
    birth_date: automation.date_of_birth,
    death_date: automation.date_of_passing,
    relationship: null,
    extra_context: null,
    is_living: false,
    subject_age_group: null,
    ai_headline: t?.ai_headline ?? null,
    ai_pull_quote: null,
    ai_body: t?.ai_body ?? null,
    ai_themes: null,
    hero_photo_idx: 0,
    template_id: null,
    ai_photo_captions: null,
    status: 'published',
    view_count: 0,
    candle_count: 0,
    created_at: '',
    published_at: null,
    generated_at: null,
    expires_at: null,
    tier: null,
    custom_subdomain: null,
    follow_up_sent: false,
    hosting_expires_at: null,
    hosting_status: 'active',
    hosting_subscription_id: null,
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // ── Auth ──
  const authHeader = req.headers.get('authorization')
  const internalSecret = req.headers.get('x-internal-secret')

  const cronSecret = process.env.CRON_SECRET
  const internalSecretEnv = process.env.INTERNAL_SECRET

  const isAuthorizedViaCron = cronSecret && authHeader === `Bearer ${cronSecret}`
  const isAuthorizedViaInternal = internalSecretEnv && internalSecret === internalSecretEnv

  if (!isAuthorizedViaCron && !isAuthorizedViaInternal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Today (month + day) ──
  const now = new Date()
  const today = { month: now.getUTCMonth() + 1, day: now.getUTCDate() }

  const db = createServerClient()

  // ── Fetch active automations with tribute data ──
  const { data: automations, error: fetchError } = await db
    .from('anniversary_automations')
    .select(`
      *,
      tributes (
        id,
        subject_name,
        ai_headline,
        ai_body
      )
    `)
    .eq('active', true)
    .limit(200) // Safety cap per run

  if (fetchError) {
    console.error('[cron/anniversary-reminders] DB fetch error:', fetchError)
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
  }

  if (!automations || automations.length === 0) {
    console.log('[cron/anniversary-reminders] No active automations')
    return NextResponse.json({ processed: 0, sent: 0, skipped: 0, errors: 0 })
  }

  console.log(`[cron/anniversary-reminders] Checking ${automations.length} automations for ${today.month}/${today.day}`)

  let sent = 0
  let skipped = 0
  let errors = 0

  for (const automation of automations as AnniversaryAutomation[]) {
    // Skip if family_emails is empty
    if (!automation.family_emails || automation.family_emails.length === 0) {
      skipped++
      continue
    }

    // Determine which date(s) match today
    type Match = { dateType: AnniversaryDateType; label?: string }
    const matches: Match[] = []

    if (matchesToday(automation.date_of_birth, today)) {
      matches.push({ dateType: 'birthday' })
    }
    if (matchesToday(automation.date_of_passing, today)) {
      matches.push({ dateType: 'passing' })
    }
    if (matchesToday(automation.custom_date_1, today)) {
      matches.push({ dateType: 'custom', label: automation.custom_date_1_label ?? undefined })
    }
    if (matchesToday(automation.custom_date_2, today)) {
      matches.push({ dateType: 'custom', label: automation.custom_date_2_label ?? undefined })
    }

    if (matches.length === 0) {
      // No date matches today — skip
      continue
    }

    // Check 11-month guard
    if (!shouldSend(automation.last_sent_at)) {
      console.log(`[cron/anniversary-reminders] Skipping ${automation.id} — sent recently`)
      skipped++
      continue
    }

    // Use first matching date for this run
    // (edge case: two dates land on same day — send one email, not two)
    const { dateType, label } = matches[0]

    const subjectName = automation.tributes?.subject_name ?? 'this person'

    // Resolve tribute slug for the URL (not included in the join above)
    const { data: tributeRow } = await db
      .from('tributes')
      .select('slug')
      .eq('id', automation.tribute_id)
      .single()

    const resolvedSlug = tributeRow?.slug ?? automation.tribute_id

    // Build occasion label
    const occasionMap: Record<AnniversaryDateType, string> = {
      birthday: 'birthday',
      passing: 'anniversary',
      custom: label || 'special anniversary',
    }
    const occasion = occasionMap[dateType]

    try {
      // Generate AI reflection
      const tribute = toTributeShape(automation)
      const reflection = await generateAnniversaryReflection(tribute, dateType, label)

      // Send emails to all family members
      await sendAnniversaryReminderEmail({
        to: automation.family_emails,
        subjectName,
        tributeSlug: resolvedSlug,
        reflection,
        occasion,
      })

      // Update last_sent_at
      await db
        .from('anniversary_automations')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('id', automation.id)

      console.log(
        `[cron/anniversary-reminders] Sent ${dateType} reminder for automation=${automation.id} ` +
        `tribute=${resolvedSlug} recipients=${automation.family_emails.length}`
      )
      sent++
    } catch (err) {
      console.error(`[cron/anniversary-reminders] Error for automation=${automation.id}:`, err)
      errors++
      // Don't update last_sent_at — retry next day
    }

    // Small delay between automations to respect API rate limits
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`[cron/anniversary-reminders] Done. sent=${sent} skipped=${skipped} errors=${errors}`)

  return NextResponse.json({
    processed: automations.length,
    sent,
    skipped,
    errors,
    date: `${today.month}/${today.day}`,
  })
}
