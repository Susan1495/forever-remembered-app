/**
 * Photo analysis using GPT-4o Vision
 * Analyzes uploaded photos to determine hero photo, captions, and themes
 */

import OpenAI from 'openai'
import type { AITheme } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface PhotoAnalysis {
  heroPhotoIndex: number
  captions: string[]
  themes: AITheme[]
  photoObservations: string
}

/**
 * Analyze tribute photos with GPT-4o Vision
 */
export async function analyzePhotos(
  photoUrls: string[],
  tribute: {
    subject_name: string
    subject_bio?: string | null
    relationship?: string | null
    birth_date?: string | null
    death_date?: string | null
  }
): Promise<PhotoAnalysis> {
  // Skip if API key not configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
    return {
      heroPhotoIndex: 0,
      captions: photoUrls.map(() => ''),
      themes: ['gentle'],
      photoObservations: 'A person remembered with love.',
    }
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 800,
    messages: [
      {
        role: 'system',
        content: `You are analyzing memorial photos to help create a beautiful tribute for a grieving family. 
Be respectful, warm, and observant. Focus on the person's apparent personality, key life moments, 
visible relationships, and the emotional tone of each image. Never mention technical photo quality.
Return only valid JSON.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `The family describes ${tribute.subject_name} as: "${tribute.subject_bio || 'A beloved person'}"
Relationship to uploader: ${tribute.relationship || 'loved one'}
${tribute.birth_date ? `Born: ${tribute.birth_date}` : ''}
${tribute.death_date ? `Passed: ${tribute.death_date}` : ''}

Analyze these photos and return this JSON exactly:
{
  "heroPhotoIndex": <0-based index of photo best suited as hero, or 0 if uncertain>,
  "captions": [<caption per photo, max 20 words, warm and specific — parallel array to photos>],
  "themes": [<2-3 from: gentle, joyful, faith, nature, humor, strength, family, adventure, wisdom, love>],
  "photoObservations": "<2-3 sentences describing what you observe about this person's spirit and life from the photos>"
}`,
          },
          ...photoUrls.map(url => ({
            type: 'image_url' as const,
            image_url: { url, detail: 'low' as const },
          })),
        ],
      },
    ],
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No response from photo analysis')

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    
    const parsed = JSON.parse(jsonMatch[0]) as PhotoAnalysis
    
    // Validate and sanitize
    return {
      heroPhotoIndex: Math.min(
        Math.max(0, parsed.heroPhotoIndex || 0),
        photoUrls.length - 1
      ),
      captions: parsed.captions || photoUrls.map(() => ''),
      themes: parsed.themes || ['gentle'],
      photoObservations: parsed.photoObservations || '',
    }
  } catch (e) {
    console.error('Failed to parse photo analysis response:', content, e)
    return {
      heroPhotoIndex: 0,
      captions: photoUrls.map(() => ''),
      themes: ['gentle'],
      photoObservations: '',
    }
  }
}
