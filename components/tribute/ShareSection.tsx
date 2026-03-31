'use client'

/**
 * ShareSection — inline sharing strip shown between StorySection and PhotoGallery.
 * Provides Facebook, Email, and Copy Link share actions without requiring
 * the native share sheet.
 */

import { useState } from 'react'

interface ShareSectionProps {
  slug: string
  subjectName: string
}

export function ShareSection({ slug, subjectName }: ShareSectionProps) {
  const [copied, setCopied] = useState(false)

  const tributeUrl = `https://foreverremembered.ai/tribute/${slug}`
  const encodedUrl = encodeURIComponent(tributeUrl)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(tributeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers / restricted contexts
      const textarea = document.createElement('textarea')
      textarea.value = tributeUrl
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <section
      aria-label={`Share ${subjectName}'s tribute`}
      style={{
        padding: '32px 20px',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        textAlign: 'center',
      }}
    >
      {/* Headline */}
      <h2
        style={{
          fontFamily: 'var(--font-serif, Georgia, serif)',
          color: 'var(--color-primary, #92400e)',
          fontSize: '1.2rem',
          fontWeight: 600,
          margin: '0 0 6px',
          lineHeight: 1.3,
        }}
      >
        Share {subjectName}&apos;s tribute
      </h2>

      {/* Subtext */}
      <p
        style={{
          fontFamily: 'var(--font-serif, Georgia, serif)',
          fontStyle: 'italic',
          color: 'var(--color-muted, #9B8B78)',
          fontSize: '0.9rem',
          margin: '0 0 24px',
          lineHeight: 1.5,
        }}
      >
        Every person who sees this was loved by someone too.
      </p>

      {/* Share buttons */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
          style={pillStyle('#1877F2')}
        >
          <FacebookIcon />
          <span>Facebook</span>
        </a>

        {/* Email */}
        <a
          href={`mailto:?subject=In memory of ${encodeURIComponent(subjectName)}&body=${encodeURIComponent(`I wanted to share this tribute with you. ${tributeUrl}`)}`}
          aria-label="Share via Email"
          style={pillStyle('#3D2B14')}
        >
          <EmailIcon />
          <span>Email</span>
        </a>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          aria-label={copied ? 'Link copied!' : 'Copy tribute link'}
          style={{
            ...pillStyle('#D97706'),
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-serif, Georgia, serif)',
            minWidth: '130px',
            transition: 'background-color 0.15s ease, transform 0.1s ease',
          }}
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
          <span>{copied ? '✓ Copied!' : 'Copy Link'}</span>
        </button>
      </div>
    </section>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function pillStyle(bg: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    backgroundColor: bg,
    color: '#FFFFFF',
    borderRadius: '999px',
    padding: '10px 20px',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-serif, Georgia, serif)',
    fontWeight: 600,
    textDecoration: 'none',
    lineHeight: 1,
    whiteSpace: 'nowrap' as const,
  }
}

// ── Icons (inline SVG, ~18px) ──────────────────────────────────────────────

function FacebookIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.93-1.956 1.885v2.288h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
