'use client'

/**
 * Post-creation upsell drawer (Phase 2)
 * Phase 1: email capture
 * Phase 2: 3-tier Stripe checkout
 *
 * Slides up from bottom — triggered 30s after creator's first view or on first Share tap.
 * Shows Keep / Cherish / Legacy tiers with real Stripe checkout.
 */

import { useState, useEffect } from 'react'

interface UpsellDrawerProps {
  tributeId: string
  tributeSlug?: string
  subjectName: string
  heroPhotoUrl?: string | null
  isVisible: boolean
  onClose: () => void
}

type DrawerStage = 'prompt' | 'tiers' | 'email' | 'done' | 'loading'

const TIERS = [
  {
    id: 'keep' as const,
    name: 'Keep',
    price: '$39',
    tagline: 'Permanent tribute, always here',
    features: ['Permanent page — never expires', 'PDF memorial card', 'Shareable link forever'],
    color: '#D97706',
    emoji: '🕯️',
  },
  {
    id: 'cherish' as const,
    name: 'Cherish',
    price: '$127',
    tagline: 'A keepsake they deserve',
    features: [
      'Everything in Keep',
      'Photo restoration',
      '8-page memorial book PDF',
      'QR code for funeral programs',
    ],
    color: '#9D4E2C',
    emoji: '📖',
    featured: true,
  },
  {
    id: 'legacy' as const,
    name: 'Legacy',
    price: '$397',
    tagline: 'Their story, preserved forever',
    features: [
      'Everything in Cherish',
      'Full AI biography (2,000+ words)',
      'Video tribute',
      'Hardcover book shipped to you',
    ],
    color: '#5C3317',
    emoji: '📚',
  },
]

