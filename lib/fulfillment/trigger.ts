/**
 * Fulfillment Trigger — main orchestrator
 *
 * Called from the Stripe webhook after checkout.session.completed.
 * Handles all three tiers:
 *
 *   keep ($39)    → PDF tribute book + email
 *   cherish ($127) → Keep + additional photos page + memorial book PDF + email
 *   legacy ($397)  → Cherish + print-ready high-res PDF + printing instructions
 *
 * All PDFs are uploaded to Supabase Storage (private bucket) and
 * the customer receives signed download links valid for 1 year.
 */

import { getTributeById } from '@/lib/db/tributes'
import { getTributePhotos } from '@/lib/db/photos'
import { updateOrderStatus } from '@/lib/db/orders'
import { generateTributePDF, generatePrintReadyPDF } from '@/lib/fulfillment/generate-pdf'
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
 * Main fulfillment entry point.
 * Safe to call multiple times — idempotent via order status check.
 */
export async function triggerFulfillment(input: FulfillmentInput): Promise<void> {
  const { orderId, tributeId, tributeSlug, tier, customerEmail } = input
  const tag = `[fulfillment:${orderId}:${tier}]`

  console.log(`${tag} Starting fulfillment...`)

  try {
    // 1. Load tribute data
    const tribute = await getTributeById(tributeId)
    if (!tribute) {
      throw new Error(`Tribute not found: ${tributeId}`)
    }

    // 2. Load photos
    const photos = await getTributePhotos(tributeId)
    console.log(`${tag} Loaded tribute "${tribute.subject_name}" with ${photos.length} photos`)

    // 3. Run tier-specific fulfillment
    switch (tier) {
      case 'keep':
        await fulfillKeep({ orderId, tribute, photos, customerEmail, tributeSlug, tag })
        break
      case 'cherish':
        await fulfillCherish({ orderId, tribute, photos, customerEmail, tributeSlug, tag })
        break
      case 'legacy':
        await fulfillLegacy({ orderId, tribute, photos, customerEmail, tributeSlug, tag })
        break
      default:
        throw new Error(`Unknown tier: ${tier}`)
    }

    console.log(`${tag} Fulfillment complete ✓`)
  } catch (error) {
    console.error(`${tag} Fulfillment failed:`, error)
    // Mark order as failed so we can investigate / retry
    await updateOrderStatus(orderId, 'failed', {
      error: error instanceof Error ? error.message : String(error),
      failedAt: new Date().toISOString(),
    })
    // Re-throw so the webhook can return 500 and Stripe will retry
    throw error
  }
}

// ── Keep ($39) ────────────────────────────────────────────────────────────────

async function fulfillKeep({
  orderId,
  tribute,
  photos,
  customerEmail,
  tributeSlug,
  tag,
}: {
  orderId: string
  tribute: Awaited<ReturnType<typeof getTributeById>>
  photos: Awaited<ReturnType<typeof getTributePhotos>>
  customerEmail: string
  tributeSlug: string
  tag: string
}) {
  if (!tribute) throw new Error('Tribute is null')

  console.log(`${tag} Generating memorial PDF...`)
  const pdfBuffer = await generateTributePDF(tribute, photos)

  console.log(`${tag} Uploading PDF to storage...`)
  const filename = `${tribute.subject_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-memorial.pdf`
  const downloadUrl = await uploadPDF(orderId, filename, pdfBuffer)

  console.log(`${tag} Sending fulfillment email...`)
  await sendFulfillmentEmail({
    to: customerEmail,
    subjectName: tribute.subject_name,
    tributeSlug,
    tier: 'keep',
    downloads: [
      {
        label: `${tribute.subject_name} — Memorial PDF`,
        url: downloadUrl,
        description: 'A beautiful memorial booklet — perfect for sharing or printing at home.',
      },
    ],
  })

  // Mark as fulfilled
  await updateOrderStatus(orderId, 'fulfilled', {
    pdfUrl: downloadUrl,
    fulfilledAt: new Date().toISOString(),
  })
}

// ── Cherish ($127) ────────────────────────────────────────────────────────────

async function fulfillCherish({
  orderId,
  tribute,
  photos,
  customerEmail,
  tributeSlug,
  tag,
}: {
  orderId: string
  tribute: Awaited<ReturnType<typeof getTributeById>>
  photos: Awaited<ReturnType<typeof getTributePhotos>>
  customerEmail: string
  tributeSlug: string
  tag: string
}) {
  if (!tribute) throw new Error('Tribute is null')

  console.log(`${tag} Generating memorial book PDF (Cherish tier)...`)
  // Cherish gets the same PDF — our generate-pdf includes photo grids for multi-photo tributes
  const pdfBuffer = await generateTributePDF(tribute, photos)

  console.log(`${tag} Uploading memorial book PDF...`)
  const safeName = tribute.subject_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  const bookFilename = `${safeName}-memorial-book.pdf`
  const bookUrl = await uploadPDF(orderId, bookFilename, pdfBuffer)

  const downloads = [
    {
      label: `${tribute.subject_name} — Memorial Book PDF`,
      url: bookUrl,
      description:
        'A full memorial book with photos and tribute — beautifully formatted for print or digital sharing.',
    },
  ]

  console.log(`${tag} Sending Cherish fulfillment email...`)
  await sendFulfillmentEmail({
    to: customerEmail,
    subjectName: tribute.subject_name,
    tributeSlug,
    tier: 'cherish',
    downloads,
  })

  await updateOrderStatus(orderId, 'fulfilled', {
    bookPdfUrl: bookUrl,
    fulfilledAt: new Date().toISOString(),
  })
}

// ── Legacy ($397) ─────────────────────────────────────────────────────────────

async function fulfillLegacy({
  orderId,
  tribute,
  photos,
  customerEmail,
  tributeSlug,
  tag,
}: {
  orderId: string
  tribute: Awaited<ReturnType<typeof getTributeById>>
  photos: Awaited<ReturnType<typeof getTributePhotos>>
  customerEmail: string
  tributeSlug: string
  tag: string
}) {
  if (!tribute) throw new Error('Tribute is null')

  const safeName = tribute.subject_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()

  console.log(`${tag} Generating memorial book PDF (Legacy tier)...`)
  const [memorialPdf, printReadyPdf] = await Promise.all([
    generateTributePDF(tribute, photos),
    generatePrintReadyPDF(tribute, photos),
  ])

  console.log(`${tag} Uploading Legacy PDFs...`)
  const [memorialUrl, printReadyUrl] = await Promise.all([
    uploadPDF(orderId, `${safeName}-memorial-book.pdf`, memorialPdf),
    uploadPDF(orderId, `${safeName}-print-ready.pdf`, printReadyPdf),
  ])

  const downloads = [
    {
      label: `${tribute.subject_name} — Memorial Book (Digital)`,
      url: memorialUrl,
      description: 'Optimized for screens, email, and casual home printing.',
    },
    {
      label: `${tribute.subject_name} — Print-Ready Files (8.5×11")`,
      url: printReadyUrl,
      description:
        'High-resolution files formatted for professional printing. Take to FedEx, Staples, or your local print shop.',
    },
  ]

  console.log(`${tag} Sending Legacy fulfillment email...`)
  await sendFulfillmentEmail({
    to: customerEmail,
    subjectName: tribute.subject_name,
    tributeSlug,
    tier: 'legacy',
    downloads,
  })

  await updateOrderStatus(orderId, 'fulfilled', {
    memorialPdfUrl: memorialUrl,
    printReadyPdfUrl: printReadyUrl,
    fulfilledAt: new Date().toISOString(),
  })
}
