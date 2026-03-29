'use client'

/**
 * Client-side tribute page wrapper
 * Handles: theme switching, upsell drawer trigger, candle state
 */

import { useState, useEffect } from 'react'
import { HeroSection } from '@/components/tribute/HeroSection'
import { StorySection } from '@/components/tribute/StorySection'
import { PhotoGallery } from '@/components/tribute/PhotoGallery'
import { InteractionBar } from '@/components/tribute/InteractionBar'
import { UpsellDrawer } from '@/components/tribute/UpsellDrawer'
import { ThemeSwitcher } from '@/components/tribute/ThemeSwitcher'
import type { Tribute, TributePhoto, TemplateId } from '@/lib/types'

interface TributePageProps {
  tribute: Tribute
  photos: TributePhoto[]
  heroPhoto: TributePhoto | null
  isCreator: boolean
  orderSuccess?: boolean
}

export function TributePage({
  tribute,
  photos,
  heroPhoto,
  isCreator,
  orderSuccess = false,
}: TributePageProps) {
  const [theme, setTheme] = useState<TemplateId>(
    (tribute.template_id as TemplateId) || 'golden-hour'
  )
  const [showUpsell, setShowUpsell] = useState(false)
  const [upsellDismissed, setUpsellDismissed] = useState(false)
  const [showOrderBanner, setShowOrderBanner] = useState(orderSuccess)

  // Load saved theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(`theme-${tribute.slug}`)
    if (savedTheme) {
      setTheme(savedTheme as TemplateId)
    }
  }, [tribute.slug])

  const handleThemeChange = (newTheme: TemplateId) => {
    setTheme(newTheme)
    localStorage.setItem(`theme-${tribute.slug}`, newTheme)
  }

  // Show upsell drawer 30s after creator first views their tribute
  // Don't show if they just completed an order
  useEffect(() => {
    if (!isCreator || upsellDismissed || orderSuccess) return

    // Check if already dismissed in this session
    const dismissed = sessionStorage.getItem(`upsell-dismissed-${tribute.slug}`)
    if (dismissed) return

    const timeout = setTimeout(() => {
      setShowUpsell(true)
    }, 30000) // 30 seconds

    return () => clearTimeout(timeout)
  }, [isCreator, tribute.slug, upsellDismissed, orderSuccess])

  const handleUpsellClose = () => {
    setShowUpsell(false)
    setUpsellDismissed(true)
    sessionStorage.setItem(`upsell-dismissed-${tribute.slug}`, '1')
  }

  const handleShare = () => {
    // Trigger upsell on first share if creator and not already shown
    if (isCreator && !showUpsell && !upsellDismissed) {
      setShowUpsell(true)
    }
  }

  return (
    <div data-theme={theme} className="tribute-root">
      {/* Order success banner */}
      {showOrderBanner && (
        <div
          className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between gap-3"
          style={{
            background: 'linear-gradient(135deg, #78340f, #D97706)',
            paddingTop: 'calc(12px + env(safe-area-inset-top))',
          }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xl flex-shrink-0" aria-hidden="true">✨</span>
            <div>
              <p className="font-serif font-semibold text-white text-sm leading-tight">
                Your order is confirmed.
              </p>
              <p className="text-white/80 text-xs leading-snug font-serif">
                Thank you for preserving {tribute.subject_name}&apos;s tribute. We&apos;ll be in touch soon.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowOrderBanner(false)}
            className="flex-shrink-0 text-white/60 hover:text-white text-xl leading-none p-1 transition-colors"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Spacer so hero isn't hidden behind banner */}
      {showOrderBanner && <div style={{ height: '64px' }} aria-hidden="true" />}

      {/* Hero */}
      <HeroSection
        subjectName={tribute.subject_name}
        aiHeadline={tribute.ai_headline}
        birthDate={tribute.birth_date}
        deathDate={tribute.death_date}
        isLiving={tribute.is_living}
        heroPhotoUrl={heroPhoto?.cdn_url || null}
        templateId={theme}
        focalPointX={heroPhoto?.focal_point_x}
        focalPointY={heroPhoto?.focal_point_y}
      />

      {/* Story */}
      <StorySection
        body={tribute.ai_body}
        pullQuote={tribute.ai_pull_quote}
      />

      {/* Photo gallery (excludes hero photo) */}
      <PhotoGallery
        photos={photos}
        captions={tribute.ai_photo_captions}
        heroPhotoIdx={tribute.hero_photo_idx || 0}
      />

      {/* Theme switcher */}
      <div
        className="py-8 px-4"
        style={{
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-background)',
        }}
      >
        <ThemeSwitcher currentTheme={theme} onThemeChange={handleThemeChange} />
      </div>

      {/* Footer */}
      <footer
        className="px-5 py-10 text-center"
        style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}
      >
        {/* Closing line */}
        {tribute.ai_body?.closing && (
          <p
            className="font-serif italic mb-6 max-w-sm mx-auto"
            style={{ color: 'var(--color-muted)', fontSize: '1.05rem', lineHeight: '1.6' }}
          >
            {tribute.ai_body.closing}
          </p>
        )}

        {/* Eternal candle */}
        <div className="candle-flame inline-block text-3xl mb-4" aria-hidden="true">
          🕯️
        </div>

        {/* Wordmark */}
        <p className="mb-1" style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>
          Created on{' '}
          <a
            href="/"
            style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
            className="hover:underline"
          >
            Forever Remembered
          </a>
        </p>

        {/* Viral acquisition CTA */}
        <div
          className="mt-6 py-4 px-5 rounded-xl"
          style={{
            background: 'rgba(0,0,0,0.04)',
            maxWidth: '360px',
            margin: '24px auto 0',
          }}
        >
          <p
            className="font-serif text-sm mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            This tribute was created for free on Forever Remembered.
          </p>
          <a
            href="/"
            className="inline-block"
            style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-serif)' }}
          >
            Want to create one for someone you love? →
          </a>
        </div>

        {/* Spacer for sticky bar */}
        <div className="h-20" />
      </footer>

      {/* Sticky interaction bar */}
      <InteractionBar
        slug={tribute.slug}
        initialCandleCount={tribute.candle_count}
        subjectName={tribute.subject_name}
        onShare={handleShare}
      />

      {/* Upsell drawer */}
      <UpsellDrawer
        tributeId={tribute.id}
        tributeSlug={tribute.slug}
        subjectName={tribute.subject_name}
        heroPhotoUrl={heroPhoto?.cdn_url}
        isVisible={showUpsell}
        onClose={handleUpsellClose}
      />
    </div>
  )
}
