/**
 * Database operations for upsell leads (email capture)
 */

import { createServerClient } from '@/lib/supabase'

export async function createUpsellLead(
  tributeId: string,
  email: string,
  trigger: string
): Promise<void> {
  const db = createServerClient()
  
  // Upsert — ignore duplicate email/tribute combo
  const { error } = await db
    .from('upsell_leads')
    .upsert(
      {
        tribute_id: tributeId,
        email: email.toLowerCase().trim(),
        trigger,
      },
      {
        onConflict: 'tribute_id,email',
        ignoreDuplicates: true,
      }
    )

  if (error) {
    throw new Error(`Failed to create upsell lead: ${error.message}`)
  }
}

export async function markUpsellLeadNotified(
  tributeId: string,
  email: string
): Promise<void> {
  const db = createServerClient()
  await db
    .from('upsell_leads')
    .update({ notified_at: new Date().toISOString() })
    .eq('tribute_id', tributeId)
    .eq('email', email.toLowerCase().trim())
}
