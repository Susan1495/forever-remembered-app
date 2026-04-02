/**
 * Fulfillment Trigger — All tiers, Vercel-safe (@react-pdf/renderer)
 *
 * Handles Keep, Cherish, and Legacy tiers using @react-pdf/renderer.
 * No headless browser required — works on Vercel serverless.
 *
 * Tier summary:
 *   Keep ($39)     → 1 PDF (memorial card), 1 download link
 *   Cherish ($127) → 2 PDFs (card + book), 2 download links
 *   Legacy ($397)  → 2 PDFs (book digital + print-ready), 2 download links
 */

import { getTributeById, updateTribute } from '@/lib/db/tributes'
import { getTributePhotos } from '@/lib/db/photos'
import { updateOrderStatus } from '@/lib/db/orders'
import { generateMemorialCardPDF, generateTributePDF, generatePrintReadyPDF } from '@/lib/fulfillment/generate-pdf'
import { uploadPDF, uploadImage } from '@/lib/fulfillment/storage'
import { sendFulfillmentEmail, sendLegacyAdminAlert } from '@/lib/fulfillment/email-delivery'

interface FulfillmentInput {
  orderId: string
  tributeId: string
  tributeSlug: string
  tier: 'keep' | 'cherish' | 'legacy' | 'cherish_monthly' | 'cherish_annual' | 'pdf'
  customerEmail: string
}

/**
 * Universal fulfillment entry point — all tiers.
 * Safe to call multiple times — idempotent via order status check.
 */
