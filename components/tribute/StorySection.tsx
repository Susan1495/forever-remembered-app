/**
 * Tribute story section
 * AI-generated biography with pull quote
 */

import type { TributeBody } from '@/lib/types'

interface StorySectionProps {
  body: TributeBody | null
  pullQuote: string | null
}

export function StorySection({ body, pullQuote }: StorySectionProps) {
  if (!body) return null

  return (
    <section className="tribute-section py-12">
      {/* Opening paragraph */}
      {body.opening && (
        <p className="tribute-section">{body.opening}</p>
      )}

      {/* Pull quote */}
      {pullQuote && (
        <blockquote className="tribute-pull-quote my-8">
          {pullQuote}
        </blockquote>
      )}

      {/* Life paragraph */}
      {body.life && (
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', lineHeight: '1.8', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          {body.life}
        </p>
      )}

      {/* Legacy paragraph */}
      {body.legacy && (
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', lineHeight: '1.8', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          {body.legacy}
        </p>
      )}

      {/* Closing paragraph */}
      {body.closing && (
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', lineHeight: '1.8', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
          {body.closing}
        </p>
      )}
    </section>
  )
}
