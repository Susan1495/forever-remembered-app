'use client'

/**
 * MemoriesSection — guestbook for tribute pages
 * Visitors can read and (on paid tributes) add memories.
 * Free tributes show an upsell prompt instead of the form.
 */

import { useState, useEffect, useRef } from 'react'
import type { Memory } from '@/lib/db/memories'

interface MemoriesSectionProps {
  slug: string
  onUpgrade: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function MemoryCard({ memory }: { memory: Memory }) {
  return (
    <div
      style={{
        background: '#FFFBF5',
        border: '1px solid #E8D8C4',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(61, 43, 20, 0.06)',
        padding: '20px',
        marginBottom: '16px',
      }}
    >
      {memory.photo_url && (
        <img
          src={memory.photo_url}
          alt="Memory photo"
          style={{
            width: '100%',
            maxHeight: '240px',
            objectFit: 'cover',
            borderRadius: '8px',
            marginBottom: '14px',
          }}
        />
      )}
      <p
        style={{
          fontFamily: 'var(--font-serif, Georgia, serif)',
          fontSize: '1rem',
          lineHeight: '1.65',
          color: '#3D2B14',
          marginBottom: '12px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {memory.body}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontWeight: 700,
            fontSize: '0.875rem',
            color: '#3D2B14',
          }}
        >
          {memory.author_name}
        </span>
        <span style={{ color: '#E8D8C4' }}>·</span>
        <span
          style={{
            fontSize: '0.775rem',
            color: '#9B8B78',
            fontFamily: 'var(--font-serif, Georgia, serif)',
          }}
        >
          {formatDate(memory.created_at)}
        </span>
      </div>
    </div>
  )
}

export function MemoriesSection({ slug, onUpgrade }: MemoriesSectionProps) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  // Fetch memories on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tribute/${slug}/memories`)
        if (res.ok) {
          const data = await res.json()
          setMemories(data.memories ?? [])
        }
      } catch {
        // Non-fatal — just show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  // Scroll form into view when it opens
  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [showForm])

  const handleAddClick = () => {
    setShowForm(true)
    setSubmitError(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setAuthorName('')
    setBody('')
    setSubmitError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch(`/api/tribute/${slug}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: authorName.trim() || 'Anonymous',
          body: body.trim(),
        }),
      })

      if (res.status === 402) {
        // Free tier — trigger upsell
        setShowForm(false)
        onUpgrade()
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.error || 'Something went wrong. Please try again.')
        return
      }

      const data = await res.json()
      // Prepend new memory to list
      setMemories((prev) => [data.memory, ...prev])
      setShowForm(false)
      setAuthorName('')
      setBody('')
    } catch {
      setSubmitError('Could not save memory. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section
      style={{
        padding: '48px 20px',
        backgroundColor: 'var(--color-background, #FFFBF5)',
        borderTop: '1px solid #E8D8C4',
      }}
    >
      {/* Section header */}
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
        }}
      >
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif, Georgia, serif)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#3D2B14',
              margin: 0,
            }}
          >
            Memories
          </h2>
          {!loading && memories.length > 0 && (
            <p
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontSize: '0.875rem',
                color: '#9B8B78',
                margin: '4px 0 0',
              }}
            >
              {memories.length} {memories.length === 1 ? 'memory' : 'memories'} shared
            </p>
          )}
        </div>

        {/* Inline add-memory form */}
        {showForm && (
          <div
            ref={formRef}
            style={{
              background: '#fff',
              border: '1px solid #E8D8C4',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 4px 16px rgba(61, 43, 20, 0.08)',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#3D2B14',
                margin: '0 0 16px',
              }}
            >
              Share a Memory
            </h3>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name (optional)"
                maxLength={80}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #E8D8C4',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontSize: '0.9rem',
                  color: '#3D2B14',
                  background: '#FFFBF5',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#D97706')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E8D8C4')}
              />

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share a memory, story, or message..."
                maxLength={2000}
                rows={5}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #E8D8C4',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontSize: '0.9rem',
                  color: '#3D2B14',
                  background: '#FFFBF5',
                  marginBottom: '8px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  outline: 'none',
                  lineHeight: '1.6',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#D97706')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E8D8C4')}
              />

              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#9B8B78',
                  textAlign: 'right',
                  margin: '0 0 16px',
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                }}
              >
                {body.length}/2000
              </p>

              {submitError && (
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: '#b91c1c',
                    marginBottom: '12px',
                    fontFamily: 'var(--font-serif, Georgia, serif)',
                  }}
                >
                  {submitError}
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  style={{
                    padding: '10px 18px',
                    border: '1px solid #E8D8C4',
                    borderRadius: '24px',
                    background: 'transparent',
                    fontFamily: 'var(--font-serif, Georgia, serif)',
                    fontSize: '0.875rem',
                    color: '#9B8B78',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !body.trim()}
                  style={{
                    background:
                      submitting || !body.trim()
                        ? '#E8D8C4'
                        : 'linear-gradient(135deg, #92400e, #D97706)',
                    color: submitting || !body.trim() ? '#9B8B78' : '#fff',
                    border: 'none',
                    borderRadius: '24px',
                    padding: '10px 22px',
                    fontFamily: 'var(--font-serif, Georgia, serif)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: submitting || !body.trim() ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                >
                  {submitting ? 'Sharing…' : 'Share Memory'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 0',
              color: '#9B8B78',
              fontFamily: 'var(--font-serif, Georgia, serif)',
              fontSize: '0.9rem',
            }}
          >
            Loading memories…
          </div>
        )}

        {/* Empty state */}
        {!loading && memories.length === 0 && !showForm && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: '#FFFBF5',
              border: '1px dashed #E8D8C4',
              borderRadius: '12px',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontSize: '1rem',
                color: '#9B8B78',
                margin: '0 0 16px',
              }}
            >
              Be the first to share a memory.
            </p>
            <button
              onClick={handleAddClick}
              style={{
                background: 'linear-gradient(135deg, #92400e, #D97706)',
                color: '#fff',
                border: 'none',
                borderRadius: '24px',
                padding: '10px 22px',
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(217, 119, 6, 0.3)',
              }}
            >
              ✍️ Add a Memory
            </button>
          </div>
        )}

        {/* Memory cards */}
        {!loading && memories.length > 0 && (
          <div>
            {memories.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
