/**
 * Screen 4: The Tribute Page
 * Route: /tribute/[slug]
 * Server-side rendered for SEO and OG
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTributeBySlug } from '@/lib/db/tributes'
import { getTributePhotos } from '@/lib/db/photos'
import { TributePage } from './TributePage'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ created?: string; order?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tribute = await getTributeBySlug(slug)

  if (!tribute || tribute.status !== 'published') {
    return {
      title: 'Tribute not found — Forever Remembered',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://foreverremembered.ai'
  const isLiving = tribute.is_living
  const titlePrefix = isLiving ? 'Honoring' : 'In memory of'
  const description = tribute.ai_body?.opening?.substring(0, 160) ||
    `${tribute.ai_headline || `A tribute to ${tribute.subject_name}`}`

  return {
    title: `${titlePrefix} ${tribute.subject_name} — Forever Remembered`,
    description,
    openGraph: {
      title: tribute.ai_headline || `${titlePrefix} ${tribute.subject_name}`,
      description,
      images: [
        {
          url: `${baseUrl}/api/og/${slug}`,
          width: 1200,
          height: 630,
          alt: `${titlePrefix} ${tribute.subject_name}`,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: tribute.ai_headline || tribute.subject_name,
      description,
      images: [`${baseUrl}/api/og/${slug}`],
    },
    robots: { index: false, follow: false },
  }
}

export default async function TributePageRoute({ params, searchParams }: Props) {
  const { slug } = await params
  const { created, order } = await searchParams

  const tribute = await getTributeBySlug(slug)

  if (!tribute) {
    notFound()
  }

  if (tribute.status === 'processing') {
    // Auto-redirect to generating page which polls until published
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-5">
        <div className="text-center">
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🌹</div>
          <p className="font-serif text-white text-lg mb-4">
            Your tribute is almost ready…
          </p>
          <p className="text-white/50 text-sm mb-6">Taking you there now.</p>
          <meta httpEquiv="refresh" content={`2;url=/create/generating/${slug}`} />
        </div>
      </div>
    )
  }

  if (tribute.status === 'failed') {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-5"
        style={{ background: '#FFFBF5' }}
      >
        <div className="text-center max-w-sm">
          <p className="font-serif text-brown-900 text-xl mb-3">
            We weren&apos;t able to complete this tribute.
          </p>
          <p className="text-brown-500 text-sm mb-6">
            Your information is safe. Please try again or contact us if you need help.
          </p>
          <a
            href="/"
            className="inline-block bg-amber-600 text-white font-serif rounded-full px-6 py-3 hover:bg-amber-700 transition-colors"
          >
            Try Again
          </a>
        </div>
      </div>
    )
  }

  if (tribute.status !== 'published') {
    notFound()
  }

  // Show paused state if hosting has expired
  if (tribute.hosting_status === 'paused') {
    const celebrateUrl = `/tribute/${tribute.slug}/celebrate`
    return (
      <div
        style={{ background: 'linear-gradient(180deg, #FFFBF5 0%, #FEF3E2 100%)', minHeight: '100vh' }}
        className="flex items-center justify-center px-5"
      >
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🕯️</div>
          <h1
            className="font-serif"
            style={{ color: '#1C1007', fontSize: '26px', fontWeight: 700, lineHeight: 1.3, marginBottom: '12px' }}
          >
            This tribute has been paused
          </h1>
          <p
            className="font-serif"
            style={{ color: '#6B5A45', fontSize: '16px', lineHeight: 1.6, marginBottom: '32px' }}
          >
            Subscribe to keep {tribute.subject_name}&apos;s memory alive forever.
          </p>
          <a
            href={celebrateUrl}
            className="font-serif"
            style={{
              display: 'inline-block',
              background: '#D97706',
              color: '#fff',
              borderRadius: '999px',
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Keep this tribute alive →
          </a>
          <p
            className="font-serif"
            style={{ color: '#9B8B78', fontSize: '13px', marginTop: '24px' }}
          >
            Starting at $9.99/month — cancel anytime
          </p>
        </div>
      </div>
    )
  }

  const photos = await getTributePhotos(tribute.id)
  const heroPhoto = photos[tribute.hero_photo_idx || 0] || photos[0]
  const isCreator = created === '1'
  const orderSuccess = order === 'success'

  return (
    <TributePage
      tribute={tribute}
      photos={photos}
      heroPhoto={heroPhoto || null}
      isCreator={isCreator}
      orderSuccess={orderSuccess}
    />
  )
}

export const revalidate = 0
export const dynamic = 'force-dynamic'