export async function triggerFulfillment(input: FulfillmentInput): Promise<void> {
  const { orderId, tributeId, tributeSlug, tier, customerEmail } = input
  const tag = `[${tier}:${orderId}]`

  console.log(`${tag} Starting fulfillment (react-pdf, no browser)...`)

  try {
    // 1. Load tribute data
    const tribute = await getTributeById(tributeId)
    if (!tribute) throw new Error(`Tribute not found: ${tributeId}`)

    // 2. Load photos
    const photos = await getTributePhotos(tributeId)
    console.log(`${tag} Tribute: "${tribute.subject_name}" | Photos: ${photos.length}`)

    const safeName = tribute.subject_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const name = tribute.subject_name

    // 3. Generate PDFs based on tier
    let downloads: Array<{ label: string; url: string; description: string }> = []

    if (tier === 'keep' || tier === 'pdf') {
      // Keep: 1 memorial PDF
      console.log(`${tag} Generating memorial card PDF...`)
      const pdfBuffer = await generateMemorialCardPDF(tribute, photos)
      console.log(`${tag} PDF: ${(pdfBuffer.length / 1024).toFixed(1)} KB`)

      const pdfUrl = await uploadPDF(orderId, `${safeName}-memorial-card.pdf`, pdfBuffer)
      downloads = [
        {
          label: `${name} — Memorial Card PDF`,
          url: pdfUrl,
          description: 'A beautiful memorial card — perfect for printing, framing, or sharing with family.',
        },
      ]

    } else if (tier === 'cherish' || tier === 'cherish_monthly' || tier === 'cherish_annual') {
      // Cherish: card PDF + book PDF + QR code PNG
      console.log(`${tag} Generating memorial card, book PDFs + QR code...`)
      const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://foreverremembered.ai'
      const tributeUrl = `${BASE_URL}/tribute/${tributeSlug}`

      // Generate QR code as PNG buffer
      const QRCode = (await import('qrcode')).default
      const qrDataUrl = await QRCode.toDataURL(tributeUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 400,
        margin: 2,
        color: { dark: '#2C1A0E', light: '#FFF8F0' },
      })
      // Convert data URL to buffer
      const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '')
      const qrBuffer = Buffer.from(qrBase64, 'base64')

      const [cardBuffer, bookBuffer] = await Promise.all([
        generateMemorialCardPDF(tribute, photos),
        generateTributePDF(tribute, photos),
      ])
      console.log(`${tag} Card: ${(cardBuffer.length / 1024).toFixed(1)} KB | Book: ${(bookBuffer.length / 1024).toFixed(1)} KB | QR: ${(qrBuffer.length / 1024).toFixed(1)} KB`)

      const [cardUrl, bookUrl, qrUrl] = await Promise.all([
        uploadPDF(orderId, `${safeName}-memorial-card.pdf`, cardBuffer),
        uploadPDF(orderId, `${safeName}-memorial-book.pdf`, bookBuffer),
        uploadImage(orderId, `${safeName}-qr-code.png`, qrBuffer),
      ])
      downloads = [
        {
          label: `${name} — Memorial Card PDF`,
          url: cardUrl,
          description: 'A beautiful memorial card — perfect for printing or framing.',
        },
        {
          label: `${name} — Memorial Book PDF (8 pages)`,
          url: bookUrl,
          description: 'A full 8-page memorial book with photos and tribute — beautifully formatted for print or digital sharing.',
        },
        {
          label: `${name} — QR Code (PNG)`,
          url: qrUrl,
          description: 'Scan to visit the tribute page. Perfect for printing on funeral programs, cards, or framing.',
        },
      ]

    } else {
      // Legacy: digital book + print-ready book
      console.log(`${tag} Generating memorial book + print-ready variant...`)
      const [memorialPdf, printReadyPdf] = await Promise.all([
        generateTributePDF(tribute, photos),
        generatePrintReadyPDF(tribute, photos),
      ])
      console.log(`${tag} Digital: ${(memorialPdf.length / 1024).toFixed(1)} KB | Print-ready: ${(printReadyPdf.length / 1024).toFixed(1)} KB`)

      const [memorialUrl, printReadyUrl] = await Promise.all([
        uploadPDF(orderId, `${safeName}-memorial-book.pdf`, memorialPdf),
        uploadPDF(orderId, `${safeName}-print-ready.pdf`, printReadyPdf),
      ])
      downloads = [
        {
          label: `${name} — Memorial Book (Digital)`,
          url: memorialUrl,
          description: 'Beautifully designed 8-page memorial book — optimised for screens, email, and casual home printing.',
        },
        {
          label: `${name} — Print-Ready Edition`,
          url: printReadyUrl,
          description: 'High-resolution print-ready PDF at A4. Take to FedEx, Staples, or your local print shop for a professional finish.',
        },
      ]
    }

    // 4. Send fulfillment email
    if (customerEmail) {
      console.log(`${tag} Sending fulfillment email to ${customerEmail}...`)
      await sendFulfillmentEmail({
        to: customerEmail,
        subjectName: name,
        tributeSlug,
        tier,
        downloads,
      })
      console.log(`${tag} Email sent.`)
    } else {
      console.warn(`${tag} No customer email — skipping fulfillment email.`)
    }

    // 5. Send admin alert for Legacy orders (manual print + ship)
    if (tier === 'legacy') {
      const printReadyDownload = downloads.find(d => d.label.includes('Print-Ready'))
      const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://foreverremembered.ai'
      await sendLegacyAdminAlert({
        subjectName: name,
        customerEmail,
        printReadyPdfUrl: printReadyDownload?.url || downloads[0]?.url || '',
        tributeUrl: `${BASE_URL}/tribute/${tributeSlug}`,
        orderId,
        amountFormatted: '$397',
      }).catch(err => console.error(`${tag} Admin alert failed:`, err))
    }

    // 6. Update order + tribute in DB
    const fulfilledAt = new Date().toISOString()
    // Store download URLs in fulfillment_data so the download endpoint can serve them
    const urlMap: Record<string, string> = {}
    downloads.forEach((d, i) => { urlMap[`url_${i}`] = d.url })
    await updateOrderStatus(orderId, 'fulfilled', {
      tier,
      fulfilledAt,
      pdfCount: downloads.length,
      downloads: downloads.map(d => ({ label: d.label, url: d.url })),
      ...urlMap,
    })

    await updateTribute(tributeId, {
      tier,
      expires_at: null,
    })

    console.log(`${tag} ✓ Fulfillment complete.`)
  } catch (error) {
    console.error(`${tag} Fulfillment failed:`, error)
    await updateOrderStatus(orderId, 'failed', {
      error: error instanceof Error ? error.message : String(error),
      failedAt: new Date().toISOString(),
    })
    throw error
  }
}
