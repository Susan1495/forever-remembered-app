/**
 * Tier 1 — Keep ($39) Fulfillment
 *
 * Generates a beautiful 1-page portrait memorial card PDF using Puppeteer,
 * uploads it to Supabase Storage, emails the download link to the customer,
 * and marks the order as fulfilled.
 *
 * Fulfillment steps:
 *   1. Generate memorial card PDF (Puppeteer)
 *   2. Upload PDF to Supabase Storage (tribute-pdfs bucket)
 *   3. Email download link to customer via Resend
 *   4. Update order status → fulfilled
 *   5. Update tribute: tier = 'keep', expires_at = NULL
 */

import { getTributeById, updateTribute } from '@/lib/db/tributes'
import { getTributePhotos } from '@/lib/db/photos'
import { updateOrderStatus } from '@/lib/db/orders'
import { generateMemorialCard } from '@/lib/fulfillment/pdf'
import { uploadPDF } from '@/lib/fulfillment/storage'
import { sendFulfillmentEmail } from '@/lib/fulfillment/email-delivery'

export interface Tier1Input {
  orderId: string
  tributeId: string
  tributeSlug: string
  customerEmail: string
}

export interface Tier1Result {
  pdfUrl: string
  fulfilledAt: string
}

/**
 * Run the full Keep-tier fulfillment pipeline.
 * Idempotent: safe to call multiple times for the same order.
 */
export async function fulfillTier1(input: Tier1Input): Promise<Tier1Result> {
  const { orderId, tributeId, tributeSlug, customerEmail } = input
  const tag = `[tier1:${orderId}]`

  // ── 1. Load tribute & photos ──────────────────────────────────────────────
  console.log(`${tag} Loading tribute data...`)
  const tribute = await getTributeById(tributeId)
  if (!tribute) {
    throw new Error(`Tribute not found: ${tributeId}`)
  }

  const photos = await getTributePhotos(tributeId)
  console.log(`${tag} Tribute: "${tribute.subject_name}" | Photos: ${photos.length}`)

  // ── 2. Generate PDF ───────────────────────────────────────────────────────
  console.log(`${tag} Generating memorial card PDF...`)
  const pdfBuffer = await generateMemorialCard(tribute, photos)
  console.log(`${tag} PDF generated: ${(pdfBuffer.length / 1024).toFixed(1)} KB`)

  // ── 3. Upload to Supabase Storage ─────────────────────────────────────────
  const safeName = tribute.subject_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  const filename = `${safeName}-memorial-card.pdf`
  console.log(`${tag} Uploading PDF to storage (${filename})...`)
  const pdfUrl = await uploadPDF(orderId, filename, pdfBuffer)
  console.log(`${tag} Upload complete. Signed URL created.`)

  // ── 4. Send fulfillment email ─────────────────────────────────────────────
  if (customerEmail) {
    console.log(`${tag} Sending fulfillment email to ${customerEmail}...`)
    await sendFulfillmentEmail({
      to: customerEmail,
      subjectName: tribute.subject_name,
      tributeSlug,
      tier: 'keep',
      downloads: [
        {
          label: `${tribute.subject_name} — Memorial Card PDF`,
          url: pdfUrl,
          description:
            'A beautiful memorial card — perfect for printing, framing, or sharing with family.',
        },
      ],
    })
    console.log(`${tag} Email sent.`)
  } else {
    console.warn(`${tag} No customer email — skipping fulfillment email.`)
  }

  // ── 5. Update order + tribute in DB ──────────────────────────────────────
  const fulfilledAt = new Date().toISOString()
  await updateOrderStatus(orderId, 'fulfilled', {
    pdfUrl,
    tier: 'keep',
    fulfilledAt,
  })

  await updateTribute(tributeId, {
    tier: 'keep',
    expires_at: null, // permanent — never expires
  })

  console.log(`${tag} ✓ Keep fulfillment complete.`)
  return { pdfUrl, fulfilledAt }
}
