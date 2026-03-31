'use client'

/**
 * Screen 3: Generation loading screen
 * - Animated candle (or theme-appropriate animation)
 * - Rotating text messages
 * - Polls /api/tribute/[slug]/status every 3 seconds
 * - Auto-redirects when published
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const MESSAGES = [
  'Reading their story…',
  'Choosing the right words…',
  'Arranging their photos…',
  'Adding the finishing touches…',
  'Almost ready…',
]

interface GenerationLoaderProps {
  slug: string
  relationship?: string
}

export function GenerationLoader({ slug, relationship }: GenerationLoaderProps) {
  const router = useRouter()
  const [messageIdx, setMessageIdx] = useState(0)
  const [failedPolls, setFailedPolls] = useState(0)
  const [showEmailCapture, setShowEmailCapture] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Choose animation type based on relationship
  const animationType = relationship?.toLowerCase().includes('pet')
    ? 'paw'
    : relationship?.toLowerCase().includes('child') || relationship?.toLowerCase().includes('baby')
    ? 'stars'
    : 'candle'

  // Rotate messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx(i => (i + 1) % MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(s => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Show email capture after 5 minutes
  useEffect(() => {
    if (elapsedSeconds >= 300) {
      setShowEmailCapture(true)
    }
  }, [elapsedSeconds])

  // Poll status
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/tribute/${slug}/status`, {
        cache: 'no-store',
      })

      if (!res.ok) {
        setFailedPolls(f => f + 1)
        return
      }

      const { status } = await res.json()

      if (status === 'published') {
        router.replace(`/tribute/${slug}?created=1`)
        return
      }

      if (status === 'failed') {
        setShowEmailCapture(true)
        return
      }

      // Still processing — reset failed polls
      setFailedPolls(0)
    } catch {
      setFailedPolls(f => f + 1)
    }

    // After 3 consecutive failures, show email capture
    if (failedPolls >= 3) {
      setShowEmailCapture(true)
    }
  }, [slug, router, failedPolls])

  // Start polling
  useEffect(() => {
    // Initial check
    checkStatus()

    // Poll every 3 seconds with exponential backoff after failures
    const getInterval = () => {
      if (failedPolls >= 10) return 15000
      if (failedPolls >= 5) return 5000
      return 3000
    }

    const timeout = setTimeout(checkStatus, getInterval())
    return () => clearTimeout(timeout)
  }, [checkStatus, failedPolls])

  // Handle browser back button
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "Your tribute is being created — are you sure you want to leave? We'll email you the link when it's ready."
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Store email — will be picked up when tribute is ready
    localStorage.setItem(`tribute-email-${slug}`, email)
    setEmailSubmitted(true)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center" style={{ background: 'linear-gradient(135deg, #78350f 0%, #92400e 40%, #1c0a00 100%)' }}>
      {/* Animation */}
      <div className="mb-8 relative">
        {animationType === 'candle' && <CandleAnimation />}
        {animationType === 'paw' && <PawAnimation />}
        {animationType === 'stars' && <StarsAnimation />}
      </div>

      {/* Status text */}
      {!showEmailCapture && (
        <>
          <p
            key={messageIdx}
            className="font-serif text-white text-xl mb-3 animate-pulse-fade"
            style={{ minHeight: '32px' }}
          >
            {MESSAGES[messageIdx]}
          </p>

          <p className="text-white/40 text-sm font-serif">
            Usually ready in about a minute.
          </p>
        </>
      )}

      {/* Email capture — shown on timeout or failure */}
      {showEmailCapture && !emailSubmitted && (
        <div className="max-w-sm w-full">
          <p className="font-serif text-white text-lg mb-2">
            We&apos;re taking a little longer than expected.
          </p>
          <p className="text-white/60 text-sm mb-6 font-serif">
            We&apos;ll email you the link when it&apos;s ready.
          </p>

          <form onSubmit={handleEmailSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 bg-white/10 text-white placeholder:text-white/40 border border-white/20 rounded-full px-4 py-3 text-base outline-none focus:border-amber-500"
              style={{ fontSize: '16px' }}
            />
            <button
              type="submit"
              disabled={!email}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-full px-5 py-3 font-serif text-base transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Email submitted confirmation */}
      {emailSubmitted && (
        <div>
          <p className="font-serif text-white text-lg mb-2">✓ We&apos;ll send it to you.</p>
          <p className="text-white/60 text-sm font-serif">
            Check your inbox in a few minutes.
          </p>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Animation Components
   ============================================================ */

function CandleAnimation() {
  return (
    <div className="relative flex items-end justify-center" style={{ width: 60, height: 100 }}>
      {/* Flame */}
      <div
        className="candle-flame"
        style={{
          width: 18,
          height: 30,
          background: 'radial-gradient(ellipse at 50% 80%, #FCD34D, #F59E0B, #D97706)',
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 20px 8px rgba(245,158,11,0.4)',
        }}
      />
      {/* Candle body */}
      <div
        style={{
          width: 12,
          height: 60,
          background: 'linear-gradient(to right, #FEF3E2, #FDE68A, #FEF3E2)',
          borderRadius: '2px',
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
    </div>
  )
}

function PawAnimation() {
  return (
    <div className="text-6xl" style={{ animation: 'bounce 2s ease-in-out infinite' }}>
      🐾
    </div>
  )
}

function StarsAnimation() {
  return (
    <div className="flex gap-2 items-center" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
      {['✨', '⭐', '✨'].map((star, i) => (
        <span
          key={i}
          className="text-3xl"
          style={{
            animation: `pulseFade 2s ease-in-out ${i * 0.4}s infinite`,
            display: 'inline-block',
          }}
        >
          {star}
        </span>
      ))}
    </div>
  )
}
