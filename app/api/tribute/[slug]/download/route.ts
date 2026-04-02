export const dynamic = 'force-dynamic'

/**
 * GET /api/tribute/[slug]/download
 * Returns PDF download URLs for paid tributes.
 * Free tributes return 402 { requiresUpgrade: true }.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTributeBySlug } from '@/lib/db/tributes'
import { getOrderByTributeId } from '@/lib/db/orders'

const PAID_TIERS = ['cherish_monthly', 'cherish_annual', 'legacy', 'keep', 'cherish', 'pdf']

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const tribute = await getTributeBySlug(params.slug)
  if (!tribute) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!PAID_TIERS.includes(tribute.tier || '')) {
    return NextResponse.json({ requiresUpgrade: true }, { status: 402 })
  }

  // Find fulfilled order with download URLs
  const order = await getOrderByTributeId(tribute.id)
  if (!order || !order.fulfillment_data) {
    // Paid but fulfillment still processing
    return NextResponse.json({ pending: true, message: 'Your files are being prepared. Check your email.' }, { status: 202 })
  }

  // Extract download URLs from fulfillment_data
  const downloads: Array<{ label: string; url: string }> = []
  const fd = order.fulfillment_data as Record<string, unknown>

  // fulfillment_data shape: { tier, fulfilledAt, pdfCount } — URLs are in the email
  // But trigger.ts stores them via updateOrderStatus with { tier, fulfilledAt, pdfCount }
  // We need to also store the URLs — check what's actually there
  for (const [key, value] of Object.entries(fd)) {
    if (typeof value === 'string' && value.startsWith('https://')) {
      downloads.push({ label: key, url: value })
    }
  }

  if (downloads.length === 0) {
    return NextResponse.json({ pending: true, message: 'Your files are being prepared. Check your email — download links were sent there.' }, { status: 202 })
  }

  return NextResponse.json({ downloads })
}
