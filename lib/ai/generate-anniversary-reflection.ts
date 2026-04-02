/**
 * generateAnniversaryReflection
 *
 * Uses GPT-4o to produce a warm 2-3 sentence reflection or short poem
 * about a person, tailored to the occasion (birthday, passing anniversary,
 * or a custom date like a wedding anniversary).
 *
 * Tone: celebratory of life — NOT mournful or sad.
 *
 * Uses process.env.OPENAI_API_KEY — never hardcode credentials.
 */

import type { Tribute } from '@/lib/types'

export type AnniversaryDateType = 'birthday' | 'passing' | 'custom'

/**
 * Build the body of the tribute's AI content for context injection.
 * Falls back gracefully if ai_body is null.
 */
function tributeStory(tribute: Tribute): string {
  if (!tribute.ai_body) return ''
  const { opening, life, legacy, closing } = tribute.ai_body
  return [opening, life, legacy, closing].filter(Boolean).join(' ')
}

/**
 * Return a short occasion description for the prompt.
 */
function occasionDescription(dateType: AnniversaryDateType, dateLabel?: string): string {
  if (dateType === 'birthday') return "their birthday"
  if (dateType === 'passing') return "the anniversary of their passing"
  if (dateType === 'custom' && dateLabel) return `the anniversary of "${dateLabel}"`
  return "a meaningful date in their life"
}

export async function generateAnniversaryReflection(
  tribute: Tribute,
  dateType: AnniversaryDateType,
  dateLabel?: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[ai/anniversary] OPENAI_API_KEY not set — using fallback reflection')
    return fallbackReflection(tribute.subject_name, dateType, dateLabel)
  }

  const occasion = occasionDescription(dateType, dateLabel)
  const story = tributeStory(tribute)
  const storyContext = story
    ? `\n\nHere is a short biography of ${tribute.subject_name}:\n"${story.slice(0, 800)}"`
    : ''

  const systemPrompt = `You are a compassionate, warm writer who crafts brief, heartfelt remembrances for memorial tribute pages. Your writing celebrates life — it is warm, comforting, and uplifting, never sad or mournful. You write with the gentle warmth of a loved one.`

  const userPrompt = `Today is ${occasion} for ${tribute.subject_name}.${storyContext}

Write a warm, celebratory 2-3 sentence reflection or short poem to send to their family today.

Guidelines:
- Celebrate who they were and the joy they brought to the world
- Reference their name naturally
- Keep it personal and genuine, not generic
- Tone: warm, loving, comforting — NOT sad, NOT religious unless implied by biography
- Length: 2-3 sentences or 4-6 short poem lines maximum
- Do NOT include any greeting, sign-off, or quotation marks — just the reflection itself`

  try {
    // Dynamic import to avoid breaking build when key is absent
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 180,
      temperature: 0.85,
    })

    const text = response.choices[0]?.message?.content?.trim()
    if (!text) {
      console.warn('[ai/anniversary] Empty response from OpenAI — using fallback')
      return fallbackReflection(tribute.subject_name, dateType, dateLabel)
    }

    return text
  } catch (err) {
    console.error('[ai/anniversary] OpenAI error:', err)
    return fallbackReflection(tribute.subject_name, dateType, dateLabel)
  }
}

/**
 * Fallback reflection used when OpenAI is unavailable.
 * Warm and graceful — a safe default.
 */
function fallbackReflection(
  name: string,
  dateType: AnniversaryDateType,
  dateLabel?: string
): string {
  if (dateType === 'birthday') {
    return `Today we celebrate the life of ${name} — a soul who brought light and love into the world. Happy birthday. Your memory is a gift we carry with us always.`
  }
  if (dateType === 'passing') {
    return `Today we remember ${name} and all the ways they shaped our lives. Their laughter, their wisdom, their love — these are the gifts that never fade. Holding you in our hearts today and always.`
  }
  const label = dateLabel ? ` — "${dateLabel}"` : ''
  return `Today marks a meaningful day${label} in the story of ${name}'s life. We pause to remember, to celebrate, and to feel grateful for every moment shared. Their memory lives on in all of us.`
}
