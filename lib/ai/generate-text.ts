/**
 * Tribute text generation using GPT-4o
 * Generates headline, biography sections, and pull quote
 */

import OpenAI from 'openai'
import type { TributeBody } from '@/lib/types'
import type { AITheme } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface GeneratedTributeText {
  headline: string
  body: TributeBody
  pullQuote: string
}

interface GenerateTextOptions {
  subject_name: string
  subject_bio?: string | null
  extra_context?: string | null
  relationship?: string | null
  birth_date?: string | null
  death_date?: string | null
  is_living: boolean
  subject_age_group: string | null
  photoObservations?: string | null
  themes?: AITheme[]
}

/**
 * Generate tribute text using GPT-4o
 * Handles edge cases: living person, child/infant, pet
 */
export async function generateTributeText(
  options: GenerateTextOptions
): Promise<GeneratedTributeText> {
  const {
    subject_name,
    subject_bio,
    extra_context,
    relationship,
    birth_date,
    death_date,
    is_living,
    subject_age_group,
    photoObservations,
    themes,
  } = options

  // Return placeholder if OpenAI not configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
    return generateFallbackText(subject_name, is_living, subject_age_group)
  }

  // Build tone modifier based on edge cases
  const toneNote = buildToneNote(is_living, subject_age_group)

  // Build photo context if available
  const photoContext = photoObservations
    ? `\nPhoto observations: ${photoObservations}\nThemes detected: ${themes?.join(', ') || 'gentle'}`
    : ''

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1200,
    messages: [
      {
        role: 'system',
        content: `You are a compassionate writer specializing in memorial tributes for grieving families.
Write with warmth, dignity, and specificity. Avoid all clichés: never use "passed away peacefully," 
"is in a better place," "gone too soon," "at peace now," "left us," or "angel." 
Make every tribute feel personal and specific — not generic.
${toneNote}
Return only valid JSON.`,
      },
      {
        role: 'user',
        content: `Create a tribute for ${subject_name}.

Family's words: "${subject_bio || 'A beloved person, deeply loved.'}"
${extra_context ? `Additional context: "${extra_context}"` : ''}
${photoContext}
${relationship ? `The tribute creator's relationship: ${relationship}` : ''}
${birth_date ? `Born: ${birth_date}` : ''}
${death_date ? `Passed: ${death_date}` : ''}

Return this JSON exactly:
{
  "headline": "<one evocative tagline, 8-14 words — the essence of who they were, NOT their name>",
  "body": {
    "opening": "<2-3 sentences, deeply personal opening that names their most distinctive quality>",
    "life": "<3-4 sentences about who they were — their personality, passions, the texture of daily life with them>",
    "legacy": "<2-3 sentences about what they leave behind in the people who loved them>",
    "closing": "<1-2 sentences, a gentle, non-cliché closing — specific to this person>"
  },
  "pullQuote": "<one memorable sentence from the body text, 15-30 words, stands alone beautifully>"
}`,
      },
    ],
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No response from text generation')

  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    
    const parsed = JSON.parse(jsonMatch[0]) as GeneratedTributeText
    
    // Validate structure
    if (!parsed.headline || !parsed.body || !parsed.pullQuote) {
      throw new Error('Invalid response structure')
    }

    return parsed
  } catch (e) {
    console.error('Failed to parse text generation response:', content, e)
    return generateFallbackText(subject_name, is_living, subject_age_group)
  }
}

function buildToneNote(is_living: boolean, age_group: string | null): string {
  if (is_living) {
    return 'This person is STILL LIVING. Write entirely in present tense. Frame as a celebration, not a memorial. Use "is" not "was".'
  }
  if (age_group === 'infant') {
    return 'This tribute is for an infant. Write very gently and briefly. Focus only on love, presence, and what they brought — not accomplishments or a life lived. Write from a place of deep love for brief, precious time.'
  }
  if (age_group === 'child') {
    return 'This tribute is for a child. Write gently and briefly. Focus only on love, presence, and what they brought — not accomplishments or a life lived in a traditional sense. No references to career, legacy in a conventional sense, or "long life".'
  }
  if (age_group === 'pet') {
    return 'This tribute is for a beloved pet. Write warmly and without formality. Focus on companionship, joy, and the specific bond described. Acknowledge how deeply this companion was loved.'
  }
  return ''
}

function generateFallbackText(
  subjectName: string,
  isLiving: boolean,
  ageGroup: string | null
): GeneratedTributeText {
  if (isLiving) {
    return {
      headline: `A person who makes the world better by being in it`,
      body: {
        opening: `${subjectName} is someone whose presence makes any room feel warmer. The kind of person you feel lucky to know.`,
        life: `Through the years, ${subjectName} has touched countless lives with care, humor, and a generosity that never asks for anything in return. The small moments — a phone call, a shared meal, a piece of advice — those are what people remember most.`,
        legacy: `The mark ${subjectName} leaves on the people around them isn't something you can put into words easily. It's something you feel.`,
        closing: `Here's to ${subjectName}, and to every moment still ahead.`,
      },
      pullQuote: `The mark they leave on the people around them isn't something you can put into words — it's something you feel.`,
    }
  }

  if (ageGroup === 'child' || ageGroup === 'infant') {
    return {
      headline: `Loved wholly, remembered always`,
      body: {
        opening: `${subjectName} came into this world and made it more tender. Every moment with them was a gift given fully, received wholly.`,
        life: `What words can hold what ${subjectName} was? There are moments that leave marks too deep for language — only for the heart.`,
        legacy: `${subjectName} changed the people who loved them. That change doesn't end. It keeps going, quietly, in everything.`,
        closing: `Some lives don't need length to be complete. ${subjectName}'s was one of them.`,
      },
      pullQuote: `Some lives don't need length to be complete.`,
    }
  }

  if (ageGroup === 'pet') {
    return {
      headline: `A companion who knew us better than we knew ourselves`,
      body: {
        opening: `${subjectName} had a way of making the whole world feel smaller, in the best possible way — manageable, warmer, less alone.`,
        life: `There are things only a beloved companion understands. The particular way they looked at you. The way they knew exactly when to be close. ${subjectName} knew all of it.`,
        legacy: `The quiet left behind when ${subjectName} is gone is real. But so is every memory — every walk, every moment of being chosen by them.`,
        closing: `What a life they lived. What love they gave.`,
      },
      pullQuote: `There are things only a beloved companion understands — and they understood all of them.`,
    }
  }

  return {
    headline: `A life lived with love, remembered always`,
    body: {
      opening: `${subjectName} was the kind of person who left a mark on everything they touched — not through grand gestures, but through the steady, daily way they showed up for the people they loved.`,
      life: `Those who knew ${subjectName} well remember the particular quality of their attention: the way they listened, the way they laughed, the way they held their values quietly but completely.`,
      legacy: `What ${subjectName} built doesn't live in things. It lives in the people they shaped — the ones who still hear their voice in difficult moments, who find themselves thinking "they would have loved this."`,
      closing: `${subjectName} is gone from our sight. Not from our lives.`,
    },
    pullQuote: `The people they loved still hear their voice in difficult moments, still think: "they would have loved this."`,
  }
}
