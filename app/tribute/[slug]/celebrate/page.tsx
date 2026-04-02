/**
 * Post-generation upsell interstitial
 * Route: /tribute/[slug]/celebrate
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTributeBySlug } from '@/lib/db/tributes'
import { getTributePhotos } from '@/lib/db/photos'
import { CelebratePage } from './CelebratePage'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Your tribute is ready — Forever Remembered',
    robots: { index: false, follow: false },
  }
}

export default async function CelebratePageRoute({ params }: Props) {
  const { slug } = await params
  const tribute = await getTributeBySlug(slug)

  if (!tribute || (tribute.status !== 'published' && tribute.status !== 'processing')) {
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
