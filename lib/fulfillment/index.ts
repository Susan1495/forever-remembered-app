/**
 * Fulfillment Pipeline — Entry Point
 *
 * Called from the Stripe webhook handler after checkout.session.completed.
 * Routes to the correct tier handler and handles errors.
 *
 * Usage:
 *   import { runFulfillment } from '@/lib/fulfillment'
 *   await runFulfillment({ orderId, tributeId, tributeSlug, tier, customerEmail })
 *
 * PDF rendering strategy:
 * ─────────────────────────────────────────────────────────────────────
 * On Vercel (VERCEL=1): all tiers use trigger.ts → @react-pdf/renderer
 *   • Pure Node.js, no browser binary, works within 50MB function limit
 *   • Produces clean, printable PDFs — good quality for all tiers
 *
 * On self-hosted / local dev: tier1/tier2 use Puppeteer HTML→PDF
 *   • Higher visual quality (CSS gradients, custom layout, etc.)
 *   • Uses @sparticuz/chromium on Lambda-compatible environments
 *
 * Legacy tier ($397) always uses trigger.ts (react-pdf) for maximum
 * reliability — it produces the high-res print-ready variant via
 * generatePrintReadyPDF which is already tuned for professional print.
 * ─────────────────────────────────────────────────────────────────────
 */

import { updateOrderStatus } from '@/lib/db/orders'
import { triggerFulfillment } from '@/lib/fulfillment/trigger'

export interface FulfillmentInput {
  orderId: string
  tributeId: string
  tributeSlug: string
  tier: 'keep' | 'cherish' | 'legacy'
  customerEmail: string
}

/** True when running on Vercel serverless infrastructure */
const IS_VERCEL = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME

/**
 * Run the fulfillment pipeline for a paid order.
 *
 * Idempotent: uses updateOrderStatus to mark final state regardless of
 * whether the operation succeeds or fails.
 *
 * On failure, the order is marked 'failed' so it can be retried via
 * POST /api/fulfillment/retry.
 */
export async function runFulfillment(input: FulfillmentInput): Promise<void> {
  const { orderId, tributeId, tributeSlug, tier, customerEmail } = input
  const tag = `[fulfillment:${orderId}:${tier}]`

  console.log(`${tag} Starting fulfillment pipeline... (env: ${IS_VERCEL ? 'vercel' : 'local'})`)

  try {
    if (!IS_VERCEL && (tier === 'keep' || tier === 'cherish')) {
      // Local / non-serverless: use Puppeteer-based HTML→PDF for richer output
      const { fulfillTier1 } = await import('@/lib/fulfillment/tier1')
      const { fulfillTier2 } = await import('@/lib/fulfillment/tier2')

      if (tier === 'keep') {
        await fulfillTier1({ orderId, tributeId, tributeSlug, customerEmail })
      } else {
        await fulfillTier2({ orderId, tributeId, tributeSlug, customerEmail })
      }
    } else {
      // Vercel / Lambda / legacy tier: use @react-pdf/renderer (no browser required)
      await triggerFulfillment({ orderId, tributeId, tributeSlug, tier, customerEmail })
    }

    console.log(`${tag} ✓ Fulfillment complete.`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`${tag} ✗ Fulfillment failed: ${message}`)

    // Mark order as failed — preserves error context for debugging + retry
    await updateOrderStatus(orderId, 'failed', {
      error: message,
      failedAt: new Date().toISOString(),
    }).catch((dbErr: unknown) => {
      console.error(`${tag} Failed to update order status to 'failed':`, dbErr)
    })

    throw error // Re-throw so webhook can log it
  }
}

// Re-export tier helpers for convenience (e.g. direct use in retry endpoint)
export { fulfillTier1 } from '@/lib/fulfillment/tier1'
export { fulfillTier2 } from '@/lib/fulfillment/tier2'
