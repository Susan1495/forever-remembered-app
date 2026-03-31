/**
 * Email sending via Resend
 * Tribute ready + upsell interest + order confirmation emails
 */

import { Resend } from 'resend'
import { TributeReadyEmail } from '@/emails/tribute-ready'
import { TributeFollowupEmail } from '@/emails/tribute-followup'
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

// Lazy-initialise Resend so module-level instantiation doesn't throw during
// Next.js build-time static analysis when env vars are absent.
function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set')
  return new Resend(key)
}

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
  const celebrateUrl = `${BASE_URL}/tribute/${options.tributeSlug}/celebrate`

  // Normalise the photo URL: triggers EXIF auto-rotation in Supabase's image
  // transform pipeline so portrait photos display correctly in email clients.
  const heroPhotoUrl = buildEmailPhotoUrl(options.heroPhotoUrl)

  try {
    const result = await getResend().emails.send({
      from: `Forever Remembered <${FROM}>`,
      to: options.to,
      replyTo: 'support@foreverremembered.ai',
      subject: `Your tribute for ${options.subjectName} is ready 🌹`,
      react: TributeReadyEmail({
        subjectName: options.subjectName,
        tributeUrl,
        celebrateUrl,
        heroPhotoUrl,
      }),
    })

    if ('error' in result && result.error) {
      // Resend returns errors as { error: { statusCode, name, message } } in some SDK versions
      const err = result.error as { statusCode?: number; name?: string; message?: string }
      if (err.statusCode === 403 || err.name === 'validation_error') {
        console.error(
          `[email] Domain not verified — tribute ready email could NOT be sent to ${options.to}.` +
          ` Verify the ${FROM.split('@')[1]} domain at https://resend.com/domains to enable email delivery.` +
          ` tribute=${options.tributeSlug} error=${err.message}`
        )
      } else {
        console.error(`[email] Resend error for ${options.to} tribute=${options.tributeSlug}:`, result.error)
      }
      return
    }

    if ('data' in result && result.data?.id) {
      console.log(`[email] Tribute ready email sent to ${options.to} — id=${result.data.id} tribute=${options.tributeSlug}`)
    }
  } catch (error) {
    console.error(`[email] Failed to send tribute ready email to ${options.to} tribute=${options.tributeSlug}:`, error)
    // Don't throw — email failure shouldn't break the generation pipeline
  }
}

/**
 * Send 24-hour follow-up email (upsell, no purchase yet)
 */
export async function sendTributeFollowupEmail(options: {
  to: string
  subjectName: string
  tributeSlug: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('placeholder')) {
    console.warn('Resend not configured — skipping tribute follow-up email')
    return
  }

  const tributeUrl = `${BASE_URL}/tribute/${options.tributeSlug}`
  const celebrateUrl = `${BASE_URL}/tribute/${options.tributeSlug}/celebrate`

  try {
    const result = await getResend().emails.send({
      from: `Forever Remembered <${FROM}>`,
      to: options.to,
      replyTo: 'support@foreverremembered.ai',
      subject: `The people you shared ${options.subjectName}'s tribute with loved it 💛`,
      react: TributeFollowupEmail({
        subjectName: options.subjectName,
        tributeUrl,
        celebrateUrl,
      }),
    })

    if ('error' in result && result.error) {
      const err = result.error as { statusCode?: number; name?: string; message?: string }
      console.error(`[email] Follow-up email error for ${options.to} tribute=${options.tributeSlug}:`, err.message)
      return
    }

    if ('data' in result && result.data?.id) {
      console.log(`[email] Follow-up email sent to ${options.to} — id=${result.data.id} tribute=${options.tributeSlug}`)
    }
  } catch (error) {
    console.error(`[email] Failed to send follow-up email to ${options.to} tribute=${options.tributeSlug}:`, error)
    // Don't throw — email failure shouldn't block cron pipeline
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
    await getResend().emails.send({
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
    await getResend().emails.send({
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
