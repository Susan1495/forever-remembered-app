'use client'

/**
 * CelebratePage — Post-generation upsell interstitial
 *
 * Shown immediately after tribute generation completes.
 * Emotionally warm, premium feel, NOT salesy.
 * Mobile-first design matching the Forever Remembered aesthetic.
 *
 * Design principle: fully static render — no useState that could trigger
 * a re-render and cause mobile Safari to scroll-to-top.
 * Checkout is handled by CheckoutButton (isolated client island).
 */

import type { Tribute } from '@/lib/types'
import { CheckoutButton } from './CheckoutButton'

interface CelebratePageProps {
  tribute: Tribute
  heroPhotoUrl: string | null
}

const TIERS = [
  {
    id: 'keep' as const,
    name: 'Keep',
    price: '$39',
    tagline: 'Preserve it permanently',
    features: [
      'Digital tribute page, forever',
      'Shareable link that never expires',
      'PDF memorial card (printable)',
    ],
    highlight: false,
    badge: null,
  },
  {
    id: 'cherish' as const,
    name: 'Cherish',
    price: '$127',
    tagline: 'A keepsake they can hold',
    features: [
      'Everything in Keep',
      'Beautiful 8-page memorial book (PDF)',
      'AI photo restoration',
      'QR code for funeral programs',
    ],
    highlight: true,
    badge: 'Most Loved',
  },
  {
    id: 'legacy' as const,
    name: 'Legacy',
    price: '$397',
    tagline: 'Framed. Printed. Eternal.',
    features: [
      'Everything in Cherish',
      'Print-ready version for framing',
      'Hardcover book shipped to you',
      'Video tribute (shareable)',
    ],
    highlight: false,
    badge: null,
  },
]

export function CelebratePage({ tribute, heroPhotoUrl }: CelebratePageProps) {
  const tributeUrl = `/tribute/${tribute.slug}`

  return (
    <div
      style={{ background: 'linear-gradient(180deg, #FFFBF5 0%, #FEF3E2 100%)', minHeight: '100vh' }}
    >
      {/* Hero area — fully static, no JS */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '320px',
          background: 'linear-gradient(180deg, #78350f 0%, #92400e 60%, #FFFBF5 100%)',
        }}
      >
        {/* Blurred bg photo — purely decorative, no layout impact */}
        {heroPhotoUrl && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroPhotoUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'blur(4px) brightness(0.4)',
                transform: 'scale(1.08)',
                display: 'block',
              }}
            />
          </div>
        )}

        {/* Hero content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '20px', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
            🌹
          </div>

          <h1
            className="font-serif"
            style={{
              color: '#fff',
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1.3,
              maxWidth: '480px',
              margin: '0 0 8px',
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            Your tribute for {tribute.subject_name} is ready
          </h1>

          {/* Circular photo — fixed size so no layout shift */}
          {heroPhotoUrl && (
            <div
              style={{
                marginTop: '24px',
                width: 120,
                height: 120,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid rgba(253,230,138,0.8)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroPhotoUrl}
                alt={tribute.subject_name}
                width={120}
                height={120}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '672px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Emotional copy */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p className="font-serif" style={{ color: '#3D2B14', fontSize: '18px', lineHeight: 1.6, marginBottom: '12px' }}>
            Thousands of families have used Forever Remembered to honor their loved ones.
          </p>
          <p className="font-serif" style={{ color: '#6B5A45', fontSize: '16px', lineHeight: 1.6 }}>
            Make this tribute last forever.
          </p>
        </div>

        {/* Tier cards — each has its own isolated CheckoutButton client island */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: tier.highlight ? '2px solid #D97706' : '1.5px solid #E8DDD0',
                background: tier.highlight ? '#FFFBF5' : '#FFFFFF',
                boxShadow: tier.highlight
                  ? '0 8px 32px rgba(217,119,6,0.15)'
                  : '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              {tier.badge && (
                <div
                  className="font-serif"
                  style={{
                    background: '#D97706',
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '6px',
                    letterSpacing: '0.05em',
                  }}
                >
                  {tier.badge}
                </div>
              )}

              <div style={{ padding: '20px 20px 24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 className="font-serif" style={{ color: '#1C1007', fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
                    {tier.name}
                  </h3>
                  <div className="font-serif" style={{ color: tier.highlight ? '#D97706' : '#3D2B14', fontSize: '30px', fontWeight: 700, marginBottom: '4px' }}>
                    {tier.price}
                  </div>
                  <p className="font-serif" style={{ color: '#6B5A45', fontSize: '14px' }}>
                    {tier.tagline}
                  </p>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tier.features.map((feature) => (
                    <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#D97706', fontWeight: 700, fontSize: '12px', marginTop: '2px', flexShrink: 0 }}>✓</span>
                      <span className="font-serif" style={{ color: '#3D2B14', fontSize: '14px' }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Isolated client island — state changes here don't affect scroll */}
                <CheckoutButton
                  tributeSlug={tribute.slug}
                  tier={tier.id}
                  label={`Choose ${tier.name}`}
                  highlight={tier.highlight}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Skip link — plain anchor, no JS */}
        <div style={{ textAlign: 'center', paddingBottom: '40px' }}>
          <a
            href={tributeUrl}
            className="font-serif"
            style={{ color: '#9B8B78', fontSize: '14px', textDecoration: 'none' }}
          >
            No thanks, just view the free tribute →
          </a>
        </div>
      </div>
    </div>
  )
}
