/**
 * Test Puppeteer PDF generation
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pwncmufflmxehjdrhfyn.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_TMQit2z0vpoPZGdzCKIrCA_il9u9-zN'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_fyhwPfe50bOCTkO_RxfSgA_6UyGTGLw'
process.env.NEXT_PUBLIC_URL = 'https://foreverremembered.ai'

import { generateMemorialCard, generateMemorialBook } from '../lib/fulfillment/pdf'
import type { Tribute, TributePhoto } from '../lib/types'

const testTribute: Tribute = {
  id: 'test', slug: 'test', creator_email: null, creator_ip: null,
  subject_name: 'Margaret Johnson', subject_bio: 'A beloved grandmother.',
  birth_date: '1942-03-15', death_date: '2024-11-20',
  relationship: 'grandmother', extra_context: null, is_living: false,
  subject_age_group: 'adult',
  ai_headline: 'A Life of Love', ai_pull_quote: 'She made everyone feel welcome.',
  ai_body: { opening: 'Margaret was beloved by all.', life: 'She taught for 30 years.', legacy: 'Her love lives on.', closing: 'We remember her always.' },
  ai_themes: ['family'], hero_photo_idx: 0, template_id: 'golden-hour',
  ai_photo_captions: null, status: 'published', view_count: 0, candle_count: 0,
  created_at: new Date().toISOString(), published_at: new Date().toISOString(), expires_at: null,
  tier: 'keep', custom_subdomain: null
}
const photos: TributePhoto[] = []

async function main() {
  console.log('Testing Puppeteer PDF generation...\n')

  console.log('Generating 1-page memorial card...')
  const t1 = Date.now()
  const cardBuf = await generateMemorialCard(testTribute, photos)
  console.log(`✓ Card PDF: ${(cardBuf.length/1024).toFixed(1)} KB in ${Date.now()-t1}ms`)

  console.log('Generating 8-page memorial book...')
  const t2 = Date.now()
  const bookBuf = await generateMemorialBook(testTribute, photos)
  console.log(`✓ Book PDF: ${(bookBuf.length/1024).toFixed(1)} KB in ${Date.now()-t2}ms`)

  console.log('\n✅ Puppeteer PDF generation PASSED')
}
main().catch(e => { console.error('❌ FAILED:', e.message); process.exit(1) })
