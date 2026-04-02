/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events.
 *
 * Events handled:
 *   checkout.session.completed
 *     → Creates order record in DB
 *     → Updates tribute tier + hosting_status
 *     → Sends order confirmation email via Resend
 *     → Runs fulfillment pipeline
 *
 *   customer.subscription.created
 *     → Sets hosting_status = 'active', hosting_expires_at = null,
 *        hosting_subscription_id = subscription.id on the tribute
 *
 *   customer.subscription.deleted
 *     → Sets hosting_status = 'paused' on the tribute
 *     → Sends subscription cancelled email
 *
 *   invoice.payment_failed
 *     → Sends payment warning email to customer
 *
 * Note: This route must receive the raw request body for signature verification.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { waitUntil } from '@vercel/functions'
import { createOrder } from '@/lib/db/orders'
import { updateTribute, getTributeBySlug, getTributeById } from '@/lib/db/tributes'
import {
  sendOrderConfirmationEmail,
  sendPaymentWarningEmail,
  sendSubscriptionCancelledEmail,
} from '@/lib/email/send'
import { runFulfillment } from '@/lib/fulfillment'

// Disable body parsing — Stripe needs raw body for signature verification
export const runtime = 'nodejs'
// Allow up to 60s for PDF generation + email delivery on Vercel Pro
export const maxDuration = 60

type NewTier = 'cherish_monthly' | 'cherish_annual' | 'legacy' | 'pdf'
type LegacyTier = 'keep' | 'cherish' | 'legacy' | 'cherish_monthly' | 'cherish_annual' | 'pdf'
type Tier = NewTier | LegacyTier

function isValidTier(tier: unknown): tier is Tier {
  return (
    typeof tier === 'string' &&
    ['cherish_monthly', 'cherish_annual', 'legacy', 'pdf', 'keep', 'cherish'].includes(tier)
  )
}

