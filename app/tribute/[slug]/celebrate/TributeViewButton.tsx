'use client'

/**
 * TributeViewButton — polls tribute status and navigates when published.
 * If the tribute is still processing, shows a spinner + "Getting it ready…"
 * and polls every 3s until published, then navigates automatically.
 * If already published, shows the normal "View Tribute" button.
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  slug: string
  subjectName: string
  initialStatus: string
}

export function TributeViewButton({ slug, subjectName, initialStatus }: Props) {
  const router = useRouter()
  // Treat any non-processing status as published (ready to navigate)
  const normalizeStatus = (s: string) => s === 'processing' ? 'processing' : 'published'
  const [status, setStatus] = useState(normalizeStatus(initialStatus))
  const [clicked, setClicked] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // If processing, auto-poll until published
  useEffect(() => {
    if (status === 'published') return

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/tribute/${slug}/status`)
        const data = await res.json()
        if (data.status === 'published') {
          setStatus('published')
          if (intervalRef.current) clearInterval(intervalRef.current)
          // Auto-navigate immediately — no click needed
          router.push(`/tribute/${slug}?created=1`)
        }
      } catch {
        // ignore network errors, keep polling
      }
    }, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [slug, status])

  const handleClick = () => {
    setClicked(true)
    if (status === 'published') {
      router.push(`/tribute/${slug}?created=1`)
    }
    // If still processing, just wait — the poll will navigate when ready
  }

  // Auto-navigate when status flips to published after user clicked
  useEffect(() => {
    if (status === 'published' && clicked) {
      router.push(`/tribute/${slug}?created=1`)
    }
  }, [status, clicked, slug, router])

  const isReady = status === 'published'

  return (
    <button
      onClick={handleClick}
      className="font-serif"
      disabled={!isReady && clicked}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        background: '#3D2B14',
        color: '#fff',
        borderRadius: '999px',
        padding: '14px 28px',
        fontSize: '16px',
        fontWeight: 600,
        border: 'none',
        cursor: isReady ? 'pointer' : 'default',
        opacity: 1,
      }}
    >
      {!isReady ? (
        <>
          <span
            style={{
              width: 16,
              height: 16,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          Getting it ready…
        </>
      ) : (
        `View ${subjectName}'s Tribute →`
      )}
    </button>
  )
}
