/**
 * Post-generation upsell interstitial
 * Route: /tribute/[slug]/celebrate
 *
 * Shown immediately after tribute generation completes.
 * Catches the creator at peak emotion and presents upgrade options.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTributeBySlug } from '@/lib/db/tributes'
import { getTributePhotos } from '@/lib/db/photos'
import { CelebratePage } from './CelebratePage'

interface Props {
  params: { slug: string }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Your tribute is ready — Forever Remembered',
    robots: { index: false, follow: false },
  }
}

export default async function CelebratePageRoute({ params }: Props) {
  const tribute = await getTributeBySlug(params.slug)

  if (!tribute || tribute.status !== 'published') {
    notFound()
  }

  const photos = await getTributePhotos(tribute.id)
  const heroPhoto = photos[tribute.hero_photo_idx || 0] || photos[0] || null

  return (
    <CelebratePage
      tribute={tribute}
      heroPhotoUrl={heroPhoto?.cdn_url || null}
    />
  )
}
