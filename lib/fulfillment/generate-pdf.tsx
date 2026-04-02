/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react/no-unescaped-entities */
/**
 * PDF Generation for Forever Remembered
 *
 * Generates a beautiful memorial tribute PDF using @react-pdf/renderer.
 * Works in Node.js on Vercel without any headless browser.
 *
 * Two variants:
 *   generateTributePDF()       — standard PDF (Keep tier, Cherish tier)
 *   generatePrintReadyPDF()    — high-res 8.5x11 print-ready (Legacy tier)
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import type { Tribute, TributePhoto } from '@/lib/types'

// ── Photo fetcher — converts CDN URLs to base64 PNG data URLs ───────────────
// @react-pdf/renderer has issues with progressive JPEGs ("Unknown version"
// error). We use sharp to convert all photos to standard PNG before rendering.
async function fetchPhotoAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())

    // Convert to PNG via sharp — fixes react-pdf progressive JPEG issues
    const sharp = (await import('sharp')).default
    const pngBuffer = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer()

    const base64 = pngBuffer.toString('base64')
    return `data:image/png;base64,${base64}`
  } catch {
    return null
  }
}

async function prefetchPhotos(photos: TributePhoto[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  await Promise.all(
    photos.slice(0, 6).map(async (p) => {
      const dataUrl = await fetchPhotoAsDataUrl(p.cdn_url)
      if (dataUrl) map.set(p.cdn_url, dataUrl)
    })
  )
  return map
}

// ── Register fonts ──────────────────────────────────────────────────────────
// Using system-safe fonts — no external font downloads needed at runtime
// @react-pdf/renderer includes Helvetica and Times-Roman by default

// ── Colour palette (warm amber, matches the app) ────────────────────────────
const C = {
  cream: '#FFFBF5',
  warmBrown: '#3D2B1A',
  amber: '#D97706',
  tan: '#9A7B5A',
  lightTan: '#F5EDE0',
  divider: '#E8DDD0',
  darkBrown: '#1C1007',
  medBrown: '#6B5A45',
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    backgroundColor: C.cream,
    paddingHorizontal: 48,
    paddingTop: 56,
    paddingBottom: 56,
    fontFamily: 'Times-Roman',
  },
  pagePrint: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 72,
    paddingTop: 72,
    paddingBottom: 72,
    fontFamily: 'Times-Roman',
  },

  // ── Cover page ──
  coverPage: {
    backgroundColor: C.amber,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  coverTitle: {
    fontFamily: 'Times-Roman',
    fontSize: 36,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  coverSubtitle: {
    fontFamily: 'Helvetica',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 32,
  },
  coverDates: {
    fontFamily: 'Times-Roman',
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 16,
  },
  coverBrand: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    letterSpacing: 1,
  },

  // ── Hero photo ──
  heroPhotoContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  heroPhoto: {
    width: 200,
    height: 260,
    borderRadius: 4,
  },
  heroPhotoPrint: {
    width: 240,
    height: 310,
  },

  // ── Text elements ──
  headline: {
    fontFamily: 'Times-Roman',
    fontSize: 26,
    color: C.darkBrown,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 1.3,
  },
  pullQuote: {
    fontFamily: 'Times-Roman',
    fontSize: 16,
    color: C.medBrown,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
    lineHeight: 1.5,
    paddingHorizontal: 16,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    marginVertical: 20,
  },
  sectionLabel: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.tan,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bodyText: {
    fontFamily: 'Times-Roman',
    fontSize: 13,
    color: C.warmBrown,
    lineHeight: 1.7,
    marginBottom: 16,
  },
  printBodyText: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
    color: '#333333',
    lineHeight: 1.8,
    marginBottom: 16,
  },

  // ── Photo grid ──
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  photoGridItem: {
    width: '48%',
    height: 120,
    borderRadius: 3,
  },
  photoCaption: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.tan,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 8,
    fontStyle: 'italic',
  },

  // ── Footer ──
  pageFooter: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.divider,
    paddingTop: 8,
  },
  footerText: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: C.tan,
  },

  // ── Closing page ──
  closingPage: {
    backgroundColor: C.lightTan,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 64,
  },
  closingText: {
    fontFamily: 'Times-Roman',
    fontSize: 18,
    color: C.darkBrown,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 1.6,
    marginBottom: 24,
  },
  closingBrand: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.tan,
    textAlign: 'center',
    letterSpacing: 1,
  },
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDates(tribute: Tribute): string {
  const birth = formatDate(tribute.birth_date)
  const death = formatDate(tribute.death_date)
  if (birth && death) return `${birth} – ${death}`
  if (birth) return `Born ${birth}`
  if (death) return `${death}`
  return ''
}

// ── React PDF Document Components ───────────────────────────────────────────

interface TributePDFProps {
  tribute: Tribute
  photos: TributePhoto[]
  photoDataUrls?: Map<string, string>  // pre-fetched base64 data URLs
  isPrintReady?: boolean
}

// Helper: get photo src — use pre-fetched data URL if available, else CDN URL
function getPhotoSrc(cdnUrl: string, photoDataUrls?: Map<string, string>): string {
  return photoDataUrls?.get(cdnUrl) || cdnUrl
}

/**
 * Cover Page
 */
