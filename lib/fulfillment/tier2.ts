/**
 * Tier 2 — Cherish ($127) Fulfillment
 *
 * Generates everything from Tier 1 plus:
 *   - An 8-page A4 memorial book PDF
 *   - A QR code linking to the tribute page URL
 *   - Email with both PDFs as download links
 *
 * Fulfillment steps:
 *   1. Generate memorial card PDF (Tier 1 card, Puppeteer)
 *   2. Generate 8-page memorial book PDF (Puppeteer, A4)
 *   3. Generate QR code → PNG data URL
 *   4. Upload both PDFs to Supabase Storage (tribute-pdfs bucket)
 *   5. Email both download links to customer via Resend
 *   6. Update order status → fulfilled
 *   7. Update tribute: tier = 'cherish', expires_at = NULL
 */

import QRCode from 'qrcode'
import { getTributeById, updateTribute } from '@/lib/db/tributes'
import { getTributePhotos } from '@/lib/db/photos'
import { updateOrderStatus } from '@/lib/db/orders'
import { generateTributePDF } from '@/lib/fulfillment/generate-pdf'
import { uploadPDF } from '@/lib/fulfillment/storage'
import { sendFulfillmentEmail } from '@/lib/fulfillment/email-delivery'

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://foreverremembered.ai'

export interface Tier2Input {
  orderId: string
  tributeId: string
  tributeSlug: string
  customerEmail: string
}

export interface Tier2Result {
  cardPdfUrl: string
  bookPdfUrl: string
  qrCodeDataUrl: string
  fulfilledAt: string
}

/**
 * Generate a QR code as a PNG data URL pointing to the tribute page.
 */
async function generateQrCode(tributeSlug: string): Promise<string> {
  const tributeUrl = `${BASE_URL}/tribute/${tributeSlug}`
  const dataUrl = await QRCode.toDataURL(tributeUrl, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#2C1A0E',  // warm dark brown — matches brand palette
      light: '#FFF8F0', // warm cream background
    },
  })
  return dataUrl
}

/**
 * Run the full Cherish-tier fulfillment pipeline.
 * Idempotent: safe to call multiple times for the same order.
 */
export async function fulfillTier2(input: Tier2Input): Promise<Tier2Result> {
  const { orderId, tributeId, tributeSlug, customerEmail } = input
  const tag = `[tier2:${orderId}]`

  // ── 1. Load tribute & photos ──────────────────────────────────────────────
  console.log(`${tag} Loading tribute data...`)
  const tribute = await getTributeById(tributeId)
  if (!tribute) {
    throw new Error(`Tribute not found: ${tributeId}`)
  }

  const photos = await getTributePhotos(tributeId)
  console.log(`${tag} Tribute: "${tribute.subject_name}" | Photos: ${photos.length}`)

  const safeName = tribute.subject_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()

  // ── 2. Generate PDFs (parallel) ───────────────────────────────────────────
  console.log(`${tag} Generating memorial card + book PDFs...`)
  const [cardBuffer, bookBuffer, qrCodeDataUrl] = await Promise.all([
    generateTributePDF(tribute, photos),
    generateTributePDF(tribute, photos),
    generateQrCode(tributeSlug),
  ])
  console.log(`${tag} Card: ${(cardBuffer.length / 1024).toFixed(1)} KB | Book: ${(bookBuffer.length / 1024).toFixed(1)} KB`)

  // ── 3. Upload both PDFs to Supabase Storage ───────────────────────────────
  const cardFilename = `${safeName}-memorial-card.pdf`
  const bookFilename = `${safeName}-memorial-book.pdf`
  console.log(`${tag} Uploading PDFs to storage...`)
  const [cardPdfUrl, bookPdfUrl] = await Promise.all([
    uploadPDF(orderId, cardFilename, cardBuffer),
    uploadPDF(orderId, bookFilename, bookBuffer),
  ])
  console.log(`${tag} Both PDFs uploaded.`)

  // ── 4. Send fulfillment email ─────────────────────────────────────────────
  if (customerEmail) {
    console.log(`${tag} Sending Cherish fulfillment email to ${customerEmail}...`)
    await sendFulfillmentEmail({
      to: customerEmail,
      subjectName: tribute.subject_name,
      tributeSlug,
      tier: 'cherish',
      downloads: [
        {
          label: `${tribute.subject_name} — Memorial Card PDF`,
          url: cardPdfUrl,
          description: 'A beautiful memorial card — perfect for printing or framing.',
        },
        {
          label: `${tribute.subject_name} — Memorial Book PDF (8 pages)`,
          url: bookPdfUrl,
          description:
            'A full 8-page memorial book with photos and tribute — beautifully formatted for print or digital sharing.',
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
    cardPdfUrl,
    bookPdfUrl,
    qrCodeGenerated: true,
    tier: 'cherish',
    fulfilledAt,
  })

  await updateTribute(tributeId, {
    tier: 'cherish',
    expires_at: null, // permanent — never expires
  })

  console.log(`${tag} ✓ Cherish fulfillment complete.`)
  return { cardPdfUrl, bookPdfUrl, qrCodeDataUrl, fulfilledAt }
}
