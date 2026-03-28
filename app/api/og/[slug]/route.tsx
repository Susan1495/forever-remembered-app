/**
 * GET /api/og/[slug]
 * Dynamic OG image generation using @vercel/og
 * Returns 1200×630 PNG with hero photo, name, and headline
 */

import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { getTributeBySlug } from '@/lib/db/tributes'
import { getTributePhotos } from '@/lib/db/photos'

export const runtime = 'edge'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const tribute = await getTributeBySlug(params.slug)

  if (!tribute) {
    // Return a generic OG image for missing tributes
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '1200px',
            height: '630px',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1412',
          }}
        >
          <div style={{ display: 'flex', color: 'white', fontSize: 40 }}>
            Forever Remembered
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  const photos = await getTributePhotos(tribute.id)
  const heroPhoto = photos[tribute.hero_photo_idx || 0]
  const heroPhotoUrl = heroPhoto?.cdn_url

  const displayName = tribute.subject_name
  const headline = tribute.ai_headline || `Remembered with love`
  const dates =
    tribute.birth_date && tribute.death_date
      ? `${formatYear(tribute.birth_date)} — ${formatYear(tribute.death_date)}`
      : tribute.is_living
      ? `Honoring ${displayName}`
      : 'Beloved always'

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '1200px',
          height: '630px',
          position: 'relative',
          backgroundColor: '#1a1412',
          overflow: 'hidden',
        }}
      >
        {/* Hero photo background */}
        {heroPhotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhotoUrl}
            alt=""
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.7,
            }}
          />
        )}

        {/* Dark gradient overlay */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
          }}
        />

        {/* Logo watermark */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: 40,
            right: 60,
            color: 'rgba(255,255,255,0.7)',
            fontSize: 22,
            fontFamily: 'Georgia, serif',
            letterSpacing: '0.05em',
          }}
        >
          Forever Remembered
        </div>

        {/* Name and info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            bottom: 60,
            left: 60,
            right: 60,
          }}
        >
          {/* Subject name */}
          <div
            style={{
              display: 'flex',
              color: 'white',
              fontSize: 64,
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: 12,
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}
          >
            {displayName}
          </div>

          {/* Dates */}
          <div
            style={{
              display: 'flex',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 22,
              fontFamily: 'Georgia, serif',
              letterSpacing: '0.1em',
              marginBottom: 16,
            }}
          >
            {dates}
          </div>

          {/* AI headline */}
          <div
            style={{
              display: 'flex',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 26,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              lineHeight: 1.3,
              maxWidth: '900px',
            }}
          >
            {headline}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    }
  )
}

function formatYear(dateStr: string): string {
  try {
    return new Date(dateStr).getFullYear().toString()
  } catch {
    return dateStr
  }
}
