'use client'

/**
 * Screen 3: Generation loading screen
 * - Animated candle (or theme-appropriate animation)
 * - Email capture shown IMMEDIATELY so user has time to enter it
 * - Polls /api/tribute/[slug]/status every 3 seconds
 * - Only redirects after email is submitted (or skipped)
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
  const failedPollsRef = useRef(0)
  const tributeReadyRef = useRef(false) // tracks if tribute is published
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [emailSkipped, setEmailSkipped] = useState(false)

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

  // Navigate to celebrate page
  const goToCelebrate = useCallback(() => {
    router.replace(`/tribute/${slug}/celebrate`)
  }, [router, slug])

  // Poll tribute status
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/tribute/${slug}/status`, { cache: 'no-store' })
      if (!res.ok) {
        failedPollsRef.current += 1
        return
      }
      const { status } = await res.json()
      if (status === 'published') {
        tributeReadyRef.current = true
        // Only redirect if user has submitted or skipped email
        if (emailSubmitted || emailSkipped) {
          goToCelebrate()
        }
        // Otherwise wait — user is filling in their email
      } else if (status === 'failed') {
        // Still show the form — let them submit email then see tribute
      } else {
        failedPollsRef.current = 0
      }
    } catch {
      failedPollsRef.current += 1
    }
  }, [slug, emailSubmitted, emailSkipped, goToCelebrate])

  // Start polling
  useEffect(() => {
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const scheduleNext = () => {
      const failed = failedPollsRef.current
      const delay = failed >= 10 ? 15000 : failed >= 5 ? 5000 : 3000
      timeoutId = setTimeout(async () => {
        if (cancelled) return
        await checkStatus()
        if (!cancelled) scheduleNext()
      }, delay)
    }

    checkStatus()
    scheduleNext()

    return () => {
      cancelled = true
      if (timeoutId !== null) clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkStatus])

  // Re-check on tab focus (mobile backgrounding)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkStatus()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [checkStatus])

  // Warn before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "Your tribute is being created — are you sure you want to leave?"
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
      console.error('Failed to save email')
    }
    localStorage.setItem(`tribute-email-${slug}`, email)
    setEmailSubmitted(true)
    // Only navigate if tribute is already published — otherwise let polling handle it
    if (tributeReadyRef.current) {
      goToCelebrate()
    }
    // Otherwise polling will call goToCelebrate() when published
  }

  const handleSkip = () => {
    setEmailSkipped(true)
    if (tributeReadyRef.current) {
      goToCelebrate()
    }
    // If not ready yet, polling will redirect when it finishes
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
      style={{ background: 'linear-gradient(135deg, #78350f 0%, #92400e 40%, #1c0a00 100%)' }}
    >
      {/* Animation */}
      <div className="mb-8 relative">
        {animationType === 'candle' && <CandleAnimation />}
        {animationType === 'paw' && <PawAnimation />}
        {animationType === 'stars' && <StarsAnimation />}
      </div>

      {/* Rotating status message */}
      <p
        key={messageIdx}
        className="font-serif text-white text-xl mb-2"
        style={{ minHeight: '32px' }}
      >
        {MESSAGES[messageIdx]}
      </p>
      <p className="text-white/40 text-sm font-serif mb-8">
        Usually ready in about a minute.
      </p>

      {/* Email capture — shown immediately so user has time */}
      {!emailSubmitted && !emailSkipped && (
        <div className="max-w-sm w-full">
          <p className="text-white/70 text-sm mb-4 font-serif">
            Enter your email and we&apos;ll send you the link too.
          </p>
          <form onSubmit={handleEmailSubmit} className="flex gap-2 mb-3">
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
          <button
            onClick={handleSkip}
            className="text-white/30 text-xs font-serif hover:text-white/50 transition-colors"
          >
            Skip, just take me to the tribute →
          </button>
        </div>
      )}

      {/* After email submitted */}
      {emailSubmitted && (
        <div>
          <p className="font-serif text-white text-lg mb-2">✓ We&apos;ll send it to you.</p>
          <p className="text-white/60 text-sm font-serif mb-5">Taking you to your tribute…</p>
          <a
            href={`/tribute/${slug}/celebrate`}
            className="inline-block bg-amber-600 text-white rounded-full px-6 py-3 font-serif text-base hover:bg-amber-700 transition-colors"
          >
            View tribute →
          </a>
        </div>
      )}

      {/* After skipped — waiting for tribute to finish */}
      {emailSkipped && !tributeReadyRef.current && (
        <p className="text-white/50 text-sm font-serif">
          Almost there… taking you to your tribute.
        </p>
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
      <div
        className="candle-flame"
        style={{
          width: 18, height: 30,
          background: 'radial-gradient(ellipse at 50% 80%, #FCD34D, #F59E0B, #D97706)',
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 20px 8px rgba(245,158,11,0.4)',
        }}
      />
      <div
        style={{
          width: 12, height: 60,
          background: 'linear-gradient(to right, #FEF3E2, #FDE68A, #FEF3E2)',
          borderRadius: '2px', position: 'absolute', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
    </div>
  )
}

function PawAnimation() {
  return (
    <div className="text-6xl" style={{ animation: 'bounce 2s ease-in-out infinite' }}>🐾</div>
  )
}

function StarsAnimation() {
  return (
    <div className="flex gap-2 items-center" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
      {['✨', '⭐', '✨'].map((star, i) => (
        <span key={i} className="text-3xl" style={{ animation: `pulseFade 2s ease-in-out ${i * 0.4}s infinite`, display: 'inline-block' }}>
          {star}
        </span>
      ))}
    </div>
  )
}
