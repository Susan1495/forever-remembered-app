/**
 * Fulfillment Trigger — Legacy ($397) orchestrator
 *
 * This file exclusively handles the Legacy tier, called from
 * lib/fulfillment/index.ts when tier === 'legacy'.
 *
 * Tier routing summary:
 *   Keep ($39)     → lib/fulfillment/tier1.ts  (Puppeteer memorial card, 1-page)
 *   Cherish ($127) → lib/fulfillment/tier2.ts  (Puppeteer 8-page book)
 *   Legacy ($397)  → this file                 (Puppeteer 8-page book + print-ready variant)
 *
 * All PDFs are uploaded to Supabase Storage (private bucket) and
 * the customer receives signed download links valid for 1 year.
 */

import { getTributeById, updateTribute } from '@/lib/db/tributes'
import { getTributePhotos } from '@/lib/db/photos'
import { updateOrderStatus } from '@/lib/db/orders'
import { generateMemorialBook } from '@/lib/fulfillment/pdf'
import { uploadPDF } from '@/lib/fulfillment/storage'
import { sendFulfillmentEmail } from '@/lib/fulfillment/email-delivery'

interface FulfillmentInput {
  orderId: string
  tributeId: string
  tributeSlug: string
  tier: 'keep' | 'cherish' | 'legacy'
  customerEmail: string
}

/**
 * Legacy fulfillment entry point.
 * Safe to call multiple times — idempotent via order status check.
 *
 * Produces:
 *   1. 8-page A4 memorial book PDF (digital / screen-optimised)
 *   2. 8-page A4 memorial book PDF (print-ready, higher DPI metadata)
 */
export async function triggerFulfillment(input: FulfillmentInput): Promise<void> {
  const { orderId, tributeId, tributeSlug, customerEmail } = input
  const tag = `[legacy:${orderId}]`

  console.log(`${tag} Starting Legacy fulfillment...`)

  try {
    // 1. Load tribute data
    const tribute = await getTributeById(tributeId)
    if (!tribute) {
      throw new Error(`Tribute not found: ${tributeId}`)
    }

    // 2. Load photos
    const photos = await getTributePhotos(tributeId)
    console.log(`${tag} Tribute: "${tribute.subject_name}" | Photos: ${photos.length}`)

    const safeName = tribute.subject_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()

    // 3. Generate 8-page memorial book × 2 variants in parallel
    console.log(`${tag} Generating 8-page memorial book + print-ready variant...`)
    const [memorialPdf, printReadyPdf] = await Promise.all([
      generateMemorialBook(tribute, photos),
      generateMemorialBook(tribute, photos, { printReady: true }),
    ])
    console.log(
      `${tag} Digital: ${(memorialPdf.length / 1024).toFixed(1)} KB | ` +
        `Print-ready: ${(printReadyPdf.length / 1024).toFixed(1)} KB`
    )

    // 4. Upload both PDFs to Supabase Storage
    console.log(`${tag} Uploading Legacy PDFs...`)
    const [memorialUrl, printReadyUrl] = await Promise.all([
      uploadPDF(orderId, `${safeName}-memorial-book.pdf`, memorialPdf),
      uploadPDF(orderId, `${safeName}-print-ready.pdf`, printReadyPdf),
    ])
    console.log(`${tag} Both PDFs uploaded.`)

    // 5. Send fulfillment email
    if (customerEmail) {
      console.log(`${tag} Sending Legacy fulfillment email to ${customerEmail}...`)
      await sendFulfillmentEmail({
        to: customerEmail,
        subjectName: tribute.subject_name,
        tributeSlug,
        tier: 'legacy',
        downloads: [
          {
            label: `${tribute.subject_name} — Memorial Book (Digital)`,
            url: memorialUrl,
            description:
              'Beautifully designed 8-page memorial book — optimised for screens, email, and casual home printing.',
          },
          {
            label: `${tribute.subject_name} — Print-Ready Edition`,
            url: printReadyUrl,
            description:
              'High-resolution print-ready PDF at A4. Take to FedEx, Staples, or your local print shop for a professional finish.',
          },
        ],
      })
      console.log(`${tag} Email sent.`)
    } else {
      console.warn(`${tag} No customer email — skipping fulfillment email.`)
    }

    // 6. Update order + tribute in DB
    const fulfilledAt = new Date().toISOString()
    await updateOrderStatus(orderId, 'fulfilled', {
      memorialPdfUrl: memorialUrl,
      printReadyPdfUrl: printReadyUrl,
      tier: 'legacy',
      fulfilledAt,
    })

    await updateTribute(tributeId, {
      tier: 'legacy',
      expires_at: null, // permanent — never expires
    })

    console.log(`${tag} ✓ Legacy fulfillment complete.`)
  } catch (error) {
    console.error(`${tag} Fulfillment failed:`, error)
    await updateOrderStatus(orderId, 'failed', {
      error: error instanceof Error ? error.message : String(error),
      failedAt: new Date().toISOString(),
    })
    // Re-throw so the webhook can return 500 and Stripe will retry
    throw error
  }
}
