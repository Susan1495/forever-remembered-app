/**
 * GET /api/orders/[sessionId]/status
 *
 * Returns the fulfillment status for an order identified by its Stripe
 * checkout session ID.
 *
 * Response shape:
 * {
 *   tier: 'keep' | 'cherish' | 'legacy'
 *   status: 'pending' | 'processing' | 'fulfilled' | 'failed'
 *   fulfillmentData: { ... } | null
 *   downloadUrls: string[]
 * }
 *
 * Returns 404 if no order is found for the given session ID.
 * This endpoint is unauthenticated intentionally — session IDs are
 * unguessable Stripe-generated IDs (cs_live_...) that act as bearer tokens.
 * Download URLs inside fulfillmentData are Supabase signed URLs with 1-year TTL.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOrderBySessionId } from '@/lib/db/orders'

export const runtime = 'nodejs'

interface OrderStatusResponse {
  tier: 'keep' | 'cherish' | 'legacy'
  status: 'pending' | 'processing' | 'fulfilled' | 'failed'
  fulfillmentData: Record<string, unknown> | null
  downloadUrls: string[]
}

/**
 * Extract download URLs from the fulfillment_data JSON blob.
 * Looks for any value that looks like an HTTPS URL.
 */
function extractDownloadUrls(fulfillmentData: Record<string, unknown> | null): string[] {
  if (!fulfillmentData) return []

  const urls: string[] = []
  for (const value of Object.values(fulfillmentData)) {
    if (typeof value === 'string' && value.startsWith('https://')) {
      // Only include storage URLs (not just any URL in the blob)
      if (value.includes('supabase') || value.includes('storage')) {
        urls.push(value)
      }
    }
  }
  return urls
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse> {
  const { sessionId } = params

  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json(
      { error: 'sessionId parameter is required' },
      { status: 400 }
    )
  }

  // Basic sanity check — Stripe session IDs start with cs_
  if (!sessionId.startsWith('cs_')) {
    return NextResponse.json(
      { error: 'Invalid session ID format' },
      { status: 400 }
    )
  }

  const order = await getOrderBySessionId(sessionId)

  if (!order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    )
  }

  const downloadUrls = extractDownloadUrls(order.fulfillment_data)

  const response: OrderStatusResponse = {
    tier: order.tier,
    status: order.status,
    fulfillmentData: order.fulfillment_data,
    downloadUrls,
  }

  return NextResponse.json(response, {
    headers: {
      // Short cache — status changes during fulfillment
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
