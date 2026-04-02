/**
 * POST /api/anniversary/setup
 *
 * Creates an anniversary_automations record for a tribute.
 * Called from the /tribute/[slug]/anniversary-setup page after
 * a successful Cherish subscription checkout.
 *
 * Body:
 *   tributeSlug        string    (required)
 *   customerEmail      string    (required)
 *   dateOfBirth        string?   ISO date, e.g. "1942-03-15"
 *   dateOfPassing      string?   ISO date
 *   customDate1        string?   ISO date
 *   customDate1Label   string?
 *   customDate2        string?   ISO date
 *   customDate2Label   string?
 *   familyEmails       string[]  up to 5 addresses
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getTributeBySlug } from '@/lib/db/tributes'

export async function POST(req: NextRequest) {
  let body: {
    tributeSlug?: unknown
    customerEmail?: unknown
    dateOfBirth?: unknown
    dateOfPassing?: unknown
    customDate1?: unknown
    customDate1Label?: unknown
    customDate2?: unknown
    customDate2Label?: unknown
    familyEmails?: unknown
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    tributeSlug,
    customerEmail,
    dateOfBirth,
    dateOfPassing,
    customDate1,
    customDate1Label,
    customDate2,
    customDate2Label,
    familyEmails,
  } = body

  // ── Validate required fields ──
  if (!tributeSlug || typeof tributeSlug !== 'string') {
    return NextResponse.json({ error: 'tributeSlug is required' }, { status: 400 })
  }
  // ── Load tribute ── (moved up so we can use creator_email as fallback)
  const tributeForEmail = await getTributeBySlug(tributeSlug as string)
  if (!tributeForEmail) {
    return NextResponse.json({ error: 'Tribute not found' }, { status: 404 })
  }

  // Option B: fall back to tribute creator_email if customerEmail not provided
  const resolvedEmail =
    (typeof customerEmail === 'string' && customerEmail.trim()) ||
    tributeForEmail.creator_email ||
    ''

  if (!resolvedEmail) {
    return NextResponse.json({ error: 'customerEmail is required' }, { status: 400 })
  }

  // ── Validate optional date fields (must be valid ISO date strings if present) ──
  const isValidDate = (v: unknown): v is string =>
    typeof v === 'string' && v.length > 0 && !isNaN(Date.parse(v))

  const isValidString = (v: unknown): v is string =>
    typeof v === 'string' && v.trim().length > 0

  const isValidEmailArray = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every((e) => typeof e === 'string')

  const tribute = tributeForEmail

  // ── Build record ──
  const emails: string[] = isValidEmailArray(familyEmails)
    ? familyEmails.map((e) => e.trim()).filter(Boolean).slice(0, 5)
    : []

  const record = {
    tribute_id: tribute.id,
    customer_email: resolvedEmail.trim().toLowerCase(),
    date_of_birth: isValidDate(dateOfBirth) ? dateOfBirth : null,
    date_of_passing: isValidDate(dateOfPassing) ? dateOfPassing : null,
    custom_date_1: isValidDate(customDate1) ? customDate1 : null,
    custom_date_1_label: isValidString(customDate1Label) ? (customDate1Label as string).trim() : null,
    custom_date_2: isValidDate(customDate2) ? customDate2 : null,
    custom_date_2_label: isValidString(customDate2Label) ? (customDate2Label as string).trim() : null,
    family_emails: emails,
    active: true,
  }

  // ── Upsert (one record per tribute — update if already exists) ──
  const db = createServerClient()

  const { error } = await db
    .from('anniversary_automations')
    .upsert(record, { onConflict: 'tribute_id' })

  if (error) {
    console.error('[anniversary/setup] DB error:', error)
    return NextResponse.json(
      { error: 'Failed to save anniversary reminders. Please try again.' },
      { status: 500 }
    )
  }

  console.log(`[anniversary/setup] Created automation for tribute=${tributeSlug} emails=${emails.length}`)

  return NextResponse.json({ success: true })
}
