/**
 * Content moderation using OpenAI Moderation API
 * Run before any AI generation pipeline
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class ModerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ModerationError'
  }
}

/**
 * Check text content against OpenAI moderation API
 * Throws ModerationError if flagged
 */
export async function moderateContent(
  subjectName: string,
  subjectBio?: string,
  extraContext?: string
): Promise<void> {
  // Skip if API key not configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
    console.warn('OpenAI not configured — skipping moderation')
    return
  }

  const inputText = [subjectName, subjectBio, extraContext]
    .filter(Boolean)
    .join('. ')

  if (!inputText.trim()) return

  const moderation = await openai.moderations.create({
    input: inputText,
    model: 'text-moderation-latest',
  })

  if (moderation.results[0].flagged) {
    console.warn('Content flagged by moderation API', {
      categories: moderation.results[0].categories,
    })
    throw new ModerationError('Content flagged by moderation')
  }
}
