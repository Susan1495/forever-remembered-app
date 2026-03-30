/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events.
 *
 * Primary event: checkout.session.completed
 *   → Creates order record in DB
 *   → Updates tribute tier
 *   → Sends order confirmation email via Resend
 *
 * Note: This route must receive the raw request body for signature verification.
 * Next.js App Router: export config to disable body parsing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createOrder } from '@/lib/db/orders'
import { updateTribute, getTributeBySlug } from '@/lib/db/tributes'
import { sendOrderConfirmationEmail } from '@/lib/email/send'
import { runFulfillment } from '@/lib/fulfillment'

// Disable body parsing — Stripe needs raw body for signature verification
export const runtime = 'nodejs'
// Allow up to 60s for PDF generation + email delivery on Vercel Pro
// Free plan max is 10s — if you're on free, PDF fulfillment runs async and
// the webhook returns 200 immediately while fulfillment runs in the background.
export const maxDuration = 60

// Tier amounts for validation / DB recording
const TIER_AMOUNTS: Record<string, number> = {
  keep: 3900,
  cherish: 12700,
  legacy: 39700,
}

function isValidTier(tier: unknown): tier is 'keep' | 'cherish' | 'legacy' {
  return typeof tier === 'string' && ['keep', 'cherish', 'legacy'].includes(tier)
}

export async function POST(req: NextRequest) {
  // If Stripe isn't configured, return 200 (don't error Stripe)
  if (
    !process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY === 'sk_live_...' ||
    !process.env.STRIPE_WEBHOOK_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET === 'whsec_...'
  ) {
    console.warn('Stripe webhook received but Stripe is not configured')
    return NextResponse.json({ received: true })
  }

  const body = await req.text()
  const headersList = headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  // Dynamically import Stripe
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia' as const,
  })

  // Verify webhook signature
  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Stripe webhook signature verification failed:', message)
    return NextResponse.json({ error: `Webhook verification failed: ${message}` }, { status: 400 })
  }

  // Handle events
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break

      // Future events can be added here
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object)
        break

      default:
        // Unknown event type — log and ignore
        console.log(`Unhandled Stripe event: ${event.type}`)
    }
  } catch (error) {
    console.error(`Error handling Stripe event ${event.type}:`, error)
    // Return 500 so Stripe retries
    return NextResponse.json(
      { error: 'Webhook handler failed — will retry' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}

/**
 * Handle checkout.session.completed
 * This fires when the customer successfully pays.
 */
async function handleCheckoutSessionCompleted(
  session: {
    id: string
    payment_intent?: string | null | { id: string }
    metadata?: Record<string, string> | null
    customer_email?: string | null
    amount_total?: number | null
  }
) {
  const metadata = session.metadata || {}
  const { tributeSlug, tributeId, tier } = metadata

  // Validate metadata
  if (!tributeSlug || !tributeId || !isValidTier(tier)) {
    console.error('Stripe session missing required metadata:', { tributeSlug, tributeId, tier })
    return
  }

  const customerEmail = session.customer_email || ''
  const amountCents = session.amount_total || TIER_AMOUNTS[tier]
  const paymentIntent =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  // 1. Create order record (idempotent — uses ON CONFLICT DO NOTHING)
  const order = await createOrder({
    tribute_id: tributeId,
    stripe_session_id: session.id,
    stripe_payment_intent: paymentIntent ?? undefined,
    tier,
    amount_cents: amountCents,
    customer_email: customerEmail,
  })

  if (!order) {
    // Already processed (duplicate webhook) — safely skip
    console.log(`Order for session ${session.id} already exists — skipping`)
    return
  }

  console.log(`Order created: ${order.id} | Tribute: ${tributeSlug} | Tier: ${tier}`)

  // 2. Update tribute tier (and remove expiry for paid tiers)
  await updateTribute(tributeId, {
    tier,
    // Paid tiers get permanent storage (no expiry)
    expires_at: null,
  })

  // 3. Send order confirmation email
  if (customerEmail) {
    // We need the tribute's subject name for the email
    const tribute = await getTributeBySlug(tributeSlug)
    const subjectName = tribute?.subject_name || 'your loved one'

    await sendOrderConfirmationEmail({
      to: customerEmail,
      subjectName,
      tributeSlug,
      tier,
      amountCents,
    })
  }

  // 4. Trigger fulfillment pipeline (non-blocking — Stripe will retry on 500 if needed)
  console.log(`Triggering fulfillment for tier "${tier}" — order ${order.id}`)
  // Run asynchronously so the webhook returns 200 quickly.
  // Fulfillment failures are logged and the order is marked 'failed' in DB.
  // Use runFulfillment (lib/fulfillment/index.ts) which routes:
  //   keep    → tier1.ts  (Puppeteer memorial card PDF)
  //   cherish → tier2.ts  (Puppeteer memorial card + 8-page book + QR code)
  //   legacy  → trigger.ts (react-pdf print-ready files)
  runFulfillment({
    orderId: order.id,
    tributeId,
    tributeSlug,
    tier,
    customerEmail,
  }).catch((err) => {
    console.error(`Fulfillment pipeline error for order ${order.id}:`, err)
  })
}
