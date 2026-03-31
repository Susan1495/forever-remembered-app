/**
 * POST /api/checkout/create
 * Creates a Stripe Checkout Session for the selected tier.
 *
 * Body: { tributeSlug: string, tier: 'keep' | 'cherish' | 'legacy' }
 * Returns: { url: string } — redirect to Stripe Checkout
 *
 * Graceful fallback: if STRIPE_SECRET_KEY is not configured,
 * returns { comingSoon: true } so the UI can show a friendly message.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTributeBySlug } from '@/lib/db/tributes'

// Tier prices in cents (LOCKED IN per spec)
const TIER_PRICES: Record<string, number> = {
  keep: 3900,      // $39
  cherish: 12700,  // $127
  legacy: 39700,   // $397
}

// Tier display names for Stripe Checkout
const TIER_NAMES: Record<string, string> = {
  keep: 'Keep — Permanent Tribute Page',
  cherish: 'Cherish — Memorial Book & Photo Restoration',
  legacy: 'Legacy — Complete Memorial Package',
}

// Tier descriptions shown on Stripe Checkout page
const TIER_DESCRIPTIONS: Record<string, string> = {
  keep: 'Permanent tribute page + PDF memorial card',
  cherish: 'Everything in Keep, plus photo restoration, 8-page memorial book PDF, and QR code for funeral programs',
  legacy: 'Everything in Cherish, plus full AI biography, video tribute, and hardcover book shipped to your door',
}

type Tier = 'keep' | 'cherish' | 'legacy'

function isValidTier(tier: unknown): tier is Tier {
  return typeof tier === 'string' && ['keep', 'cherish', 'legacy'].includes(tier)
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
    return NextResponse.json({ error: 'tier must be keep, cherish, or legacy' }, { status: 400 })
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

  // Dynamically import Stripe to avoid breaking build when key is absent
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20' as const,
  })

  try {
    // Use Stripe Price IDs if configured, otherwise use inline price data
    const priceEnvKey = `STRIPE_PRICE_${tier.toUpperCase()}` as
      | 'STRIPE_PRICE_KEEP'
      | 'STRIPE_PRICE_CHERISH'
      | 'STRIPE_PRICE_LEGACY'
    const priceId = process.env[priceEnvKey]

    const lineItems = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: amountCents,
              product_data: {
                name: TIER_NAMES[tier],
                description: TIER_DESCRIPTIONS[tier],
              },
            },
          },
        ]

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/tribute/${tributeSlug}?order=success`,
      cancel_url: `${baseUrl}/tribute/${tributeSlug}`,
      customer_email: tribute.creator_email || undefined,
      metadata: {
        tributeSlug,
        tributeId: tribute.id,
        tier,
      },
      // Pre-fill name if we have it
      payment_intent_data: {
        metadata: {
          tributeSlug,
          tributeId: tribute.id,
          tier,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    )
  }
}
