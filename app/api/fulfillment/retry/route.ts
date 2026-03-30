/**
 * POST /api/fulfillment/retry
 * Admin endpoint to manually retry failed fulfillments.
 *
 * Protected by ADMIN_SECRET header.
 * Body: { orderId: string }
 *
 * Usage:
 *   curl -X POST https://foreverremembered.ai/api/fulfillment/retry \
 *     -H "x-admin-secret: YOUR_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"orderId": "uuid-here"}'
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateOrderStatus } from '@/lib/db/orders'
import { runFulfillment } from '@/lib/fulfillment'
import { createServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  // Check admin secret
  const adminSecret = req.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { orderId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  // Fetch order + tribute slug by joining with tributes
  const db = createServerClient()
  const { data: order, error } = await db
    .from('orders')
    .select('*, tributes(slug)')
    .eq('id', body.orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Only retry failed or processing orders (not already fulfilled)
  if (order.status === 'fulfilled') {
    return NextResponse.json({ error: 'Order already fulfilled', status: order.status })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tributeSlug = (order as any).tributes?.slug || ''

  // Reset status to processing
  await updateOrderStatus(order.id, 'processing')

  // Trigger fulfillment (async — returns immediately)
  runFulfillment({
    orderId: order.id,
    tributeId: order.tribute_id,
    tributeSlug,
    tier: order.tier,
    customerEmail: order.customer_email,
  }).catch((err) => {
    console.error(`Retry fulfillment failed for order ${order.id}:`, err)
  })

  return NextResponse.json({
    success: true,
    message: `Fulfillment retriggered for order ${order.id}`,
    orderId: order.id,
    tier: order.tier,
  })
}
