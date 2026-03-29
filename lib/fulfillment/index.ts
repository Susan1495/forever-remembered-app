/**
 * Fulfillment Pipeline — Entry Point
 *
 * Called from the Stripe webhook handler after checkout.session.completed.
 * Routes to the correct tier handler (tier1 / tier2) and handles errors.
 *
 * Usage:
 *   import { runFulfillment } from '@/lib/fulfillment'
 *   await runFulfillment({ orderId, tributeId, tributeSlug, tier, customerEmail })
 *
 * This is a thin orchestration layer. Tier-specific logic lives in:
 *   lib/fulfillment/tier1.ts  — Keep ($39)
 *   lib/fulfillment/tier2.ts  — Cherish ($127)
 *   lib/fulfillment/pdf.ts    — Puppeteer PDF generation
 *
 * The legacy tier ($397) continues to use the existing trigger.ts handler
 * which calls generatePrintReadyPDF from generate-pdf.tsx (react-pdf).
 */

import { updateOrderStatus } from '@/lib/db/orders'
import { fulfillTier1 } from '@/lib/fulfillment/tier1'
import { fulfillTier2 } from '@/lib/fulfillment/tier2'
// Legacy tier uses the original trigger (react-pdf based)
import { triggerFulfillment as triggerLegacyFulfillment } from '@/lib/fulfillment/trigger'

export interface FulfillmentInput {
  orderId: string
  tributeId: string
  tributeSlug: string
  tier: 'keep' | 'cherish' | 'legacy'
  customerEmail: string
}

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

  console.log(`${tag} Starting fulfillment pipeline...`)

  try {
    switch (tier) {
      case 'keep':
        await fulfillTier1({ orderId, tributeId, tributeSlug, customerEmail })
        break

      case 'cherish':
        await fulfillTier2({ orderId, tributeId, tributeSlug, customerEmail })
        break

      case 'legacy':
        // Legacy tier uses the battle-tested trigger.ts handler
        await triggerLegacyFulfillment({ orderId, tributeId, tributeSlug, tier, customerEmail })
        break

      default: {
        // TypeScript exhaustiveness check
        const _exhaustive: never = tier
        throw new Error(`Unknown fulfillment tier: ${String(_exhaustive)}`)
      }
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
