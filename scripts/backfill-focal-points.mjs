/**
 * Backfill focal point detection for existing tribute photos.
 * Usage:
 *   TRIBUTE_ID=<uuid> node scripts/backfill-focal-points.mjs
 *   Or without TRIBUTE_ID to process ALL photos missing focal points.
 *
 * Required env vars:
 *   OPENAI_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY
const TRIBUTE_ID = process.env.TRIBUTE_ID // Optional: limit to one tribute

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!OPENAI_KEY) {
  console.error('Missing OPENAI_API_KEY')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY)
const openai = new OpenAI({ apiKey: OPENAI_KEY })

const DEFAULT = { x: 0.5, y: 0.25 }

async function detectFocalPoint(photoUrl) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 60,
      messages: [
        {
          role: 'system',
          content: 'You are a precise image analysis tool. Respond only with valid JSON and nothing else.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Locate the main subject's face in this photo. Return the center of the face as x,y coordinates where (0,0) is the top-left corner and (1,1) is the bottom-right corner. If there is no face, return the visual center of interest instead.\n\nRespond with ONLY this JSON (no markdown, no explanation):\n{"x": <0.0-1.0>, "y": <0.0-1.0>}`,
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
    if (!content) return DEFAULT

    const jsonMatch = content.match(/\{[^}]+\}/)
    if (!jsonMatch) return DEFAULT

    const parsed = JSON.parse(jsonMatch[0])
    const x = Number(parsed.x)
    const y = Number(parsed.y)

    if (isNaN(x) || isNaN(y) || x < 0 || x > 1 || y < 0 || y > 1) return DEFAULT
    return { x, y }
  } catch (err) {
    console.error('  ✗ OpenAI error:', err.message)
    return DEFAULT
  }
}

async function main() {
  // Fetch photos missing focal points
  let query = db
    .from('tribute_photos')
    .select('id, tribute_id, cdn_url, focal_point_x, focal_point_y')
    .is('focal_point_x', null)

  if (TRIBUTE_ID) {
    query = query.eq('tribute_id', TRIBUTE_ID)
  }

  const { data: photos, error } = await query

  if (error) {
    console.error('Failed to fetch photos:', error)
    process.exit(1)
  }

  if (!photos || photos.length === 0) {
    console.log('No photos need backfilling.')
    return
  }

  console.log(`Found ${photos.length} photo(s) to process...\n`)

  for (const photo of photos) {
    console.log(`Processing photo ${photo.id} (tribute: ${photo.tribute_id})`)
    console.log(`  URL: ${photo.cdn_url}`)

    const focal = await detectFocalPoint(photo.cdn_url)
    console.log(`  Focal point: x=${focal.x.toFixed(3)}, y=${focal.y.toFixed(3)}`)

    const { error: updateError } = await db
      .from('tribute_photos')
      .update({ focal_point_x: focal.x, focal_point_y: focal.y })
      .eq('id', photo.id)

    if (updateError) {
      console.error(`  ✗ Failed to update: ${updateError.message}`)
    } else {
      console.log(`  ✓ Updated successfully`)
    }
    console.log()
  }

  console.log('Backfill complete.')
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
