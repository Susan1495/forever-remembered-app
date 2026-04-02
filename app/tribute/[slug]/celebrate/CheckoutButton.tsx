'use client'

/**
 * Isolated checkout button — the ONLY client-side stateful element on the
 * celebrate page. Keeping state isolated here means re-renders from loading
 * state never affect the parent page scroll position on mobile Safari.
 */

import { useState } from 'react'

interface CheckoutButtonProps {
  tributeSlug: string
  tier: 'cherish' | 'legacy'
  label: string
  highlight: boolean
}

export function CheckoutButton({ tributeSlug, tier, label, highlight }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tributeSlug, tier }),
      })

      const data = await res.json()

      if (data.comingSoon) {
        window.location.href = `/tribute/${tributeSlug}`
        return
      }

      if (data.url) {
        window.location.href = data.url
        return
      }

      throw new Error(data.error || 'Something went wrong')
    } catch {
      setError('Unable to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="font-serif"
        style={{
          width: '100%',
          background: highlight ? '#D97706' : '#3D2B14',
          color: '#fff',
          border: 'none',
          borderRadius: '999px',
          padding: '14px 24px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minHeight: '52px',
        }}
      >
        {loading ? (
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
            Starting…
          </>
        ) : (
          label
        )}
      </button>
      {error && (
        <p style={{ color: '#991B1B', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  )
}
