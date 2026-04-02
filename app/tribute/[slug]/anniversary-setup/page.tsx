/**
 * /tribute/[slug]/anniversary-setup
 *
 * Shown after a successful Cherish subscription checkout.
 * Collects key dates + family email addresses so we can send
 * AI-generated anniversary reminder emails automatically.
 *
 * Flow: Stripe success_url → this page → POST /api/anniversary/setup
 */

'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

interface FormState {
  dateOfBirth: string
  dateOfPassing: string
  customDate1: string
  customDate1Label: string
  customDate2: string
  customDate2Label: string
  familyEmails: string[]
}

const emptyForm = (): FormState => ({
  dateOfBirth: '',
  dateOfPassing: '',
  customDate1: '',
  customDate1Label: '',
  customDate2: '',
  customDate2Label: '',
  familyEmails: ['', '', '', '', ''],
})

export default function AnniversarySetupPage({ params }: Props) {
  const { slug } = use(params)
  const router = useRouter()

  const [form, setForm] = useState<FormState>(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ---------------- helpers ----------------

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function setFamilyEmail(index: number, value: string) {
    setForm((prev) => {
      const emails = [...prev.familyEmails]
      emails[index] = value
      return { ...prev, familyEmails: emails }
    })
  }

  // ---------------- submit ----------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const cleanEmails = form.familyEmails.map((e) => e.trim()).filter(Boolean)

    try {
      const res = await fetch('/api/anniversary/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tributeSlug: slug,
          dateOfBirth: form.dateOfBirth || undefined,
          dateOfPassing: form.dateOfPassing || undefined,
          customDate1: form.customDate1 || undefined,
          customDate1Label: form.customDate1Label || undefined,
          customDate2: form.customDate2 || undefined,
          customDate2Label: form.customDate2Label || undefined,
          familyEmails: cleanEmails,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }

      // Success — go to the tribute page
      router.push(`/tribute/${slug}?setup=done`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSubmitting(false)
    }
  }

  // ---------------- render ----------------

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>

        {/* Header */}
        <div style={headerStyle}>
          <div style={roseBadge}>🌹</div>
          <h1 style={headingStyle}>Your tribute is now Always Live!</h1>
          <p style={subheadStyle}>
            Set up anniversary reminders so your family receives a warm, personalised
            email on meaningful dates — automatically, every year.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── Key Dates ── */}
          <section style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Key dates to remember</h2>
            <p style={sectionHintStyle}>All dates are optional. We only send on the ones you add.</p>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Date of birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setField('dateOfBirth', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Date of passing</label>
              <input
                type="date"
                value={form.dateOfPassing}
                onChange={(e) => setField('dateOfPassing', e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Custom date 1 */}
            <div style={customDateRowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Custom date</label>
                <input
                  type="date"
                  value={form.customDate1}
                  onChange={(e) => setField('customDate1', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Label (e.g. &ldquo;Wedding Anniversary&rdquo;)</label>
                <input
                  type="text"
                  placeholder="e.g. Wedding Anniversary"
                  value={form.customDate1Label}
                  onChange={(e) => setField('customDate1Label', e.target.value)}
                  style={inputStyle}
                  maxLength={60}
                />
              </div>
            </div>

            {/* Custom date 2 */}
            <div style={customDateRowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Custom date (2nd)</label>
                <input
                  type="date"
                  value={form.customDate2}
                  onChange={(e) => setField('customDate2', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Label</label>
                <input
                  type="text"
                  placeholder="e.g. First met"
                  value={form.customDate2Label}
                  onChange={(e) => setField('customDate2Label', e.target.value)}
                  style={inputStyle}
                  maxLength={60}
                />
              </div>
            </div>
          </section>

          {/* ── Family Emails ── */}
          <section style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Family email addresses</h2>
            <p style={sectionHintStyle}>
              Add up to 5 email addresses. We&rsquo;ll send a warm, personalised email to each of them on the dates above.
            </p>

            {form.familyEmails.map((email, i) => (
              <div key={i} style={fieldGroupStyle}>
                <label style={labelStyle}>Email {i + 1}</label>
                <input
                  type="email"
                  placeholder="family@example.com"
                  value={email}
                  onChange={(e) => setFamilyEmail(i, e.target.value)}
                  style={inputStyle}
                />
              </div>
            ))}
          </section>

          {/* Error */}
          {error && (
            <p style={errorStyle}>{error}</p>
          )}

          {/* Actions */}
          <div style={actionsStyle}>
            <button
              type="submit"
              disabled={submitting}
              style={submitting ? { ...submitButtonStyle, opacity: 0.6, cursor: 'not-allowed' } : submitButtonStyle}
            >
              {submitting ? 'Saving…' : 'Save anniversary reminders →'}
            </button>

            <a href={`/tribute/${slug}`} style={skipLinkStyle}>
              Skip for now →
            </a>
          </div>

        </form>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #FFFBF5 0%, #FEF3E2 100%)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '40px 16px 80px',
  fontFamily: 'Georgia, "Times New Roman", serif',
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '20px',
  boxShadow: '0 4px 32px rgba(180,120,40,0.10)',
  padding: '40px 32px',
  maxWidth: '600px',
  width: '100%',
}

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '36px',
}

const roseBadge: React.CSSProperties = {
  fontSize: '48px',
  marginBottom: '16px',
  display: 'block',
}

const headingStyle: React.CSSProperties = {
  color: '#1C1007',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 12px',
  lineHeight: '1.25',
}

const subheadStyle: React.CSSProperties = {
  color: '#6B5A45',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '32px',
  paddingBottom: '32px',
  borderBottom: '1px solid #F0E8DC',
}

const sectionHeadingStyle: React.CSSProperties = {
  color: '#1C1007',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 6px',
}

const sectionHintStyle: React.CSSProperties = {
  color: '#9B8B78',
  fontSize: '13px',
  margin: '0 0 20px',
}

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: '16px',
}

const customDateRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  marginBottom: '16px',
  flexWrap: 'wrap',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#3D2B14',
  fontSize: '13px',
  fontWeight: '600',
  marginBottom: '6px',
  letterSpacing: '0.02em',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #E8DDD0',
  borderRadius: '10px',
  fontSize: '15px',
  fontFamily: 'inherit',
  color: '#3D2B14',
  background: '#FFFBF5',
  boxSizing: 'border-box',
  outline: 'none',
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  marginTop: '8px',
}

const submitButtonStyle: React.CSSProperties = {
  background: '#D97706',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '999px',
  padding: '16px 40px',
  fontSize: '16px',
  fontFamily: 'Georgia, serif',
  fontWeight: '600',
  cursor: 'pointer',
  width: '100%',
  maxWidth: '360px',
}

const skipLinkStyle: React.CSSProperties = {
  color: '#9B8B78',
  fontSize: '14px',
  textDecoration: 'none',
}

const errorStyle: React.CSSProperties = {
  color: '#B91C1C',
  fontSize: '14px',
  textAlign: 'center',
  margin: '0 0 16px',
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: '8px',
  padding: '10px 16px',
}
