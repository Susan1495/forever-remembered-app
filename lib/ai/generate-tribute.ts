/**
 * Full AI tribute generation pipeline
 * Orchestrates: moderation → photo analysis → text generation → template selection → DB update
 */

import { moderateContent, ModerationError } from './moderation'
import { analyzePhotos } from './analyze-photos'
import { generateTributeText } from './generate-text'
import { generatePlaceholderArt } from './generate-art'
import { getTributeById, updateTribute } from '@/lib/db/tributes'
import { getTributePhotos, insertTributePhoto } from '@/lib/db/photos'
import { sendTributeReadyEmail } from '@/lib/email/send'
import { createServerClient } from '@/lib/supabase'
import type { AITheme, TemplateId } from '@/lib/types'

// Theme → Template mapping
const THEME_TO_TEMPLATE: Record<string, TemplateId> = {
  faith: 'classic',
  nature: 'garden',
  joyful: 'golden-hour',
  gentle: 'golden-hour',
  humor: 'golden-hour',
  strength: 'classic',
  family: 'golden-hour',
  adventure: 'minimal',
  wisdom: 'classic',
  love: 'golden-hour',
}

function selectTemplate(
  themes: AITheme[],
  isLiving: boolean,
  ageGroup: string | null
): TemplateId {
  if (ageGroup === 'child' || ageGroup === 'infant') return 'minimal'
  if (ageGroup === 'pet') return 'garden'
  if (isLiving) return 'golden-hour'

  for (const theme of themes) {
    if (THEME_TO_TEMPLATE[theme]) return THEME_TO_TEMPLATE[theme]
  }
  return 'golden-hour'
}

/**
 * Main tribute generation pipeline
 * Called async after tribute record is created
 */
export async function generateTribute(tributeId: string): Promise<void> {
  const tribute = await getTributeById(tributeId)
  if (!tribute) {
    console.error(`Tribute not found: ${tributeId}`)
    return
  }

  const photos = await getTributePhotos(tributeId)

  try {
    // Step 1: Content moderation
    await moderateContent(
      tribute.subject_name,
      tribute.subject_bio ?? undefined,
      tribute.extra_context ?? undefined
    )

    // Step 2: Photo analysis (if photos uploaded)
    let photoAnalysis = null
    if (photos.length > 0) {
      const photoUrls = photos.map(p => p.cdn_url)
      photoAnalysis = await analyzePhotos(photoUrls, tribute)
    }

    // Step 3: Generate placeholder art if no photos
    if (photos.length === 0) {
      const artUrl = await generatePlaceholderArt(
        tribute,
        photoAnalysis?.themes || []
      )

      // Download and store to Supabase Storage
      const storagePath = await storeGeneratedArt(tributeId, artUrl)
      
      if (storagePath) {
        await insertTributePhoto(tributeId, {
          storage_path: storagePath.path,
          cdn_url: storagePath.url,
          display_order: 0,
        })
      }
    }

    // Step 4: Generate tribute text
    const tributeText = await generateTributeText({
      subject_name: tribute.subject_name,
      subject_bio: tribute.subject_bio,
      extra_context: tribute.extra_context,
      relationship: tribute.relationship,
      birth_date: tribute.birth_date,
      death_date: tribute.death_date,
      is_living: tribute.is_living,
      subject_age_group: tribute.subject_age_group,
      photoObservations: photoAnalysis?.photoObservations,
      themes: photoAnalysis?.themes,
    })

    // Step 5: Select template
    const templateId = selectTemplate(
      photoAnalysis?.themes || [],
      tribute.is_living,
      tribute.subject_age_group
    )

    // Step 6: Build photo captions map
    const captionsMap: Record<string, string> = {}
    if (photoAnalysis && photos.length > 0) {
      photos.forEach((photo, idx) => {
        if (photoAnalysis.captions[idx]) {
          captionsMap[photo.id] = photoAnalysis.captions[idx]
        }
      })
    }

    // Step 7: Update tribute record with all AI output
    await updateTribute(tributeId, {
      ai_headline: tributeText.headline,
      ai_pull_quote: tributeText.pullQuote,
      ai_body: tributeText.body,
      ai_themes: photoAnalysis?.themes || [],
      ai_photo_captions: captionsMap,
      hero_photo_idx: photoAnalysis?.heroPhotoIndex || 0,
      template_id: templateId,
      status: 'published',
      published_at: new Date().toISOString(),
    })

    // Step 8: Send "tribute ready" email if creator_email is set
    if (tribute.creator_email) {
      await sendTributeReadyEmail({
        to: tribute.creator_email,
        subjectName: tribute.subject_name,
        tributeSlug: tribute.slug,
      })
    }

    console.log(`Tribute generated successfully: ${tribute.slug}`)
  } catch (error) {
    if (error instanceof ModerationError) {
      await updateTribute(tributeId, { status: 'failed' })
      console.warn(`Tribute ${tributeId} failed moderation`)
      return
    }

    console.error(`Tribute generation failed for ${tributeId}:`, error)
    
    // Retry logic: check if this is first failure, try fallback generation
    try {
      await generateFallbackTribute(tributeId)
    } catch (fallbackError) {
      console.error(`Fallback also failed for ${tributeId}:`, fallbackError)
      await updateTribute(tributeId, { status: 'failed' })
    }
  }
}

/**
 * Fallback generation — simpler, no OpenAI dependency
 * Used when main pipeline fails
 */
async function generateFallbackTribute(tributeId: string): Promise<void> {
  const tribute = await getTributeById(tributeId)
  if (!tribute) return

  const { generateTributeText } = await import('./generate-text')
  
  // Force fallback by temporarily removing API key context
  const tributeText = await generateTributeText({
    subject_name: tribute.subject_name,
    subject_bio: tribute.subject_bio,
    extra_context: tribute.extra_context,
    relationship: tribute.relationship,
    birth_date: tribute.birth_date,
    death_date: tribute.death_date,
    is_living: tribute.is_living,
    subject_age_group: tribute.subject_age_group,
  })

  await updateTribute(tributeId, {
    ai_headline: tributeText.headline,
    ai_pull_quote: tributeText.pullQuote,
    ai_body: tributeText.body,
    ai_themes: ['gentle'],
    template_id: 'golden-hour',
    status: 'published',
    published_at: new Date().toISOString(),
  })
}

/**
 * Download generated art URL and store in Supabase Storage
 */
async function storeGeneratedArt(
  tributeId: string,
  artUrl: string
): Promise<{ path: string; url: string } | null> {
  // If it's a placeholder path, return as-is
  if (artUrl.startsWith('/')) {
    return {
      path: artUrl,
      url: `${process.env.NEXT_PUBLIC_URL}${artUrl}`,
    }
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return { path: artUrl, url: artUrl }
    }

    // Download the generated image
    const response = await fetch(artUrl)
    if (!response.ok) throw new Error('Failed to download generated art')
    
    const buffer = await response.arrayBuffer()
    const storagePath = `${tributeId}/ai-generated.png`

    const db = createServerClient()
    const { error } = await db.storage
      .from('tribute-photos')
      .upload(storagePath, buffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (error) throw error

    const cdnUrl = `${supabaseUrl}/storage/v1/object/public/tribute-photos/${storagePath}`
    return { path: storagePath, url: cdnUrl }
  } catch (e) {
    console.error('Failed to store generated art:', e)
    // Return original URL as fallback
    return { path: artUrl, url: artUrl }
  }
}
