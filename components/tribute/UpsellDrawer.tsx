'use client'

/**
 * Post-creation upsell drawer
 * Slides up from bottom — email capture only in Phase 1
 * Triggered 30s after first view or on first Share tap
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

export function UpsellDrawer({
  tributeId,
  subjectName,
  heroPhotoUrl,
  isVisible,
  onClose,
}: UpsellDrawerProps) {
  const [stage, setStage] = useState<'prompt' | 'email' | 'done'>('prompt')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset when drawer opens
  useEffect(() => {
    if (isVisible) {
      setStage('prompt')
    }
  }, [isVisible])

  const handleYes = () => {
    setStage('email')
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

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose()
      }, 3000)
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
          maxHeight: '90vh',
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
              style={{ filter: 'blur(20px) brightness(0.3) saturate(0.5)', transform: 'scale(1.1)' }}
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
        <div className="relative z-10 px-6 py-8 pb-safe-bottom text-center">
          {/* Handle */}
          <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-6" />

          {stage === 'prompt' && (
            <PromptStage
              subjectName={subjectName}
              onYes={handleYes}
              onClose={onClose}
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
      <p className="font-serif text-white text-xl font-semibold mb-3">
        You made something beautiful for {subjectName}.
      </p>

      <p className="text-white/70 text-sm leading-relaxed mb-2 font-serif">
        This tribute is free — and always will be. Right now it&apos;s stored for 1 year.
      </p>

      <p className="text-white/70 text-sm leading-relaxed mb-8 font-serif">
        Want to hear about ways to preserve it permanently?
      </p>

      <button
        onClick={onYes}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-serif font-semibold text-base rounded-full py-4 px-6 transition-colors mb-3 min-h-[52px]"
      >
        Yes, tell me more
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
      <p className="font-serif text-white text-lg font-semibold mb-3">
        We&apos;ll send you options to preserve {subjectName}&apos;s tribute.
      </p>

      <p className="text-white/60 text-sm mb-6 font-serif">
        Leave your email and we&apos;ll send you options to preserve {subjectName}&apos;s tribute permanently.
      </p>

      {error && (
        <p className="text-red-300 text-sm mb-4">{error}</p>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={e => onEmailChange(e.target.value)}
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
            'Send Me the Options'
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
