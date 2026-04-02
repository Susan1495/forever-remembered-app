export const dynamic = 'force-dynamic'

/**
 * POST /api/upsell/lead
 * Capture email for upsell interest
 * Records to upsell_leads table and sends Resend confirmation email
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUpsellLead, markUpsellLeadNotified } from '@/lib/db/upsell-leads'
import { getTributeById } from '@/lib/db/tributes'
import { sendUpsellInterestEmail } from '@/lib/email/send'
import type { UpsellLeadRequest } from '@/lib/types'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  let body: UpsellLeadRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { tributeId, email, trigger } = body

  if (!tributeId || !email) {
    return NextResponse.json({ error: 'tributeId and email are required' }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  try {
    // Get tribute for subject name
    const tribute = await getTributeById(tributeId)
    if (!tribute) {
      return NextResponse.json({ error: 'Tribute not found' }, { status: 404 })
    }

    // Save lead to database (ignores duplicate email/tribute combo)
    await createUpsellLead(tributeId, email, trigger || 'post_creation')

    // Send acknowledgement email
    await sendUpsellInterestEmail({
      to: email,
      subjectName: tribute.subject_name,
      tributeSlug: tribute.slug,
    })

    // Mark as notified
    await markUpsellLeadNotified(tributeId, email).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to capture upsell lead:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
