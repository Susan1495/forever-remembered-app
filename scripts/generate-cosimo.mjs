/**
 * Standalone generation script for Cosimo Carnevale.
 * Admin-triggered, so we skip the moderation step.
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const SUPABASE_URL = 'https://pwncmufflmxehjdrhfyn.supabase.co'
const SUPABASE_SERVICE_KEY = 'sb_secret_fyhwPfe50bOCTkO_RxfSgA_6UyGTGLw'
const OPENAI_KEY = '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'
const TRIBUTE_ID = 'b7748111-75b7-4f68-b569-0d60c8273049'

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})
const openai = new OpenAI({ apiKey: OPENAI_KEY })

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function run() {
  // Fetch tribute
  const { data: tribute, error } = await db.from('tributes').select('*').eq('id', TRIBUTE_ID).single()
  if (error || !tribute) { console.error('Tribute not found', error); process.exit(1) }
  
  console.log(`Tribute: ${tribute.subject_name} | slug: ${tribute.slug} | status: ${tribute.status}`)

  // Fetch photos
  const { data: photos } = await db.from('tribute_photos').select('*').eq('tribute_id', TRIBUTE_ID)
  console.log(`Photos: ${photos?.length ?? 0}`)

  // Generate tribute text
  console.log('Generating tribute text...')
  
  const contextParts = [
    tribute.subject_bio ? `Bio: ${tribute.subject_bio}` : null,
    tribute.extra_context ? `Additional context: ${tribute.extra_context}` : null,
    tribute.relationship ? `Relationship to creator: ${tribute.relationship}` : null,
    tribute.birth_date ? `Born: ${tribute.birth_date}` : null,
    tribute.death_date ? `Died: ${tribute.death_date}` : null,
  ].filter(Boolean)
  
  const context = contextParts.length > 0 ? contextParts.join('\n') : '(No additional information provided)'
  const isLiving = tribute.is_living
  const subjectDesc = isLiving ? 'a living person' : 'someone who has passed away'

  let completion
  let attempts = 0
  while (attempts < 3) {
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a compassionate writer creating heartfelt tribute pages. Write with warmth, dignity, and genuine care. The tribute is for ${subjectDesc}.`
          },
          {
            role: 'user',
            content: `Create a tribute for ${tribute.subject_name}.

${context}

Return a JSON object with exactly these fields:
- headline: A warm, memorable headline (10-15 words)  
- pullQuote: An inspiring quote or sentiment (20-30 words)
- body: An object with keys: intro (2-3 sentences), legacy (2-3 sentences), closing (1-2 sentences)

Return only valid JSON, no markdown.`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      })
      break
    } catch (e) {
      attempts++
      if (e.status === 429 && attempts < 3) {
        console.log(`  Rate limited, waiting 15s... (attempt ${attempts}/3)`)
        await sleep(15000)
      } else {
        throw e
      }
    }
  }

  let tributeText
  try {
    tributeText = JSON.parse(completion.choices[0].message.content)
  } catch (e) {
    console.error('Failed to parse AI response:', completion.choices[0].message.content)
    process.exit(1)
  }

  console.log(`  Headline: ${tributeText.headline}`)
  console.log(`  Pull quote: ${tributeText.pullQuote}`)

  // Select template
  const templateId = isLiving ? 'golden-hour' : 'classic'

  // Update tribute to published
  console.log('Updating tribute to published...')
  const { error: updateError } = await db.from('tributes').update({
    ai_headline: tributeText.headline,
    ai_pull_quote: tributeText.pullQuote,
    ai_body: tributeText.body,
    ai_themes: ['gentle', 'family'],
    ai_photo_captions: {},
    hero_photo_idx: 0,
    template_id: templateId,
    status: 'published',
    published_at: new Date().toISOString(),
  }).eq('id', TRIBUTE_ID)

  if (updateError) {
    console.error('Failed to update tribute:', updateError)
    process.exit(1)
  }

  // Verify
  const { data: updated } = await db.from('tributes').select('status, ai_headline, slug').eq('id', TRIBUTE_ID).single()
  console.log(`\n✅ Done! Status: ${updated.status}`)
  console.log(`   Headline: ${updated.ai_headline}`)
  console.log(`   URL: https://foreverremembered.ai/tribute/${updated.slug}`)
}

run().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
