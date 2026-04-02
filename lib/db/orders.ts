/**
 * Database operations for orders
 * All writes use service role client (server-side only)
 */

import { createServerClient } from '@/lib/supabase'

export type OrderTier = 'keep' | 'cherish' | 'legacy' | 'cherish_monthly' | 'cherish_annual' | 'pdf'

export interface Order {
  id: string
  tribute_id: string
  stripe_session_id: string
  stripe_payment_intent: string | null
  tier: OrderTier
  amount_cents: number
  status: 'pending' | 'processing' | 'fulfilled' | 'failed'
  customer_email: string
  fulfillment_data: Record<string, unknown> | null
  created_at: string
  fulfilled_at: string | null
}

/**
 * Create a new order record (called from webhook on checkout.session.completed)
 * Uses ON CONFLICT DO NOTHING to handle webhook retries safely.
 */
export async function createOrder(order: {
  tribute_id: string
  stripe_session_id: string
  stripe_payment_intent?: string
  tier: OrderTier
  amount_cents: number
  customer_email: string
}): Promise<Order | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from('orders')
    .upsert(
      {
        tribute_id: order.tribute_id,
        stripe_session_id: order.stripe_session_id,
        stripe_payment_intent: order.stripe_payment_intent ?? null,
        tier: order.tier,
        amount_cents: order.amount_cents,
        customer_email: order.customer_email,
        status: 'processing',
      },
      { onConflict: 'stripe_session_id', ignoreDuplicates: true }
    )
    .select()
    .single()

  if (error) {
    // Could be a conflict (duplicate webhook) — not fatal
    console.error('createOrder error:', error.message)
    return null
  }
  return data as Order
}

/**
 * Get order by Stripe session ID
 */
export async function getOrderBySessionId(sessionId: string): Promise<Order | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from('orders')
    .select('*')
    .eq('stripe_session_id', sessionId)
    .single()

  if (error || !data) return null
  return data as Order
}

/**
 * Update order status
 */
export async function getOrderByTributeId(tributeId: string): Promise<Order | null> {
  const db = createServerClient()
  const { data } = await db
    .from('orders')
    .select('*')
    .eq('tribute_id', tributeId)
    .eq('status', 'fulfilled')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data || null
}

export async function updateOrderStatus(
  id: string,
  status: Order['status'],
  fulfillmentData?: Record<string, unknown>
): Promise<void> {
  const db = createServerClient()
  await db
    .from('orders')
    .update({
      status,
      ...(fulfillmentData ? { fulfillment_data: fulfillmentData } : {}),
      ...(status === 'fulfilled' ? { fulfilled_at: new Date().toISOString() } : {}),
    })
    .eq('id', id)
}
