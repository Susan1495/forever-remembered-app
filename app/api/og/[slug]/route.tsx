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
        {/* Left: Portrait photo panel */}
        {heroPhotoUrl && (
          <div style={{
            display: 'flex',
            width: '420px',
            height: '630px',
            flexShrink: 0,
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroPhotoUrl}
              alt=""
              style={{
                width: '420px',
                height: '630px',
                objectFit: 'cover',
                objectPosition: `${Math.round((heroPhoto?.focal_point_x ?? 0.5) * 100)}% ${Math.round((heroPhoto?.focal_point_y ?? 0.25) * 100)}%`,
              }}
            />
            {/* Right-edge fade into dark panel */}
            <div style={{
              display: 'flex',
              position: 'absolute',
              top: 0, right: 0, bottom: 0,
              width: '80px',
              background: 'linear-gradient(to right, transparent, #1a1412)',
            }} />
          </div>
        )}

        {/* Right: Text panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '50px 60px',
          flex: 1,
        }}>
          {/* Logo top */}
          <div style={{
            display: 'flex',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 20,
            fontFamily: 'Georgia, serif',
            letterSpacing: '0.05em',
          }}>
            Forever Remembered
          </div>

          {/* Center: Name + dates + headline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex',
              color: 'white',
              fontSize: heroPhotoUrl ? 52 : 64,
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              lineHeight: 1.1,
            }}>
              {displayName}
            </div>
            <div style={{
              display: 'flex',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 22,
              fontFamily: 'Georgia, serif',
              letterSpacing: '0.1em',
            }}>
              {dates}
            </div>
            <div style={{
              display: 'flex',
              color: 'rgba(255,220,150,0.9)',
              fontSize: 24,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              lineHeight: 1.4,
            }}>
              {headline}
            </div>
          </div>

          {/* Bottom: Candle emoji */}
          <div style={{ display: 'flex', fontSize: 32 }}>🕯️</div>
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
