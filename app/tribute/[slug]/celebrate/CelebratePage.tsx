/**
 * CelebratePage — Post-generation upsell interstitial
 *
 * Shown immediately after tribute generation completes.
 * Emotionally warm, premium feel, NOT salesy.
 * Mobile-first design matching the Forever Remembered aesthetic.
 *
 * Design principle: pure server component — no 'use client', no useState,
 * no re-renders. Checkout handled by isolated CheckoutButton client island.
 * Avoids mobile Safari scroll-to-top caused by client re-renders + 100vh.
 */

import type { Tribute } from '@/lib/types'
import { CheckoutButton } from './CheckoutButton'
import { CherishToggle } from './CherishToggle'

interface CelebratePageProps {
  tribute: Tribute
  heroPhotoUrl: string | null
}

const TIERS = [
  {
    id: 'cherish_monthly' as const,
    name: 'Cherish',
    price: '$9.99/mo',
    priceSub: 'or $79/year',
    tagline: 'Their story keeps growing',
    features: [
      'Tribute page lives forever — never expires',
      'Add new photos & stories anytime',
      'Family gets anniversary reminders every year',
      'PDF memorial card to download & print',
      'QR code for funeral programs',
    ],
    highlight: true,
    badge: 'Most Loved',
  },
  {
    id: 'legacy' as const,
    name: 'Legacy',
    price: '$297',
    priceSub: 'one-time, forever',
    tagline: 'A physical keepsake to hold forever',
    features: [
      'Everything in Cherish',
      'Lifetime hosting — pay once, done',
      'Hardcover memorial book printed & shipped to you',
    ],
    highlight: false,
    badge: null,
  },
]

export function CelebratePage({ tribute, heroPhotoUrl }: CelebratePageProps) {
  const tributeUrl = `/tribute/${tribute.slug}`

  return (
    <div
      style={{ background: 'linear-gradient(180deg, #FFFBF5 0%, #FEF3E2 100%)', paddingBottom: '60px' }}
    >
      {/* Hero area — FIXED height so no layout shift on mobile Safari */}
      <div
        style={{
          position: 'relative',
          height: '340px',         /* fixed — never changes when images load */
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #78350f 0%, #92400e 60%, #FFFBF5 100%)',
        }}
      >
        {/* Blurred bg photo — absolute, purely decorative, zero layout impact */}
        {heroPhotoUrl && (
          <img
            src={heroPhotoUrl}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(4px) brightness(0.4)',
              transform: 'scale(1.08)',
              display: 'block',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Hero content — centered inside fixed-height container */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
            🌹
          </div>

          <h1
            className="font-serif"
            style={{
              color: '#fff',
              fontSize: '24px',
              fontWeight: 700,
              lineHeight: 1.3,
              maxWidth: '320px',
              margin: '0 0 16px',
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            Your tribute for {tribute.subject_name} is ready
          </h1>

          {/* Circular photo — fixed size, absolutely no layout contribution */}
          {heroPhotoUrl && (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid rgba(253,230,138,0.8)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroPhotoUrl}
                alt={tribute.subject_name}
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
            Your tribute is live for 30 days, free.
          </p>
          <p className="font-serif" style={{ color: '#6B5A45', fontSize: '16px', lineHeight: 1.6 }}>
            Subscribe to keep {tribute.subject_name}&apos;s memory alive forever &mdash; and let family receive reminders on birthdays and anniversaries.
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
                  <p className="font-serif" style={{ color: '#6B5A45', fontSize: '14px', marginBottom: '16px' }}>
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

                {tier.highlight ? (
                  <CherishToggle tributeSlug={tribute.slug} />
                ) : (
                  <>
                    <div className="font-serif" style={{ color: '#3D2B14', fontSize: '30px', fontWeight: 700, marginBottom: '2px' }}>
                      {tier.price}
                    </div>
                    <p className="font-serif" style={{ color: '#9B8B78', fontSize: '13px', marginBottom: '16px' }}>
                      {tier.priceSub}
                    </p>
                    <CheckoutButton
                      tributeSlug={tribute.slug}
                      tier={tier.id}
                      label={`Choose ${tier.name}`}
                      highlight={false}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* View tribute + skip links */}
        <div style={{ textAlign: 'center', paddingBottom: '40px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <a
            href={tributeUrl}
            className="font-serif"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#3D2B14',
              color: '#fff',
              borderRadius: '999px',
              padding: '14px 28px',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            View {tribute.subject_name}&apos;s Tribute →
          </a>
          <a
            href={tributeUrl}
            className="font-serif"
            style={{ color: '#9B8B78', fontSize: '14px', textDecoration: 'none' }}
          >
            No thanks, just view the free tribute
          </a>
        </div>
      </div>
    </div>
  )
}