export function UpsellDrawer({
  tributeId,
  tributeSlug,
  subjectName,
  heroPhotoUrl,
  isVisible,
  onClose,
}: UpsellDrawerProps) {
  const [stage, setStage] = useState<DrawerStage>('prompt')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkoutLoadingTier, setCheckoutLoadingTier] = useState<string | null>(null)

  // Reset when drawer opens
  useEffect(() => {
    if (isVisible) {
      setStage('prompt')
      setError(null)
    }
  }, [isVisible])

  const handleYes = () => {
    setStage('tiers')
  }

  const handleTierSelect = async (tier: 'keep' | 'cherish' | 'legacy') => {
    if (!tributeSlug) {
      setError('Something went wrong. Please refresh and try again.')
      return
    }

    setCheckoutLoadingTier(tier)
    setError(null)

    try {
      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tributeSlug, tier }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setCheckoutLoadingTier(null)
        return
      }

      // Graceful fallback — Stripe not configured yet
      if (data.comingSoon) {
        setStage('email')
        setCheckoutLoadingTier(null)
        return
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
        // Keep loading state active during redirect
        return
      }

      setError('Something went wrong. Please try again.')
      setCheckoutLoadingTier(null)
    } catch {
      setError('Something went wrong. Please try again.')
      setCheckoutLoadingTier(null)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/upsell/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tributeId,
          email,
          trigger: 'post_creation',
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setStage('done')
      setTimeout(() => { onClose() }, 3000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
        style={{
          animation: 'slideUp 0.4s ease-out',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Preserve this tribute"
      >
        {/* Blurred hero photo background */}
        {heroPhotoUrl && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroPhotoUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{
                filter: 'blur(20px) brightness(0.25) saturate(0.5)',
                transform: 'scale(1.1)',
              }}
            />
          </div>
        )}

        {/* Fallback background */}
        {!heroPhotoUrl && (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #78340f, #1C1007)' }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 px-5 py-8 text-center" style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}>
          {/* Handle */}
          <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-6" />

          {stage === 'prompt' && (
            <PromptStage subjectName={subjectName} onYes={handleYes} onClose={onClose} />
          )}

          {stage === 'tiers' && (
            <TiersStage
              subjectName={subjectName}
              onSelect={handleTierSelect}
              onClose={onClose}
              loadingTier={checkoutLoadingTier}
              error={error}
            />
          )}

          {stage === 'email' && (
            <EmailStage
              subjectName={subjectName}
              email={email}
              onEmailChange={setEmail}
              onSubmit={handleEmailSubmit}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}

          {stage === 'done' && <DoneStage subjectName={subjectName} />}
        </div>
      </div>
    </>
  )
}

// ── Stages ──────────────────────────────────────────────────

function PromptStage({
  subjectName,
  onYes,
  onClose,
}: {
  subjectName: string
  onYes: () => void
  onClose: () => void
}) {
  return (
    <div>
      <p className="font-serif text-white text-xl font-semibold mb-3 leading-snug">
        You made something beautiful for {subjectName}.
      </p>
      <p className="text-white/70 text-sm leading-relaxed mb-2 font-serif">
        This tribute is free — and always will be. Right now it&apos;s stored for 1 year.
      </p>
      <p className="text-white/70 text-sm leading-relaxed mb-8 font-serif">
        Want to preserve it permanently?
      </p>
      <button
        onClick={onYes}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-serif font-semibold text-base rounded-full py-4 px-6 transition-colors mb-3 min-h-[52px]"
      >
        Yes, preserve it →
      </button>
      <button
        onClick={onClose}
        className="w-full text-white/50 hover:text-white/80 text-sm py-2 transition-colors font-serif"
      >
        Keep the free version
      </button>
    </div>
  )
}

function TiersStage({
  subjectName,
  onSelect,
  onClose,
  loadingTier,
  error,
}: {
  subjectName: string
  onSelect: (tier: 'keep' | 'cherish' | 'legacy') => void
  onClose: () => void
  loadingTier: string | null
  error: string | null
}) {
  return (
    <div>
      <p className="font-serif text-white text-lg font-semibold mb-1 leading-snug">
        Choose how to honor {subjectName}.
      </p>
      <p className="text-white/60 text-sm mb-6 font-serif">
        One-time payment. No subscription.
      </p>

      {error && (
        <p className="text-red-300 text-sm mb-4 bg-red-900/30 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <div className="space-y-3 text-left">
        {TIERS.map((tier) => {
          const isLoading = loadingTier === tier.id
          const isDisabled = loadingTier !== null

          return (
            <button
              key={tier.id}
              onClick={() => !isDisabled && onSelect(tier.id)}
              disabled={isDisabled}
              className="w-full text-left rounded-2xl overflow-hidden transition-all"
              style={{
                background: tier.featured
                  ? 'rgba(255,255,255,0.15)'
                  : 'rgba(255,255,255,0.08)',
                border: tier.featured ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
                opacity: isDisabled && !isLoading ? 0.5 : 1,
              }}
              aria-label={`Select ${tier.name} tier for ${tier.price}`}
            >
              <div className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{tier.emoji}</span>
                      <span className="font-serif font-bold text-white text-base">
                        {tier.name}
                      </span>
                      {tier.featured && (
                        <span
                          className="text-xs font-sans font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: '#D97706', color: '#fff' }}
                        >
                          Most loved
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-xs font-serif mb-2">
                      {tier.tagline}
                    </p>
                    <ul className="space-y-0.5">
                      {tier.features.map((f) => (
                        <li key={f} className="text-white/75 text-xs flex items-start gap-1.5">
                          <span className="mt-0.5 text-amber-400 flex-shrink-0">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="font-serif font-bold text-white text-xl">
                      {tier.price}
                    </div>
                    <div className="text-white/40 text-xs">once</div>
                    {isLoading && (
                      <div className="mt-2 flex justify-end">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-white/40 text-xs mt-4 mb-2 font-sans">
        🔒 Secure checkout via Stripe
      </p>

      <button
        onClick={onClose}
        className="w-full text-white/40 hover:text-white/70 text-sm py-2 transition-colors font-serif"
      >
        Not now
      </button>
    </div>
  )
}

function EmailStage({
  subjectName,
  email,
  onEmailChange,
  onSubmit,
  isSubmitting,
  error,
}: {
  subjectName: string
  email: string
  onEmailChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
  error: string | null
}) {
  return (
    <div>
      <p className="font-serif text-white text-lg font-semibold mb-2">
        Payments are coming soon.
      </p>
      <p className="text-white/60 text-sm mb-6 font-serif">
        Leave your email and we&apos;ll let you know as soon as you can preserve {subjectName}&apos;s tribute permanently.
      </p>

      {error && <p className="text-red-300 text-sm mb-4">{error}</p>}

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Your email address"
          required
          className="w-full bg-white/10 border border-white/20 focus:border-amber-400 text-white placeholder:text-white/40 rounded-xl px-4 py-3 text-base outline-none transition-colors"
          style={{ fontSize: '16px' }}
        />
        <button
          type="submit"
          disabled={!email || isSubmitting}
          className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-serif font-semibold text-base rounded-full py-4 px-6 transition-colors min-h-[52px] flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending…
            </>
          ) : (
            'Notify Me When Ready'
          )}
        </button>
      </form>
    </div>
  )
}

function DoneStage({ subjectName }: { subjectName: string }) {
  return (
    <div>
      <div className="text-4xl mb-4">✓</div>
      <p className="font-serif text-white text-lg font-semibold mb-2">
        We&apos;ll be in touch.
      </p>
      <p className="text-white/60 text-sm font-serif">
        {subjectName}&apos;s tribute is safe.
      </p>
    </div>
  )
}
