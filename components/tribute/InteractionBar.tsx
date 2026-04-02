'use client'

/**
 * Sticky interaction bar at bottom of tribute page
 * - Light a candle (tap → animation → count increments)
 * - Share button (native share sheet or copy link)
 */

import { useState, useEffect } from 'react'

interface InteractionBarProps {
  slug: string
  initialCandleCount: number
  subjectName: string
  onShare?: () => void
  /** Called after a visitor successfully lights a candle */
  onCandleLight?: () => void
  /** Called when the Preserve pill is tapped — opens the upsell drawer */
  onPreserve?: () => void
  /** Called when the Download pill is tapped — opens the upsell drawer */
  onDownload?: () => void
}

export function InteractionBar({
  slug,
  initialCandleCount,
  subjectName,
  onShare,
  onCandleLight,
  onPreserve,
  onDownload,
}: InteractionBarProps) {
  const [candleCount, setCandleCount] = useState(initialCandleCount)
  const [candleLit, setCandleLit] = useState(false)
  const [isLighting, setIsLighting] = useState(false)

  // Check localStorage if candle already lit in this session
  useEffect(() => {
    const lit = localStorage.getItem(`candle-${slug}`)
    if (lit) setCandleLit(true)
  }, [slug])

  const handleCandle = async () => {
    if (isLighting) return

    // Optimistic update
    setCandleLit(true)
    setCandleCount(c => c + 1)
    setIsLighting(true)

    // Persist to localStorage
    localStorage.setItem(`candle-${slug}`, '1')

    try {
      const res = await fetch(`/api/tribute/${slug}/candle`, {
        method: 'POST',
      })
      if (res.ok) {
        const { candleCount: serverCount } = await res.json()
        setCandleCount(serverCount)
      }
    } catch {
      // Optimistic update stands even on network error
    } finally {
      setIsLighting(false)
    }

    // Notify parent so it can trigger the upsell drawer
    onCandleLight?.()
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/tribute/${slug}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `In memory of ${subjectName}`,
          text: `${subjectName}'s tribute on Forever Remembered`,
          url,
        })
        onShare?.()
      } catch {
        // User cancelled — that's fine
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
      } catch {
        // Manual copy
        const el = document.createElement('input')
        el.value = url
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      onShare?.()
    }
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 safe-bottom z-50"
      style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.08), transparent)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div className="max-w-lg mx-auto px-4 pb-4 pt-3 flex items-center justify-between gap-3">
        {/* Candle button */}
        <button
          onClick={handleCandle}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all"
          style={{
            background: candleLit ? 'rgba(217, 119, 6, 0.15)' : 'rgba(255,255,255,0.9)',
            border: candleLit ? '1px solid rgba(217, 119, 6, 0.4)' : '1px solid rgba(0,0,0,0.1)',
            color: candleLit ? '#D97706' : '#374151',
          }}
          aria-label={candleLit ? `${candleCount} candles lit` : 'Light a candle'}
        >
          <span
            className={candleLit ? 'candle-flame' : ''}
            style={{ fontSize: '20px' }}
          >
            {candleLit ? '🕯️' : '🕯'}
          </span>
          <span className="text-sm font-medium">
            {candleLit ? `${candleCount} candles lit` : 'Light a candle'}
          </span>
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-amber-600 hover:bg-amber-700 text-white transition-colors"
          aria-label="Share this tribute"
        >
          <span style={{ fontSize: '18px' }}>📤</span>
          <span className="text-sm font-medium">Share</span>
        </button>

        {/* Preserve pill — opens upsell drawer */}
        {onPreserve && (
          <button
            onClick={onPreserve}
            className="flex-shrink-0 bg-amber-600 text-white rounded-full text-xs px-3 py-1.5 font-serif transition-colors hover:bg-amber-700 active:scale-95"
            aria-label="Preserve this tribute"
          >
            🕯️ Preserve
          </button>
        )}

        {/* Download pill — opens upsell drawer */}
        {onDownload && (
          <button
            onClick={onDownload}
            className="flex-shrink-0 rounded-full text-xs px-3 py-1.5 font-serif transition-colors active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(0,0,0,0.1)',
              color: '#374151',
            }}
            aria-label="Download memorial card"
          >
            📄 Download
          </button>
        )}
      </div>
    </div>
  )
}
