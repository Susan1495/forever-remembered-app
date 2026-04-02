export const dynamic = 'force-dynamic'
/**
 * GET /api/cron/follow-up-email
 *
 * Vercel cron job — runs every hour.
 * Finds tributes that are:
 *   - status = 'published'
 *   - created_at < NOW() - 24h
 *   - follow_up_sent = false
 *   - no completed order exists
 *
 * Sends the 24-hour follow-up email, then marks follow_up_sent = true.
 *
 * Protected by CRON_SECRET (Vercel sets this automatically for cron routes,
 * or we fall back to INTERNAL_SECRET for manual testing).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendTributeFollowupEmail } from '@/lib/email/send'

// Vercel cron functions have a max duration of 60s on Pro, 10s on Hobby.
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Auth: Vercel cron sends Authorization: Bearer <CRON_SECRET>
  // We also accept x-internal-secret for manual testing.
  const authHeader = req.headers.get('authorization')
  const internalSecret = req.headers.get('x-internal-secret')

  const cronSecret = process.env.CRON_SECRET
  const internalSecretEnv = process.env.INTERNAL_SECRET

  const isAuthorizedViaCron = cronSecret && authHeader === `Bearer ${cronSecret}`
  const isAuthorizedViaInternal = internalSecretEnv && internalSecret === internalSecretEnv

  if (!isAuthorizedViaCron && !isAuthorizedViaInternal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServerClient()

  // Find eligible tributes:
  // - published
  // - created more than 24h ago
  // - follow-up not yet sent
  // - no completed order (subquery check)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: tributes, error: fetchError } = await db
    .from('tributes')
    .select('id, slug, subject_name, creator_email, created_at')
    .eq('status', 'published')
    .eq('follow_up_sent', false)
    .lt('created_at', cutoff)
    .not('creator_email', 'is', null)
    .limit(50) // Process up to 50 per run to stay within timeout

  if (fetchError) {
    console.error('[cron/follow-up-email] Failed to fetch tributes:', fetchError)
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
  }

  if (!tributes || tributes.length === 0) {
    console.log('[cron/follow-up-email] No eligible tributes found')
    return NextResponse.json({ processed: 0 })
  }

  console.log(`[cron/follow-up-email] Found ${tributes.length} eligible tributes`)

  let sent = 0
  let skipped = 0
  let errors = 0

  for (const tribute of tributes) {
    if (!tribute.creator_email) {
      // Mark as sent so we don't keep checking — no email on file
      await db
        .from('tributes')
        .update({ follow_up_sent: true })
        .eq('id', tribute.id)
      skipped++
      continue
    }

    // Check if a completed order exists for this tribute
    const { data: orders } = await db
      .from('orders')
      .select('id')
      .eq('tribute_id', tribute.id)
      .in('status', ['processing', 'fulfilled'])
      .limit(1)

    if (orders && orders.length > 0) {
      // Already purchased — mark follow_up_sent to stop checking
      await db
        .from('tributes')
        .update({ follow_up_sent: true })
        .eq('id', tribute.id)
      skipped++
      continue
    }

    // Send the follow-up email
    try {
      await sendTributeFollowupEmail({
        to: tribute.creator_email,
        subjectName: tribute.subject_name,
        tributeSlug: tribute.slug,
      })

      // Mark as sent
      await db
        .from('tributes')
        .update({ follow_up_sent: true })
        .eq('id', tribute.id)

      sent++
    } catch (err) {
      console.error(
        `[cron/follow-up-email] Error processing tribute ${tribute.id}:`,
        err
      )
      errors++
      // Don't mark as sent — retry next run
    }
  }

  console.log(
    `[cron/follow-up-email] Done. sent=${sent} skipped=${skipped} errors=${errors}`
  )

  return NextResponse.json({ processed: tributes.length, sent, skipped, errors })
}
