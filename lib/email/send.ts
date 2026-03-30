/**
 * Email sending via Resend
 * Tribute ready + upsell interest + order confirmation emails
 */

import { Resend } from 'resend'
import { TributeReadyEmail } from '@/emails/tribute-ready'
import { UpsellInterestEmail } from '@/emails/upsell-interest'
import { OrderConfirmationEmail } from '@/emails/order-confirmation'

/**
 * Build an email-safe photo URL.
 *
 * Problem: mobile cameras (iOS/Android) store portrait photos with landscape
 * pixel dimensions and encode the correct orientation in the EXIF metadata.
 * Web browsers auto-apply that EXIF rotation, but email clients don't — so
 * the raw CDN URL renders the image sideways (landscape) in email.
 *
 * Fix: Supabase Storage's Image Transformation API auto-rotates the image
 * according to its EXIF data when you request a transform. Appending
 * `?width=480&quality=80` is enough to trigger the transform pipeline,
 * which normalises orientation and returns a correctly-oriented JPEG.
 * This also caps the image at 480 px wide (suitable for email) and compresses
 * it, reducing email load time.
 *
 * If the URL is not a Supabase storage URL (e.g. an AI-generated image or a
 * local dev URL), we return it unchanged — those images are already
 * correctly oriented.
 */
export function buildEmailPhotoUrl(cdnUrl: string | undefined | null): string | undefined {
  if (!cdnUrl) return undefined

  // Only apply transforms to Supabase Storage public URLs
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || !cdnUrl.startsWith(supabaseUrl)) {
    return cdnUrl
  }

  // Supabase image transform: triggers EXIF auto-rotation + resizes for email
  // Docs: https://supabase.com/docs/guides/storage/serving/image-transformations
  const url = new URL(cdnUrl)
  url.searchParams.set('width', '480')
  url.searchParams.set('quality', '80')
  return url.toString()
}

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

  // Normalise the photo URL: triggers EXIF auto-rotation in Supabase's image
  // transform pipeline so portrait photos display correctly in email clients.
  const heroPhotoUrl = buildEmailPhotoUrl(options.heroPhotoUrl)

  try {
    await resend.emails.send({
      from: `Forever Remembered <${FROM}>`,
      to: options.to,
      replyTo: 'support@foreverremembered.ai',
      subject: `${options.subjectName}'s tribute is ready ✨`,
      react: TributeReadyEmail({
        subjectName: options.subjectName,
        tributeUrl,
        heroPhotoUrl,
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

/**
 * Send order confirmation email after successful Stripe payment
 */
export async function sendOrderConfirmationEmail(options: {
  to: string
  subjectName: string
  tributeSlug: string
  tier: 'keep' | 'cherish' | 'legacy'
  amountCents: number
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('placeholder')) {
    console.warn('Resend not configured — skipping order confirmation email')
    return
  }

  const tributeUrl = `${BASE_URL}/tribute/${options.tributeSlug}`
  const amountFormatted = `$${(options.amountCents / 100).toFixed(0)}`
  const tierLabel = options.tier.charAt(0).toUpperCase() + options.tier.slice(1)

  try {
    await resend.emails.send({
      from: `Forever Remembered <${FROM}>`,
      to: options.to,
      replyTo: 'support@foreverremembered.ai',
      subject: `Your ${tierLabel} order for ${options.subjectName} is confirmed ✨`,
      react: OrderConfirmationEmail({
        subjectName: options.subjectName,
        tributeUrl,
        tier: options.tier,
        amountFormatted,
        customerEmail: options.to,
      }),
    })
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
    // Don't throw — email failure shouldn't block order processing
  }
}
