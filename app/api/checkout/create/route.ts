/**
 * POST /api/checkout/create
 * Creates a Stripe Checkout Session for the selected tier.
 *
 * Body: { tributeSlug: string, tier: 'cherish_monthly' | 'cherish_annual' | 'legacy' | 'pdf' }
 * Returns: { url: string } — redirect to Stripe Checkout
 *
 * Graceful fallback: if STRIPE_SECRET_KEY is not configured,
 * returns { comingSoon: true } so the UI can show a friendly message.
 *
 * Modes:
 *   cherish_monthly → Stripe subscription, $9.99/mo
 *   cherish_annual  → Stripe subscription, $79/yr
 *   legacy          → Stripe payment (one-time), $297
 *   pdf             → Stripe payment (one-time), $9.99
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTributeBySlug } from '@/lib/db/tributes'

type Tier = 'cherish_monthly' | 'cherish_annual' | 'legacy' | 'pdf'

// Tier prices in cents
const TIER_PRICES: Record<Tier, number> = {
  cherish_monthly: 999,   // $9.99/mo (subscription)
  cherish_annual: 7900,   // $79/yr  (subscription)
  legacy: 29700,          // $297 one-time
  pdf: 999,               // $9.99 one-time
}

// Whether the tier is a recurring subscription or a one-time payment
const TIER_MODE: Record<Tier, 'subscription' | 'payment'> = {
  cherish_monthly: 'subscription',
  cherish_annual: 'subscription',
  legacy: 'payment',
  pdf: 'payment',
}

// Tier display names for Stripe Checkout
const TIER_NAMES: Record<Tier, string> = {
  cherish_monthly: 'Cherish Plan — Monthly',
  cherish_annual: 'Cherish Plan — Annual',
  legacy: 'Legacy — Lifetime Hosting',
  pdf: 'PDF Memorial Card Download',
}

// Tier descriptions shown on Stripe Checkout page
const TIER_DESCRIPTIONS: Record<Tier, string> = {
  cherish_monthly: 'Always live hosting, PDF memorial card, anniversary reminders for family, QR code',
  cherish_annual: 'Always live hosting, PDF memorial card, anniversary reminders for family, QR code — billed annually',
  legacy: 'Lifetime hosting forever, everything in Cherish, hardcover book printed and shipped to you',
  pdf: 'Download a beautiful PDF memorial card for this tribute',
}

// Recurring interval config for subscription tiers
const TIER_RECURRING: Partial<Record<Tier, { interval: 'month' | 'year' }>> = {
  cherish_monthly: { interval: 'month' },
  cherish_annual: { interval: 'year' },
}

// Env var key that holds the Stripe Price ID for each tier
const TIER_PRICE_ENV: Record<Tier, string> = {
  cherish_monthly: 'STRIPE_PRICE_CHERISH_MONTHLY',
  cherish_annual: 'STRIPE_PRICE_CHERISH_ANNUAL',
  legacy: 'STRIPE_PRICE_LEGACY',
  pdf: 'STRIPE_PRICE_PDF',
}

function isValidTier(tier: unknown): tier is Tier {
  return (
    typeof tier === 'string' &&
    ['cherish_monthly', 'cherish_annual', 'legacy', 'pdf'].includes(tier)
  )
}

export async function POST(req: NextRequest) {
  // Graceful fallback when Stripe is not configured
  if (
    !process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY.includes('placeholder') ||
    process.env.STRIPE_SECRET_KEY === 'sk_live_...'
  ) {
    return NextResponse.json({ comingSoon: true }, { status: 200 })
  }

  // Parse body
  let body: { tributeSlug?: string; tier?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { tributeSlug, tier } = body

  // Validate
  if (!tributeSlug || typeof tributeSlug !== 'string') {
    return NextResponse.json({ error: 'tributeSlug is required' }, { status: 400 })
  }
  if (!isValidTier(tier)) {
    return NextResponse.json(
      { error: 'tier must be cherish_monthly, cherish_annual, legacy, or pdf' },
      { status: 400 }
    )
  }

  // Load tribute to get its ID and verify it exists
  const tribute = await getTributeBySlug(tributeSlug)
  if (!tribute) {
    return NextResponse.json({ error: 'Tribute not found' }, { status: 404 })
  }
  if (tribute.status !== 'published') {
    return NextResponse.json({ error: 'Tribute is not published yet' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://foreverremembered.ai'
  const amountCents = TIER_PRICES[tier]
  const mode = TIER_MODE[tier]

  // Dynamically import Stripe to avoid breaking build when key is absent
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia' as const,
  })

  try {
    // Use Stripe Price IDs if configured, otherwise fall back to inline price_data.
    // For subscriptions, inline price_data requires a recurring config.
    const priceId = process.env[TIER_PRICE_ENV[tier]]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lineItems: any[]

    if (priceId) {
      lineItems = [{ price: priceId, quantity: 1 }]
    } else {
      const recurring = TIER_RECURRING[tier]
      lineItems = [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: TIER_NAMES[tier],
              description: TIER_DESCRIPTIONS[tier],
            },
            // Subscriptions require a recurring block; one-time omits it
            ...(recurring ? { recurring } : {}),
          },
        },
      ]
    }

    // Cherish subscribers are redirected to the anniversary setup page after checkout.
    // Legacy and PDF go to the tribute page directly (no anniversary setup).
    const successUrl =
      tier === 'cherish_monthly' || tier === 'cherish_annual'
        ? `${baseUrl}/tribute/${tributeSlug}/anniversary-setup?session_id={CHECKOUT_SESSION_ID}`
        : `${baseUrl}/tribute/${tributeSlug}?order=success`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode,
      success_url: successUrl,
      cancel_url: `${baseUrl}/tribute/${tributeSlug}/celebrate`,
      customer_email: tribute.creator_email || undefined,
      metadata: {
        tributeSlug,
        tributeId: tribute.id,
        tier,
      },
      // Collect shipping address for Legacy tier (physical hardcover book)
      ...(tier === 'legacy'
        ? {
            shipping_address_collection: {
              allowed_countries: ['US', 'CA', 'GB', 'AU'],
            },
          }
        : {}),
    }

    // payment_intent_data only applies to payment mode (not subscription)
    if (mode === 'payment') {
      sessionParams.payment_intent_data = {
        metadata: {
          tributeSlug,
          tributeId: tribute.id,
          tier,
        },
      }
    }

    // subscription_data applies to subscription mode only
    if (mode === 'subscription') {
      sessionParams.subscription_data = {
        metadata: {
          tributeSlug,
          tributeId: tribute.id,
          tier,
        },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    )
  }
}
