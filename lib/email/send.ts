/**
 * Email sending via Resend
 * Tribute ready + upsell interest + order confirmation emails
 */

import { Resend } from 'resend'
import { TributeReadyEmail } from '@/emails/tribute-ready'
import { TributeFollowupEmail } from '@/emails/tribute-followup'
import { UpsellInterestEmail } from '@/emails/upsell-interest'
import { OrderConfirmationEmail } from '@/emails/order-confirmation'
import { PaymentWarningEmail } from '@/emails/payment-warning'
import { SubscriptionCancelledEmail } from '@/emails/subscription-cancelled'
import { AnniversaryReminderEmail } from '@/emails/anniversary-reminder'

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

  const tributeUrl = `${BASE_URL}/tribute/${options.tributeSlug}?created=1`
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
 * Send "Your tribute has expired" email when trial ends
 */
export async function sendTributeExpiredEmail(options: {
  to: string
  subjectName: string
  tributeSlug: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('placeholder')) {
    console.warn('Resend not configured — skipping tribute expired email')
    return
  }

  const celebrateUrl = `${BASE_URL}/tribute/${options.tributeSlug}/celebrate`

  try {
    const result = await getResend().emails.send({
      from: `Forever Remembered <${FROM}>`,
      to: options.to,
      replyTo: 'support@foreverremembered.ai',
      subject: `${options.subjectName}'s tribute has paused 🕯️`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #3D2B14; background: #FFFBF5;">
          <div style="text-align: center; font-size: 40px; margin-bottom: 20px;">🕯️</div>
          <h1 style="text-align: center; font-size: 24px; font-weight: 700; color: #1C1007; margin-bottom: 16px;">
            ${options.subjectName}'s tribute has paused
          </h1>
          <p style="text-align: center; font-size: 16px; line-height: 1.6; color: #6B5A45; margin-bottom: 24px;">
            Your free 30-day trial has ended. The tribute is safe — just paused until you subscribe.
          </p>
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${celebrateUrl}" style="display: inline-block; background: #D97706; color: #fff; border-radius: 999px; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none;">
              Keep this tribute alive →
            </a>
          </div>
          <p style="text-align: center; font-size: 13px; color: #9B8B78;">
            Starting at $9.99/month — cancel anytime
          </p>
          <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />
          <p style="text-align: center; font-size: 12px; color: #9B8B78;">
            Forever Remembered — <a href="https://foreverremembered.ai" style="color: #D97706;">foreverremembered.ai</a>
          </p>
        </div>
      `,
    })

    if ('error' in result && result.error) {
      const err = result.error as { statusCode?: number; name?: string; message?: string }
      console.error(`[email] Tribute expired email error for ${options.to} tribute=${options.tributeSlug}:`, err.message)
      return
    }

    if ('data' in result && result.data?.id) {
      console.log(`[email] Tribute expired email sent to ${options.to} — id=${result.data.id} tribute=${options.tributeSlug}`)
    }
  } catch (error) {
    console.error(`[email] Failed to send tribute expired email to ${options.to} tribute=${options.tributeSlug}:`, error)
    // Don't throw — email failure shouldn't block cron pipeline
  }
}

/**
 * Send payment warning email when Stripe invoice payment fails
 */
export async function sendPaymentWarningEmail(options: {
  to: string
  subjectName: string
  tributeSlug: string
  updatePaymentUrl: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('placeholder')) {
    console.warn('Resend not configured — skipping payment warning email')
    return
  }

  const tributeUrl = `${BASE_URL}/tribute/${options.tributeSlug}`

  try {
    const result = await getResend().emails.send({
      from: `Forever Remembered <${FROM}>`,
      to: options.to,
      replyTo: 'support@foreverremembered.ai',
      subject: `Action needed — update your payment for ${options.subjectName}'s tribute`,
      react: PaymentWarningEmail({
        subjectName: options.subjectName,
        tributeUrl,
        updatePaymentUrl: options.updatePaymentUrl,
        customerEmail: options.to,
      }),
    })

    if ('error' in result && result.error) {
      const err = result.error as { message?: string }
      console.error(`[email] Payment warning email error for ${options.to} tribute=${options.tributeSlug}:`, err.message)
      return
    }

    if ('data' in result && result.data?.id) {
      console.log(`[email] Payment warning email sent to ${options.to} — id=${result.data.id} tribute=${options.tributeSlug}`)
    }
  } catch (error) {
    console.error(`[email] Failed to send payment warning email to ${options.to} tribute=${options.tributeSlug}:`, error)
    // Don't throw — email failure shouldn't block webhook handling
  }
}

/**
 * Send subscription cancelled email when Cherish subscription ends
 */