function CoverPage({ tribute }: { tribute: Tribute }) {
  const dates = formatDates(tribute)
  return (
    <Page size="LETTER" style={styles.coverPage}>
      <Text style={styles.coverSubtitle}>In Loving Memory</Text>
      <Text style={styles.coverTitle}>{tribute.subject_name}</Text>
      {dates ? <Text style={styles.coverDates}>{dates}</Text> : null}
      <Text style={styles.coverBrand}>Forever Remembered · foreverremembered.ai</Text>
    </Page>
  )
}

/**
 * Main tribute page — headline, pull quote, body text, optional photos
 */
function TributeMainPage({
  tribute,
  photos,
  photoDataUrls,
  isPrintReady = false,
}: TributePDFProps) {
  const pageStyle = isPrintReady ? styles.pagePrint : styles.page
  const bodyStyle = isPrintReady ? styles.printBodyText : styles.bodyText
  const heroPhoto = photos[0] || null
  const bodyContent = tribute.ai_body

  return (
    <Page size="LETTER" style={pageStyle}>
      {/* Hero photo */}
      {heroPhoto && (
        <View style={styles.heroPhotoContainer}>
          <Image
            src={getPhotoSrc(heroPhoto.cdn_url, photoDataUrls)}
            style={isPrintReady ? styles.heroPhotoPrint : styles.heroPhoto}
          />
        </View>
      )}

      {/* Name + headline */}
      {tribute.ai_headline ? (
        <Text style={styles.headline}>{tribute.ai_headline}</Text>
      ) : (
        <Text style={styles.headline}>{tribute.subject_name}</Text>
      )}

      {/* Pull quote */}
      {tribute.ai_pull_quote && (
        <Text style={styles.pullQuote}>"{tribute.ai_pull_quote}"</Text>
      )}

      <View style={styles.divider} />

      {/* Story sections */}
      {bodyContent?.opening && (
        <View>
          <Text style={bodyStyle}>{bodyContent.opening}</Text>
        </View>
      )}

      {bodyContent?.life && (
        <View>
          <Text style={styles.sectionLabel}>Life & Memories</Text>
          <Text style={bodyStyle}>{bodyContent.life}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.pageFooter}>
        <Text style={styles.footerText}>{tribute.subject_name}</Text>
        <Text style={styles.footerText}>Forever Remembered</Text>
      </View>
    </Page>
  )
}

/**
 * Legacy page — continued story + closing
 */
function TributeLegacyPage({
  tribute,
  photos,
  photoDataUrls,
  isPrintReady = false,
}: TributePDFProps) {
  const pageStyle = isPrintReady ? styles.pagePrint : styles.page
  const bodyStyle = isPrintReady ? styles.printBodyText : styles.bodyText
  const bodyContent = tribute.ai_body
  // Use photos 2-5 for the grid
  const gridPhotos = photos.slice(1, 5)

  return (
    <Page size="LETTER" style={pageStyle}>
      {/* Legacy & closing sections */}
      {bodyContent?.legacy && (
        <View>
          <Text style={styles.sectionLabel}>Legacy</Text>
          <Text style={bodyStyle}>{bodyContent.legacy}</Text>
        </View>
      )}

      {bodyContent?.closing && (
        <View>
          <Text style={styles.sectionLabel}>In Remembrance</Text>
          <Text style={bodyStyle}>{bodyContent.closing}</Text>
        </View>
      )}

      {/* Photo grid if we have extra photos */}
      {gridPhotos.length > 0 && (
        <View>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Photo Memories</Text>
          <View style={styles.photoGrid}>
            {gridPhotos.map((photo) => (
              <View key={photo.id} style={{ width: '48%', marginBottom: 8 }}>
                <Image
                  src={getPhotoSrc(photo.cdn_url, photoDataUrls)}
                  style={styles.photoGridItem}
                />
                {tribute.ai_photo_captions?.[photo.id] && (
                  <Text style={styles.photoCaption}>
                    {tribute.ai_photo_captions[photo.id]}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.pageFooter}>
        <Text style={styles.footerText}>{tribute.subject_name}</Text>
        <Text style={styles.footerText}>Forever Remembered</Text>
      </View>
    </Page>
  )
}

/**
 * Closing page
 */
function ClosingPage({ tribute }: { tribute: Tribute }) {
  const dates = formatDates(tribute)
  return (
    <Page size="LETTER" style={styles.closingPage}>
      <Text style={styles.closingText}>
        {tribute.ai_pull_quote
          ? `"${tribute.ai_pull_quote}"`
          : `In loving memory of ${tribute.subject_name}.`}
      </Text>
      {dates && <Text style={{ ...styles.closingText, fontSize: 13 }}>{dates}</Text>}
      <View style={styles.divider} />
      <Text style={styles.closingBrand}>Forever Remembered · foreverremembered.ai</Text>
      <Text
        style={{
          ...styles.closingBrand,
          marginTop: 4,
          color: '#bba98a',
          fontSize: 9,
        }}
      >
        This tribute was lovingly created and preserved for your family.
      </Text>
    </Page>
  )
}

/**
 * Single-page memorial card (Keep tier)
 * Portrait A5-style — name, dates, photo, pull quote, brief text
 */
function MemorialCardDocument({ tribute, photos, photoDataUrls }: TributePDFProps) {
  const dates = formatDates(tribute)
  const heroPhoto = photos[0] || null
  const pullQuote = tribute.ai_pull_quote
  const opening = tribute.ai_body?.opening || tribute.subject_bio || ''
  const preview = opening.length > 160 ? opening.slice(0, 160).trimEnd() + '…' : opening

  return (
    <Document
      title={`${tribute.subject_name} — Memorial Card`}
      author="Forever Remembered"
    >
      <Page size={[288, 432]} style={{
        backgroundColor: '#FFF8F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 22,
        paddingBottom: 28,
      }}>
        {/* Ornament */}
        <Text style={{ fontSize: 9, color: '#C2874A', letterSpacing: 4, marginBottom: 8 }}>✦  ✦  ✦</Text>

        {/* In Loving Memory */}
        <Text style={{ fontFamily: 'Helvetica', fontSize: 6, color: '#A07850', letterSpacing: 2, marginBottom: 6 }}>IN LOVING MEMORY</Text>

        {/* Name */}
        <Text style={{ fontFamily: 'Times-Roman', fontSize: 20, color: '#2C1A0E', textAlign: 'center', marginBottom: 4 }}>{tribute.subject_name}</Text>

        {/* Dates */}
        {dates ? <Text style={{ fontFamily: 'Times-Roman', fontSize: 9, color: '#8B6545', fontStyle: 'italic', marginBottom: 10 }}>{dates}</Text> : null}

        {/* Divider */}
        <View style={{ width: 36, height: 1, backgroundColor: '#C2874A', marginBottom: 10 }} />

        {/* Hero photo */}
        {heroPhoto && (
          <Image
            src={getPhotoSrc(heroPhoto.cdn_url, photoDataUrls)}
            style={{ width: 110, height: 130, marginBottom: 10 }}
          />
        )}

        {/* Pull quote */}
        {pullQuote && (
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 8, fontStyle: 'italic', color: '#6B4A28', textAlign: 'center', lineHeight: 1.6, marginBottom: 8, paddingHorizontal: 6 }}>
            "{pullQuote}"
          </Text>
        )}

        {/* Body preview */}
        {preview ? (
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 7, color: '#4A3018', textAlign: 'center', lineHeight: 1.7 }}>
            {preview}
          </Text>
        ) : null}

        {/* Footer */}
        <View style={{ position: 'absolute', bottom: 14, left: 0, right: 0, alignItems: 'center' }}>
          <View style={{ width: 24, height: 1, backgroundColor: 'rgba(139,90,43,0.3)', marginBottom: 4 }} />
          <Text style={{ fontFamily: 'Helvetica', fontSize: 5, color: '#B08050', letterSpacing: 1.5 }}>FOREVER REMEMBERED</Text>
          <Text style={{ fontFamily: 'Helvetica', fontSize: 5, color: '#C2A070', letterSpacing: 0.5, marginTop: 1 }}>foreverremembered.ai</Text>
        </View>
      </Page>
    </Document>
  )
}

/**
 * Full PDF Document
 */
function TributeDocument({ tribute, photos, photoDataUrls, isPrintReady = false }: TributePDFProps) {
  const bodyContent = tribute.ai_body
  const hasExtendedContent = bodyContent?.legacy || bodyContent?.closing || photos.length > 1

  return (
    <Document
      title={`${tribute.subject_name} — Forever Remembered`}
      author="Forever Remembered"
      subject={`Memorial tribute for ${tribute.subject_name}`}
      creator="foreverremembered.ai"
      producer="Forever Remembered"
    >
      <CoverPage tribute={tribute} />
      <TributeMainPage tribute={tribute} photos={photos} photoDataUrls={photoDataUrls} isPrintReady={isPrintReady} />
      {hasExtendedContent && (
        <TributeLegacyPage tribute={tribute} photos={photos} photoDataUrls={photoDataUrls} isPrintReady={isPrintReady} />
      )}
      <ClosingPage tribute={tribute} />
    </Document>
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a 1-page memorial card PDF (Keep tier)
 * Portrait A5 — name, dates, photo, pull quote, brief text
 */
export async function generateMemorialCardPDF(
  tribute: Tribute,
  photos: TributePhoto[]
): Promise<Buffer> {
  const photoDataUrls = await prefetchPhotos(photos)
  return renderToBuffer(<MemorialCardDocument tribute={tribute} photos={photos} photoDataUrls={photoDataUrls} />)
}

/**
 * Generate a standard memorial PDF (Keep / Cherish tiers)
 * Returns a Buffer containing the PDF bytes
 */
export async function generateTributePDF(
  tribute: Tribute,
  photos: TributePhoto[]
): Promise<Buffer> {
  const photoDataUrls = await prefetchPhotos(photos)
  return renderToBuffer(<TributeDocument tribute={tribute} photos={photos} photoDataUrls={photoDataUrls} isPrintReady={false} />)
}

/**
 * Generate a print-ready PDF (Legacy tier)
 * High-res, 8.5x11 LETTER, optimised for professional printing
 */
export async function generatePrintReadyPDF(
  tribute: Tribute,
  photos: TributePhoto[]
): Promise<Buffer> {
  const photoDataUrls = await prefetchPhotos(photos)
  return renderToBuffer(<TributeDocument tribute={tribute} photos={photos} photoDataUrls={photoDataUrls} isPrintReady={true} />)
}
