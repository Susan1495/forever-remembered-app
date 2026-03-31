/**
 * Test script for the fulfillment pipeline
 *
 * Run with:
 *   cd app && npx tsx scripts/test-fulfillment.ts
 *
 * This script:
 * 1. Fetches a real tribute from the DB
 * 2. Generates a PDF for it
 * 3. Uploads to Supabase storage
 * 4. Prints the download URL
 *
 * Does NOT send emails or create order records.
 * Safe to run any time.
 */

// Set env vars BEFORE any module imports (avoids module init issues)
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pwncmufflmxehjdrhfyn.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_TMQit2z0vpoPZGdzCKIrCA_il9u9-zN'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_fyhwPfe50bOCTkO_RxfSgA_6UyGTGLw'

import { createServerClient } from '../lib/supabase'
import { getTributePhotos } from '../lib/db/photos'
import { generateTributePDF, generatePrintReadyPDF } from '../lib/fulfillment/generate-pdf'
import { uploadPDF } from '../lib/fulfillment/storage'
import type { Tribute } from '../lib/types'

async function main() {
  console.log('🧪 Testing fulfillment pipeline...\n')

  // 1. Fetch a tribute from DB
  const db = createServerClient()
  const { data: tributes, error } = await db
    .from('tributes')
    .select('*')
    .eq('status', 'published')
    .limit(1)
    .single()

  let tribute: Tribute

  if (error || !tributes) {
    console.log('No published tribute found. Using test tribute...')
    tribute = {
      id: 'test-00000000-0000-0000-0000-000000000001',
      slug: 'test-tribute',
      creator_email: 'test@test.com',
      creator_ip: null,
      subject_name: 'Margaret Elizabeth Johnson',
      subject_bio: 'A beloved grandmother, community leader, and tireless advocate for the arts.',
      birth_date: '1942-03-15',
      death_date: '2024-11-20',
      relationship: 'grandmother',
      extra_context: null,
      is_living: false,
      subject_age_group: 'adult',
      ai_headline: 'A Life Illuminated by Love and Laughter',
      ai_pull_quote: 'She made everyone she met feel like the most important person in the room.',
      ai_body: {
        opening:
          'Margaret Elizabeth Johnson arrived in this world on a crisp March morning in 1942, the second of six children born to William and Dorothy Chen in Savannah, Georgia. From her earliest days, those around her sensed something extraordinary in the way she moved through the world — with a quiet grace and an unhurried attention to the people around her.',
        life: 'Her life was a tapestry woven from decades of service, laughter, and an unwavering commitment to the people she loved. After graduating from Savannah State University in 1964, Margaret dedicated thirty years to teaching second grade at Lincoln Elementary, where generations of children learned not just to read and write, but to see the world through kinder eyes.',
        legacy:
          "Margaret's legacy lives on in the hearts of the hundreds of students she taught, the community garden she founded, the quilts she lovingly made for every new grandchild. She demonstrated that a life well-lived is measured not in accolades but in the small, daily acts of care that ripple outward in ways we may never fully see.",
        closing:
          "We hold her close in memory — in the smell of cornbread on Sunday mornings, in the patience she modeled when we were impatient, in the love she gave without condition or measure. Margaret is not gone; she is woven into us. And we will carry her forward.",
      },
      ai_themes: ['family', 'love', 'wisdom'],
      hero_photo_idx: 0,
      template_id: 'golden-hour',
      ai_photo_captions: null,
      status: 'published',
      view_count: 0,
      candle_count: 0,
      created_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      generated_at: new Date().toISOString(),
      expires_at: null,
      tier: 'keep',
      custom_subdomain: null,
    }
  } else {
    tribute = tributes as Tribute
    console.log(`✓ Found tribute: "${tribute.subject_name}" (${tribute.slug})\n`)
  }

  // 2. Load photos
  const photos = await getTributePhotos(tribute.id)
  console.log(`✓ Found ${photos.length} photos\n`)

  // 3. Generate standard PDF
  console.log('Generating standard memorial PDF...')
  const t1 = Date.now()
  const pdfBuffer = await generateTributePDF(tribute, photos)
  console.log(`✓ Standard PDF generated: ${(pdfBuffer.length / 1024).toFixed(1)} KB in ${Date.now() - t1}ms\n`)

  // 4. Upload to storage
  const testOrderId = `test-${Date.now()}`
  console.log(`Uploading to Supabase storage (order: ${testOrderId})...`)
  const t2 = Date.now()
  const downloadUrl = await uploadPDF(testOrderId, 'test-memorial.pdf', pdfBuffer)
  console.log(`✓ Uploaded in ${Date.now() - t2}ms`)
  console.log(`✓ Download URL: ${downloadUrl.substring(0, 80)}...\n`)

  // 5. Generate print-ready PDF
  console.log('Generating print-ready PDF (Legacy tier)...')
  const t3 = Date.now()
  const printPdfBuffer = await generatePrintReadyPDF(tribute, photos)
  console.log(
    `✓ Print-ready PDF generated: ${(printPdfBuffer.length / 1024).toFixed(1)} KB in ${Date.now() - t3}ms\n`
  )

  console.log('🎉 Fulfillment pipeline test PASSED!\n')
  console.log('Summary:')
  console.log(`  Standard PDF: ${(pdfBuffer.length / 1024).toFixed(1)} KB`)
  console.log(`  Print PDF:    ${(printPdfBuffer.length / 1024).toFixed(1)} KB`)
  console.log(`  Storage URL:  ${downloadUrl.substring(0, 60)}...`)
}

main().catch((err) => {
  console.error('❌ Test FAILED:', err)
  process.exit(1)
})
