/**
 * GET /api/cron/expire-tributes
 *
 * Vercel cron job — runs daily at 9:00 AM UTC.
 * Finds tributes where:
 *   - hosting_expires_at < NOW()
 *   - hosting_status = 'active'
 *
 * Sets hosting_status = 'paused' and sends the creator a warning email.
 *
 * Protected by CRON_SECRET (Vercel sets this automatically for cron routes).
 * Also accepts x-internal-secret for manual testing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendTributeExpiredEmail } from '@/lib/email/send'

// Vercel cron functions: 60s on Pro, 10s on Hobby
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Auth: Vercel cron sends Authorization: Bearer <CRON_SECRET>
  // Also accept x-internal-secret for manual testing.
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
  const now = new Date().toISOString()

  // Find all active tributes whose trial has expired
  const { data: tributes, error: fetchError } = await db
    .from('tributes')
    .select('id, slug, subject_name, creator_email, hosting_expires_at')
    .eq('hosting_status', 'active')
    .eq('status', 'published')
    .not('hosting_expires_at', 'is', null)
    .lt('hosting_expires_at', now)
    .limit(100) // Process up to 100 per run to stay within timeout

  if (fetchError) {
    console.error('[cron/expire-tributes] Failed to fetch tributes:', fetchError)
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
  }

  if (!tributes || tributes.length === 0) {
    console.log('[cron/expire-tributes] No expired tributes found')
    return NextResponse.json({ processed: 0 })
  }

  console.log(`[cron/expire-tributes] Found ${tributes.length} expired tributes`)

  let paused = 0
  let emailsSent = 0
  let errors = 0

  for (const tribute of tributes) {
    try {
      // Pause the tribute
      const { error: updateError } = await db
        .from('tributes')
        .update({ hosting_status: 'paused' })
        .eq('id', tribute.id)

      if (updateError) {
        console.error(`[cron/expire-tributes] Failed to pause tribute ${tribute.id}:`, updateError)
        errors++
        continue
      }

      paused++

      // Send expiry email if we have a creator email
      if (tribute.creator_email) {
        try {
          await sendTributeExpiredEmail({
            to: tribute.creator_email,
            subjectName: tribute.subject_name,
            tributeSlug: tribute.slug,
          })
          emailsSent++
        } catch (emailErr) {
          // Log but don't fail — the tribute is already paused
          console.error(
            `[cron/expire-tributes] Email failed for tribute ${tribute.id}:`,
            emailErr
          )
        }
      }
    } catch (err) {
      console.error(`[cron/expire-tributes] Error processing tribute ${tribute.id}:`, err)
      errors++
    }
  }

  console.log(
    `[cron/expire-tributes] Done. paused=${paused} emails=${emailsSent} errors=${errors}`
  )

  return NextResponse.json({
    processed: tributes.length,
    paused,
    emailsSent,
    errors,
  })
}
