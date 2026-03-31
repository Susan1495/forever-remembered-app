'use client'

/**
 * Screen 3: Generation loading screen
 * - Animated candle (or theme-appropriate animation)
 * - Rotating text messages
 * - Polls /api/tribute/[slug]/status every 3 seconds
 * - Auto-redirects when published
 */

import { useState, useEffect, useCallback, useRef } from 'react'
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
  // Use a ref for failedPolls to avoid stale closure issues in the polling loop
  const failedPollsRef = useRef(0)
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

  // Show email capture after 10 seconds
  useEffect(() => {
    if (elapsedSeconds >= 10) {
      setShowEmailCapture(true)
    }
  }, [elapsedSeconds])

  // Poll status — failedPolls is a ref so this callback is stable
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/tribute/${slug}/status`, {
        cache: 'no-store',
      })

      if (!res.ok) {
        failedPollsRef.current += 1
        // After 3 consecutive failures, show email capture
        if (failedPollsRef.current >= 3) {
          setShowEmailCapture(true)
        }
        return
      }

      const { status } = await res.json()

      if (status === 'published') {
        // Always redirect when published — even if emailSubmitted confirmation is showing
        router.replace(`/tribute/${slug}/celebrate`)
        return
      }

      if (status === 'failed') {
        setShowEmailCapture(true)
        return
      }

      // Still processing — reset failed polls
      failedPollsRef.current = 0
    } catch {
      failedPollsRef.current += 1
      // After 3 consecutive failures, show email capture
      if (failedPollsRef.current >= 3) {
        setShowEmailCapture(true)
      }
    }
  }, [slug, router])

  // Start polling — interval adapts based on failedPollsRef
  useEffect(() => {
    // Initial check
    checkStatus()

    const scheduleNext = () => {
      const failed = failedPollsRef.current
      const delay = failed >= 10 ? 15000 : failed >= 5 ? 5000 : 3000
      return setTimeout(() => {
        checkStatus()
        scheduleNext()
      }, delay)
    }

    const timeout = scheduleNext()
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkStatus])

  // Re-check status when user returns to tab (e.g. backgrounded on mobile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStatus()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [checkStatus])

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
    try {
      await fetch(`/api/tribute/${slug}/email`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // Non-fatal — still show confirmation to user
      console.error('Failed to save email to server')
    }
    // Keep local copy as fallback
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

      {/* Email capture — shown after 10 seconds or on failure */}
      {showEmailCapture && !emailSubmitted && (
        <div className="max-w-sm w-full">
          <p className="font-serif text-white text-lg mb-2">
            Your tribute is being created ✨
          </p>
          <p className="text-white/60 text-sm mb-6 font-serif">
            Enter your email and we&apos;ll send you the link the moment it&apos;s ready.
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
          <p className="text-white/60 text-sm font-serif mb-5">
            Check your inbox in a few minutes.
          </p>
          {/* Manual navigation fallback — in case polling doesn't fire the redirect */}
          <a
            href={`/tribute/${slug}/celebrate`}
            className="font-serif text-amber-400 hover:text-amber-300 text-sm transition-colors underline-offset-2 hover:underline"
          >
            View your tribute →
          </a>
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
