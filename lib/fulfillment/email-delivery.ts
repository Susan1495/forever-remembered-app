/**
 * Fulfillment Email Delivery
 *
 * Sends the fulfillment email with download links to the customer.
 */

import { Resend } from 'resend'
import { FulfillmentDeliveryEmail } from '@/emails/fulfillment-delivery'

const FROM = process.env.EMAIL_FROM || 'hello@foreverremembered.ai'
const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://foreverremembered.ai'

interface DownloadLink {
  label: string
  url: string
  description?: string
}

interface SendFulfillmentEmailOptions {
  to: string
  subjectName: string
  tributeSlug: string
  tier: 'keep' | 'cherish' | 'legacy'
  downloads: DownloadLink[]
}

export async function sendFulfillmentEmail(options: SendFulfillmentEmailOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('placeholder')) {
    console.warn('Resend not configured — skipping fulfillment delivery email')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const tributeUrl = `${BASE_URL}/tribute/${options.tributeSlug}`

  const TIER_SUBJECTS: Record<string, string> = {
    keep: `Your memorial PDF for ${options.subjectName} is ready ✨`,
    cherish: `Your memorial book for ${options.subjectName} is ready ✨`,
    legacy: `Your legacy package for ${options.subjectName} is ready ✨`,
  }

  try {
    await resend.emails.send({
      from: `Forever Remembered <${FROM}>`,
      to: options.to,
      replyTo: 'support@foreverremembered.ai',
      subject: TIER_SUBJECTS[options.tier],
      react: FulfillmentDeliveryEmail({
        subjectName: options.subjectName,
        tributeUrl,
        tier: options.tier,
        downloads: options.downloads,
        customerEmail: options.to,
      }),
    })
    console.log(`Fulfillment email sent to ${options.to} for tier: ${options.tier}`)
  } catch (error) {
    // Log but don't throw — fulfillment record is already saved in DB
    console.error('Failed to send fulfillment delivery email:', error)
    throw error // re-throw so caller can mark order as failed if needed
  }
}
