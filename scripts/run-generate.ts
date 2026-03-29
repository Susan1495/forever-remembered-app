/**
 * One-shot script: manually trigger generation for a stuck tribute.
 * Usage: TRIBUTE_ID=<id> npx tsx scripts/run-generate.ts
 */

// Inject real credentials before any imports use them
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pwncmufflmxehjdrhfyn.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_fyhwPfe50bOCTkO_RxfSgA_6UyGTGLw'
process.env.OPENAI_API_KEY = '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'
process.env.NEXT_PUBLIC_URL = 'https://foreverremembered.ai'

const tributeId = process.env.TRIBUTE_ID || 'b7748111-75b7-4f68-b569-0d60c8273049'

import { generateTribute } from '../lib/ai/generate-tribute'
import { getTributeById } from '../lib/db/tributes'

async function main() {
  console.log(`Starting generation for tribute: ${tributeId}`)

  const tribute = await getTributeById(tributeId)
  if (!tribute) {
    console.error('Tribute not found!')
    process.exit(1)
  }
  console.log(`Found tribute: ${tribute.subject_name} (slug: ${tribute.slug}, status: ${tribute.status})`)

  await generateTribute(tributeId)

  // Check final status
  const updated = await getTributeById(tributeId)
  console.log(`Generation complete. Final status: ${updated?.status}`)
}

main().catch(err => {
  console.error('Generation failed:', err)
  process.exit(1)
})
