/**
 * DALL-E 3 placeholder art generation
 * Used when no photos are uploaded
 */

import OpenAI from 'openai'
import type { AITheme } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate AI placeholder art for tributes with no photos
 * Returns a public URL to the generated image
 */
export async function generatePlaceholderArt(
  tribute: {
    subject_name: string
    relationship?: string | null
    subject_age_group?: string | null
  },
  themes: AITheme[]
): Promise<string> {
  // Return placeholder if OpenAI not configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
    return '/images/default-memorial-art.jpg'
  }

  const themeDescription = getThemeDescription(themes, tribute.relationship, tribute.subject_age_group)

  const prompt = `A beautiful, warm, painterly watercolor memorial illustration. 
Abstract and impressionistic — NOT a realistic face or person. 
${themeDescription}
Suitable for a dignified memorial tribute. No text. No words. No letters.
Soft, warm light. Gentle brush strokes. High quality fine art.`

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1024x1024',
    quality: 'standard',
    n: 1,
  })

  const imageUrl = response.data?.[0]?.url
  if (!imageUrl) throw new Error('No image generated')

  return imageUrl
}

function getThemeDescription(
  themes: AITheme[],
  relationship: string | null | undefined,
  ageGroup: string | null | undefined
): string {
  if (relationship?.toLowerCase() === 'pet') {
    return 'Soft amber and gold tones. Suggest the warmth and comfort of an animal companion. Gentle floating light. Peaceful.'
  }

  if (ageGroup === 'infant' || ageGroup === 'child') {
    return 'Very soft pastel tones — gentle blush, pale gold, soft white. Delicate and tender. Suggest innocence and love. Floating petals or gentle stars.'
  }

  const themeSet = new Set(themes)
  
  if (themeSet.has('nature')) {
    return 'Soft green and blush tones. Suggest a garden in quiet bloom. Watercolor flowers, gentle light filtering through leaves.'
  }

  if (themeSet.has('faith')) {
    return 'Warm amber light, deep navy. Suggest quiet reverence and peace. Candle glow, soft rays of light.'
  }

  if (themeSet.has('adventure')) {
    return 'Open sky, warm horizon light. Suggest freedom and wide spaces. Soft blues, warm gold.'
  }

  // Default: warm amber memorial
  return 'Soft amber and gold tones, gentle brush strokes. Suggest warmth, memory, and enduring love. Floating embers or gentle light.'
}
