/**
 * Email sending via Resend
 * Tribute ready + upsell interest emails
 */

import { Resend } from 'resend'
import { TributeReadyEmail } from '@/emails/tribute-ready'
import { UpsellInterestEmail } from '@/emails/upsell-interest'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'hello@foreverremembered.ai'
const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://foreverremembered.ai'

/**
 * Send "Your tribute is ready" email
 */
export async function sendTributeReadyEmail(options: {
  to: string
  subjectName: string
  tributeSlug: string
  heroPhotoUrl?: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('placeholder')) {
    console.warn('Resend not configured — skipping tribute ready email')
    return
  }

  const tributeUrl = `${BASE_URL}/tribute/${options.tributeSlug}`

  try {
    await resend.emails.send({
      from: `Forever Remembered <${FROM}>`,
      to: options.to,
      replyTo: 'support@foreverremembered.ai',
      subject: `${options.subjectName}'s tribute is ready ✨`,
      react: TributeReadyEmail({
        subjectName: options.subjectName,
        tributeUrl,
        heroPhotoUrl: options.heroPhotoUrl,
      }),
    })
  } catch (error) {
    console.error('Failed to send tribute ready email:', error)
    // Don't throw — email failure shouldn't break the generation pipeline
  }
}

/**
 * Send "We'll be in touch" upsell interest email
 */
export async function sendUpsellInterestEmail(options: {
  to: string
  subjectName: string
  tributeSlug: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('placeholder')) {
    console.warn('Resend not configured — skipping upsell interest email')
    return
  }

  const tributeUrl = `${BASE_URL}/tribute/${options.tributeSlug}`

  try {
    await resend.emails.send({
      from: `Forever Remembered <${FROM}>`,
      to: options.to,
      replyTo: 'support@foreverremembered.ai',
      subject: `Ways to preserve ${options.subjectName}'s tribute`,
      react: UpsellInterestEmail({
        subjectName: options.subjectName,
        tributeUrl,
      }),
    })
  } catch (error) {
    console.error('Failed to send upsell interest email:', error)
  }
}
