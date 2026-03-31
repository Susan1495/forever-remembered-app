'use client'

/**
 * CelebratePage — Post-generation upsell interstitial
 *
 * Shown immediately after tribute generation completes.
 * Emotionally warm, premium feel, NOT salesy.
 * Mobile-first design matching the Forever Remembered aesthetic.
 */

import { useState } from 'react'
import type { Tribute } from '@/lib/types'

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
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tributeUrl = `/tribute/${tribute.slug}`

  const handleUpgrade = async (tierId: 'keep' | 'cherish' | 'legacy') => {
    setLoadingTier(tierId)
    setError(null)

    try {
      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tributeSlug: tribute.slug, tier: tierId }),
      })

      const data = await res.json()

      if (data.comingSoon) {
        // Stripe not yet configured — fall through to tribute page
        window.location.href = tributeUrl
        return
      }

      if (data.url) {
        window.location.href = data.url
        return
      }

      throw new Error(data.error || 'Something went wrong')
    } catch {
      setError('Unable to start checkout. Please try again.')
      setLoadingTier(null)
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #FFFBF5 0%, #FEF3E2 100%)' }}
    >
      {/* Hero area */}
      <div
        className="relative overflow-hidden"
        style={{
          minHeight: '320px',
          background: 'linear-gradient(180deg, #78350f 0%, #92400e 60%, #FFFBF5 100%)',
        }}
      >
        {/* Hero photo — blurred/tinted overlay (position:absolute so it never affects scroll height) */}
        {heroPhotoUrl && (
          <div
            className="absolute inset-0 overflow-hidden"
            aria-hidden="true"
            style={{ pointerEvents: 'none' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroPhotoUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'blur(4px) brightness(0.4)', transform: 'scale(1.08)' }}
            />
          </div>
        )}

        {/* Content over hero — padding drives the height, not min-height on children */}
        <div className="relative z-10 flex flex-col items-center justify-center px-5 py-16 text-center">
          {/* Rose emoji */}
          <div className="text-5xl mb-5" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
            🌹
          </div>

          <h1
            className="font-serif text-white text-3xl font-bold mb-3 leading-tight"
            style={{ maxWidth: '480px', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          >
            Your tribute for {tribute.subject_name} is ready
          </h1>

          {/* Preview photo — circular, centered */}
          {heroPhotoUrl && (
            <div
              className="mt-6 mb-2 overflow-hidden border-4 border-amber-200 shadow-xl"
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroPhotoUrl}
                alt={tribute.subject_name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-5 py-10">
        {/* Emotional copy */}
        <div className="text-center mb-10">
          <p
            className="font-serif text-lg leading-relaxed mb-3"
            style={{ color: '#3D2B14' }}
          >
            Thousands of families have used Forever Remembered to honor their loved ones.
          </p>
          <p
            className="font-serif text-base leading-relaxed"
            style={{ color: '#6B5A45' }}
          >
            Make this tribute last forever.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="text-center text-sm mb-6 py-3 px-4 rounded-xl"
            style={{ background: '#FEF2F2', color: '#991B1B' }}
          >
            {error}
          </div>
        )}

        {/* Tier cards */}
        <div className="flex flex-col gap-4 md:flex-row md:gap-5 mb-10">
          {TIERS.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              isLoading={loadingTier === tier.id}
              disabled={loadingTier !== null}
              onSelect={() => handleUpgrade(tier.id)}
            />
          ))}
        </div>

        {/* Skip link */}
        <div className="text-center pb-10">
          <a
            href={tributeUrl}
            className="font-serif text-sm transition-colors"
            style={{ color: '#9B8B78' }}
            onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = '#6B5A45')}
            onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = '#9B8B78')}
          >
            No thanks, just view the free tribute →
          </a>
        </div>
      </div>
    </div>
  )
}

/* ——————————————————————————————————————————
   Tier Card
—————————————————————————————————————————— */

interface TierCardProps {
  tier: (typeof TIERS)[number]
  isLoading: boolean
  disabled: boolean
  onSelect: () => void
}

function TierCard({ tier, isLoading, disabled, onSelect }: TierCardProps) {
  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden flex-1"
      style={{
        border: tier.highlight ? '2px solid #D97706' : '1.5px solid #E8DDD0',
        background: tier.highlight ? '#FFFBF5' : '#FFFFFF',
        boxShadow: tier.highlight
          ? '0 8px 32px rgba(217, 119, 6, 0.15)'
          : '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Badge */}
      {tier.badge && (
        <div
          className="absolute top-0 left-0 right-0 text-center text-xs font-serif font-semibold py-1.5"
          style={{ background: '#D97706', color: '#FFFFFF', letterSpacing: '0.05em' }}
        >
          {tier.badge}
        </div>
      )}

      <div className={`flex flex-col flex-1 px-5 py-6 ${tier.badge ? 'pt-10' : ''}`}>
        {/* Tier name + price */}
        <div className="mb-4">
          <h3
            className="font-serif font-bold text-xl mb-1"
            style={{ color: '#1C1007' }}
          >
            {tier.name}
          </h3>
          <div
            className="font-serif font-bold text-3xl mb-1"
            style={{ color: tier.highlight ? '#D97706' : '#3D2B14' }}
          >
            {tier.price}
          </div>
          <p className="text-sm font-serif" style={{ color: '#6B5A45' }}>
            {tier.tagline}
          </p>
        </div>

        {/* Features */}
        <ul className="flex flex-col gap-2 mb-6 flex-1">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span
                className="mt-0.5 flex-shrink-0 text-xs font-bold"
                style={{ color: '#D97706' }}
              >
                ✓
              </span>
              <span className="text-sm font-serif" style={{ color: '#3D2B14' }}>
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA button */}
        <button
          onClick={onSelect}
          disabled={disabled}
          className="w-full font-serif font-semibold rounded-full py-3 text-base transition-all"
          style={{
            background: tier.highlight ? '#D97706' : '#3D2B14',
            color: '#FFFFFF',
            opacity: disabled && !isLoading ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Starting…
            </span>
          ) : (
            `Choose ${tier.name}`
          )}
        </button>
      </div>
    </div>
  )
}
