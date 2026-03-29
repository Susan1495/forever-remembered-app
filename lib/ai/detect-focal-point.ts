/**
 * AI-powered focal point detection for hero photos
 * Uses GPT-4o Vision to find where the main subject's face is in an image.
 * Returns { x, y } as fractions 0.0–1.0 from top-left.
 * Falls back to { x: 0.5, y: 0.25 } (top-center) if detection fails.
 */

import OpenAI from 'openai'

const DEFAULT_FOCAL_POINT = { x: 0.5, y: 0.25 }

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface FocalPoint {
  x: number // 0.0 (left) → 1.0 (right)
  y: number // 0.0 (top)  → 1.0 (bottom)
}

/**
 * Detect the focal point of the main subject in a photo.
 * @param photoUrl - Publicly accessible URL of the photo
 * @returns Focal point { x, y } in 0.0–1.0 space, or safe default on failure
 */
export async function detectFocalPoint(photoUrl: string): Promise<FocalPoint> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
    return DEFAULT_FOCAL_POINT
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 60,
      messages: [
        {
          role: 'system',
          content:
            'You are a precise image analysis tool. Respond only with valid JSON and nothing else.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Locate the main subject's face in this photo. Return the center of the face as x,y coordinates where (0,0) is the top-left corner and (1,1) is the bottom-right corner. If there is no face, return the visual center of interest instead.

Respond with ONLY this JSON (no markdown, no explanation):
{"x": <0.0-1.0>, "y": <0.0-1.0>}`,
            },
            {
              type: 'image_url',
              image_url: { url: photoUrl, detail: 'low' },
            },
          ],
        },
      ],
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      console.warn('[detectFocalPoint] Empty response, using default')
      return DEFAULT_FOCAL_POINT
    }

    // Extract JSON (handle any accidental surrounding text)
    const jsonMatch = content.match(/\{[^}]+\}/)
    if (!jsonMatch) {
      console.warn('[detectFocalPoint] No JSON in response:', content)
      return DEFAULT_FOCAL_POINT
    }

    const parsed = JSON.parse(jsonMatch[0]) as { x: unknown; y: unknown }

    const x = Number(parsed.x)
    const y = Number(parsed.y)

    if (isNaN(x) || isNaN(y) || x < 0 || x > 1 || y < 0 || y > 1) {
      console.warn('[detectFocalPoint] Out-of-range values:', parsed)
      return DEFAULT_FOCAL_POINT
    }

    return { x, y }
  } catch (error) {
    console.error('[detectFocalPoint] Detection failed, using default:', error)
    return DEFAULT_FOCAL_POINT
  }
}