export async function sendSubscriptionCancelledEmail(options: {
  to: string
  subjectName: string
  tributeSlug: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('placeholder')) {
    console.warn('Resend not configured — skipping subscription cancelled email')
    return
  }

  const tributeUrl = `${BASE_URL}/tribute/${options.tributeSlug}`
  const resubscribeUrl = `${BASE_URL}/tribute/${options.tributeSlug}/celebrate`

  try {
    const result = await getResend().emails.send({
      from: `Forever Remembered <${FROM}>`,
      to: options.to,
      replyTo: 'support@foreverremembered.ai',
      subject: `${options.subjectName}'s tribute has been paused`,
      react: SubscriptionCancelledEmail({
        subjectName: options.subjectName,
        tributeUrl,
        resubscribeUrl,
        customerEmail: options.to,
      }),
    })

    if ('error' in result && result.error) {
      const err = result.error as { message?: string }
      console.error(`[email] Subscription cancelled email error for ${options.to} tribute=${options.tributeSlug}:`, err.message)
      return
    }

    if ('data' in result && result.data?.id) {
      console.log(`[email] Subscription cancelled email sent to ${options.to} — id=${result.data.id} tribute=${options.tributeSlug}`)
    }
  } catch (error) {
    console.error(`[email] Failed to send subscription cancelled email to ${options.to} tribute=${options.tributeSlug}:`, error)
    // Don't throw — email failure shouldn't block webhook handling
  }
}

/**
 * Send anniversary reminder email to family members on key dates
 */
export async function sendAnniversaryReminderEmail(options: {
  to: string | string[]
  subjectName: string
  tributeSlug: string
  reflection: string
  occasion: string
  heroPhotoUrl?: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('placeholder')) {
    console.warn('Resend not configured — skipping anniversary reminder email')
    return
  }

  const tributeUrl = `${BASE_URL}/tribute/${options.tributeSlug}`
  const heroPhotoUrl = buildEmailPhotoUrl(options.heroPhotoUrl)
  const recipients = Array.isArray(options.to) ? options.to : [options.to]

  // Send to each family member individually so unsubscribe links are personalised
  for (const email of recipients) {
    try {
      const unsubscribeUrl = `${tributeUrl}?unsubscribe=anniversary&email=${encodeURIComponent(email)}`
      const result = await getResend().emails.send({
        from: `Forever Remembered <${FROM}>`,
        to: email,
        replyTo: 'support@foreverremembered.ai',
        subject: `Remembering ${options.subjectName} today 🌹`,
        react: AnniversaryReminderEmail({
          subjectName: options.subjectName,
          tributeUrl,
          reflection: options.reflection,
          occasion: options.occasion,
          heroPhotoUrl,
          unsubscribeUrl,
        }),
      })

      if ('error' in result && result.error) {
        const err = result.error as { message?: string }
        console.error(`[email] Anniversary reminder error for ${email} tribute=${options.tributeSlug}:`, err.message)
        continue
      }

      if ('data' in result && result.data?.id) {
        console.log(`[email] Anniversary reminder sent to ${email} — id=${result.data.id} tribute=${options.tributeSlug}`)
      }
    } catch (error) {
      console.error(`[email] Failed to send anniversary reminder to ${email} tribute=${options.tributeSlug}:`, error)
      // Don't throw — continue sending to other recipients
    }
  }
}

/**
 * Send order confirmation email after successful Stripe payment
 */
export async function sendOrderConfirmationEmail(options: {
  to: string
  subjectName: string
  tributeSlug: string
  tier: 'keep' | 'cherish' | 'cherish_monthly' | 'cherish_annual' | 'legacy' | 'pdf'
  amountCents: number
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('placeholder')) {
    console.warn('Resend not configured — skipping order confirmation email')
    return
  }

  const tributeUrl = `${BASE_URL}/tribute/${options.tributeSlug}`
  const amountFormatted = `$${(options.amountCents / 100).toFixed(0)}`

  // Map new tier names to legacy display labels for the email template
  const tierLabelMap: Record<string, string> = {
    cherish_monthly: 'Cherish (Monthly)',
    cherish_annual: 'Cherish (Annual)',
    legacy: 'Legacy',
    pdf: 'PDF Download',
    keep: 'Keep',
    cherish: 'Cherish',
  }
  const tierLabel = tierLabelMap[options.tier] || options.tier

  // Map new tiers to the legacy tier enum that OrderConfirmationEmail accepts
  const tierForEmail = (
    options.tier === 'cherish_monthly' || options.tier === 'cherish_annual'
      ? 'cherish'
      : options.tier === 'pdf'
        ? 'keep'
        : (options.tier as 'keep' | 'cherish' | 'legacy' | 'cherish_monthly' | 'cherish_annual' | 'pdf')
  )

  try {
    await getResend().emails.send({
      from: `Forever Remembered <${FROM}>`,
      to: options.to,
      replyTo: 'support@foreverremembered.ai',
      subject: `Your ${tierLabel} order for ${options.subjectName} is confirmed ✨`,
      react: OrderConfirmationEmail({
        subjectName: options.subjectName,
        tributeUrl,
        tier: tierForEmail,
        amountFormatted,
        customerEmail: options.to,
      }),
    })
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
    // Don't throw — email failure shouldn't block order processing
  }
}
