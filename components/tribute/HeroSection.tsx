/**
 * Tribute page hero section
 * Full-bleed hero photo, name, dates, AI headline
 */

interface HeroSectionProps {
  subjectName: string
  aiHeadline: string | null
  birthDate: string | null
  deathDate: string | null
  isLiving: boolean
  heroPhotoUrl: string | null
  templateId: string
}

export function HeroSection({
  subjectName,
  aiHeadline,
  birthDate,
  deathDate,
  isLiving,
  heroPhotoUrl,
  templateId,
}: HeroSectionProps) {
  const datesDisplay = formatDates(birthDate, deathDate, isLiving)

  return (
    <section className="tribute-hero relative" style={{ minHeight: '100svh' }}>
      {/* Background photo */}
      {heroPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroPhotoUrl}
          alt={`${subjectName}`}
          className="absolute inset-0 w-full h-full object-cover"
          priority-load="true"
        />
      ) : (
        // Gradient fallback when no photo
        <div
          className="absolute inset-0"
          style={{
            background: getGradientForTemplate(templateId),
          }}
        />
      )}

      {/* Overlay */}
      <div className="tribute-hero__overlay" />

      {/* Content */}
      <div className="tribute-hero__content">
        <h1 className="tribute-hero__name">{subjectName}</h1>

        {datesDisplay && (
          <p className="tribute-hero__dates">{datesDisplay}</p>
        )}

        {aiHeadline && (
          <p className="tribute-hero__headline">&ldquo;{aiHeadline}&rdquo;</p>
        )}
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-indicator"
        aria-hidden="true"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  )
}

function formatDates(
  birthDate: string | null,
  deathDate: string | null,
  isLiving: boolean
): string | null {
  if (!birthDate && !deathDate) {
    return isLiving ? null : 'Beloved always'
  }

  if (isLiving && birthDate) {
    const year = new Date(birthDate).getFullYear()
    return `Born ${year}`
  }

  const birthYear = birthDate ? new Date(birthDate).getFullYear() : null
  const deathYear = deathDate ? new Date(deathDate).getFullYear() : null

  if (birthYear && deathYear) {
    return `${birthYear} — ${deathYear}`
  }
  if (birthYear) return `Born ${birthYear}`
  if (deathYear) return `${deathYear}`

  return 'Beloved always'
}

function getGradientForTemplate(templateId: string): string {
  switch (templateId) {
    case 'classic':
      return 'linear-gradient(135deg, #1a1a2e 0%, #0a0a1a 100%)'
    case 'garden':
      return 'linear-gradient(135deg, #1a3a20 0%, #0d2015 100%)'
    case 'minimal':
      return 'linear-gradient(135deg, #374151 0%, #111827 100%)'
    default: // golden-hour
      return 'linear-gradient(135deg, #78340f 0%, #1C1007 100%)'
  }
}
