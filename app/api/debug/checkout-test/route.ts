/**
 * TEMPORARY DEBUG ROUTE — remove after diagnosing checkout issue
 * GET /api/debug/checkout-test
 */
import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return NextResponse.json({ error: 'STRIPE_SECRET_KEY not set' })

  const masked = key.slice(0, 12) + '...' + key.slice(-4)

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' as const })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: 3900, product_data: { name: 'Keep Test' } } }],
      mode: 'payment',
      success_url: 'https://foreverremembered.ai/',
      cancel_url: 'https://foreverremembered.ai/',
    })

    return NextResponse.json({ ok: true, keyMasked: masked, sessionId: session.id, url: session.url })
  } catch (e: unknown) {
    const err = e as { message?: string; type?: string; code?: string; statusCode?: number }
    return NextResponse.json({
      ok: false,
      keyMasked: masked,
      error: err.message,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
    })
  }
}
