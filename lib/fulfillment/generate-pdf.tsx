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
    width: '100%',
    maxHeight: 300,
    objectFit: 'cover',
    borderRadius: 4,
  },
  heroPhotoPrint: {
    width: '100%',
    maxHeight: 360,
    objectFit: 'cover',
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
    aspectRatio: 1.4,
    objectFit: 'cover',
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
  isPrintReady?: boolean
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
            src={heroPhoto.cdn_url}
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
                  src={photo.cdn_url}
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
 * Full PDF Document
 */
function TributeDocument({ tribute, photos, isPrintReady = false }: TributePDFProps) {
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
      <TributeMainPage tribute={tribute} photos={photos} isPrintReady={isPrintReady} />
      {hasExtendedContent && (
        <TributeLegacyPage tribute={tribute} photos={photos} isPrintReady={isPrintReady} />
      )}
      <ClosingPage tribute={tribute} />
    </Document>
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a standard memorial PDF (Keep / Cherish tiers)
 * Returns a Buffer containing the PDF bytes
 */
export async function generateTributePDF(
  tribute: Tribute,
  photos: TributePhoto[]
): Promise<Buffer> {
  return renderToBuffer(<TributeDocument tribute={tribute} photos={photos} isPrintReady={false} />)
}

/**
 * Generate a print-ready PDF (Legacy tier)
 * High-res, 8.5x11 LETTER, optimised for professional printing
 */
export async function generatePrintReadyPDF(
  tribute: Tribute,
  photos: TributePhoto[]
): Promise<Buffer> {
  return renderToBuffer(<TributeDocument tribute={tribute} photos={photos} isPrintReady={true} />)
}