// Tier amounts for validation / DB recording (cents)
const TIER_AMOUNTS: Record<string, number> = {
  cherish_monthly: 999,
  cherish_annual: 7900,
  legacy: 29700,
  pdf: 999,
  // Legacy tier names (backward compat)
  keep: 3900,
  cherish: 12700,
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

      case 'customer.subscription.created':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await handleSubscriptionCreated(event.data.object as any)
        break

      case 'customer.subscription.deleted':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await handleSubscriptionDeleted(event.data.object as any)
        break

      case 'invoice.payment_failed':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await handleInvoicePaymentFailed(event.data.object as any)
        break

      // Legacy handler
      case 'payment_intent.payment_failed':
        console.log('Payment failed (payment_intent):', event.data.object)
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
    shipping_details?: {
      name?: string | null
      address?: {
        line1?: string | null
        line2?: string | null
        city?: string | null
        state?: string | null
        postal_code?: string | null
        country?: string | null
      } | null
    } | null
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
  const amountCents = session.amount_total || TIER_AMOUNTS[tier] || 0
  const paymentIntent =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  // Capture shipping address for Legacy tier
  const shippingAddress = session.shipping_details?.address
    ? {
        name: session.shipping_details.name || '',
        line1: session.shipping_details.address.line1 || '',
        line2: session.shipping_details.address.line2 || '',
        city: session.shipping_details.address.city || '',
        state: session.shipping_details.address.state || '',
        postal_code: session.shipping_details.address.postal_code || '',
        country: session.shipping_details.address.country || '',
      }
    : null

  // 1. Create order record (idempotent — uses ON CONFLICT DO NOTHING)
  const order = await createOrder({
    tribute_id: tributeId,
    stripe_session_id: session.id,
    stripe_payment_intent: paymentIntent ?? undefined,
    tier,
    amount_cents: amountCents,
    customer_email: customerEmail,
    ...(shippingAddress ? { shipping_address: shippingAddress } : {}),
  })

  if (!order) {
    // Already processed (duplicate webhook) — safely skip
    console.log(`Order for session ${session.id} already exists — skipping`)
    return
  }

  console.log(`Order created: ${order.id} | Tribute: ${tributeSlug} | Tier: ${tier}`)

  // 2. Update tribute tier (and hosting status for one-time purchases)
  const isSubscription = tier === 'cherish_monthly' || tier === 'cherish_annual'
  const isLifetime = tier === 'legacy'

  if (isLifetime) {
    // Legacy: permanent hosting, no subscription needed
    await updateTribute(tributeId, {
      tier,
      hosting_status: 'active',
      hosting_expires_at: null,
      expires_at: null,
    })
  } else if (!isSubscription) {
    // PDF or legacy one-time: mark active but don't override subscription status
    await updateTribute(tributeId, {
      tier,
      expires_at: null,
    })
  } else {
    // Subscriptions: hosting_status will be set by customer.subscription.created webhook
    // Just update the tier for now
    await updateTribute(tributeId, {
      tier,
      expires_at: null,
    })
  }

  // 3. Send order confirmation email
  if (customerEmail) {
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

  // 4. Trigger fulfillment pipeline
  console.log(`Triggering fulfillment for tier "${tier}" — order ${order.id}`)
  waitUntil(
    runFulfillment({
      orderId: order.id,
      tributeId,
      tributeSlug,
      tier,
      customerEmail,
    }).catch((err) => {
      console.error(`Fulfillment pipeline error for order ${order.id}:`, err)
    })
  )
}

/**
 * Handle customer.subscription.created
 * Fires when a Cherish subscription is successfully created.
 * Sets hosting to active and clears any expiry.
 */
async function handleSubscriptionCreated(
  subscription: {
    id: string
    metadata?: Record<string, string> | null
    customer?: string | null
  }
) {
  const metadata = subscription.metadata || {}
  const { tributeId, tributeSlug } = metadata

  if (!tributeId) {
    console.error('subscription.created missing tributeId in metadata:', subscription.id)
    return
  }

  console.log(`Subscription created: ${subscription.id} | Tribute: ${tributeId}`)

  await updateTribute(tributeId, {
    hosting_status: 'active',
    hosting_expires_at: null,
    hosting_subscription_id: subscription.id,
  })

  console.log(`Tribute ${tributeId} hosting set to active — subscription ${subscription.id}`)

  // Log for observability
  if (tributeSlug) {
    console.log(`Cherish subscription active for tribute: ${tributeSlug}`)
  }
}

/**
 * Handle customer.subscription.deleted
 * Fires when a Cherish subscription is cancelled or expires.
 * Pauses the tribute page and sends the customer a notification.
 */
async function handleSubscriptionDeleted(
  subscription: {
    id: string
    metadata?: Record<string, string> | null
    customer?: string | null
  }
) {
  const metadata = subscription.metadata || {}
  const { tributeId, tributeSlug } = metadata

  if (!tributeId) {
    console.error('subscription.deleted missing tributeId in metadata:', subscription.id)
    return
  }

  console.log(`Subscription deleted: ${subscription.id} | Tribute: ${tributeId}`)

  // Pause the tribute
  await updateTribute(tributeId, {
    hosting_status: 'paused',
  })

  console.log(`Tribute ${tributeId} paused — subscription ${subscription.id} ended`)

  // Send cancellation email
  if (tributeSlug) {
    const tribute = await getTributeById(tributeId)
    if (tribute?.creator_email) {
      await sendSubscriptionCancelledEmail({
        to: tribute.creator_email,
        subjectName: tribute.subject_name,
        tributeSlug,
      })
    }
  }
}

/**
 * Handle invoice.payment_failed
 * Fires when a Cherish subscription payment fails.
 * Sends the customer a warm warning email with a link to update their payment.
 */
async function handleInvoicePaymentFailed(
  invoice: {
    id: string
    customer?: string | null
    customer_email?: string | null
    subscription?: string | null | { id: string }
    hosted_invoice_url?: string | null
    metadata?: Record<string, string> | null
  }
) {
  const customerEmail = invoice.customer_email
  if (!customerEmail) {
    console.warn('invoice.payment_failed — no customer_email on invoice:', invoice.id)
    return
  }

  // Get subscription ID to find the tribute
  const subscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id ?? null

  // Update payment URL — Stripe's hosted invoice URL is the best place to update
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://foreverremembered.ai'
  const updatePaymentUrl = invoice.hosted_invoice_url || `${baseUrl}/account`

  // Try to find the tribute via subscription ID to personalize the email
  let subjectName = 'your loved one'
  let tributeSlug = ''

  if (subscriptionId) {
    // Look up tribute by subscription ID in Supabase
    try {
      const { createServerClient } = await import('@/lib/supabase')
      const db = createServerClient()
      const { data } = await db
        .from('tributes')
        .select('subject_name, slug')
        .eq('hosting_subscription_id', subscriptionId)
        .single()

      if (data) {
        subjectName = data.subject_name
        tributeSlug = data.slug
      }
    } catch (err) {
      console.warn('Could not look up tribute for subscription:', subscriptionId, err)
    }
  }

  console.log(`Payment failed for ${customerEmail} — subscription ${subscriptionId}`)

  await sendPaymentWarningEmail({
    to: customerEmail,
    subjectName,
    tributeSlug,
    updatePaymentUrl,
  })
}
