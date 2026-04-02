/**
 * Fulfillment Delivery Email
 *
 * Sent when fulfillment is complete — includes download links.
 * Used for Keep, Cherish, and Legacy tiers.
 */

import React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Preview,
  Button,
} from '@react-email/components'

interface FulfillmentDeliveryEmailProps {
  subjectName: string
  tributeUrl: string
  tier: 'keep' | 'cherish' | 'legacy' | 'cherish_monthly' | 'cherish_annual' | 'pdf'
  /** Download links by label */
  downloads: Array<{
    label: string
    url: string
    description?: string
  }>
  customerEmail: string
}

const TIER_TITLES: Record<string, string> = {
  keep: 'Your Memorial Book is Ready',
  cherish: 'Your Premium Memorial Book is Ready',
  legacy: 'Your Legacy Collection is Ready',
}

const TIER_INTROS: Record<string, string> = {
  keep: "Your memorial book for {name} has been lovingly prepared. Click below to download and keep it forever.",
  cherish:
    "Your premium 8-page memorial book for {name} is ready — beautifully designed with photos, tribute text, and a warm amber layout crafted to honour their memory. Download it to print, frame, or share with family.",
  legacy:
    "Your Legacy Collection for {name} is ready. We've prepared your full 8-page premium memorial book plus a print-ready edition — formatted for professional printing at FedEx, Staples, or your local print shop.",
}

const TIER_PRINT_NOTE: Record<string, string | null> = {
  keep: null,
  cherish: null,
  legacy:
    "Your print-ready PDF is formatted at A4 for professional printing. We recommend services like FedEx Print, Staples, or a local print shop for the best results. Ask for matte or gloss coated paper for a beautiful finish.",
}

export function FulfillmentDeliveryEmail({
  subjectName,
  tributeUrl,
  tier,
  downloads,
  customerEmail,
}: FulfillmentDeliveryEmailProps) {
  const title = TIER_TITLES[tier]
  const intro = TIER_INTROS[tier].replace('{name}', subjectName)
  const printNote = TIER_PRINT_NOTE[tier]

  return (
    <Html>
      <Head />
      <Preview>
        {title} — {subjectName}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>Forever Remembered</Text>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Text style={heading}>{title}</Text>

            <Text style={paragraph}>{intro}</Text>

            {/* Download links */}
            <Section style={downloadsBox}>
              <Text style={downloadsLabel}>Your Downloads</Text>
              {downloads.map((dl, i) => (
                <Section key={i} style={downloadItem}>
                  <Text style={downloadTitle}>{dl.label}</Text>
                  {dl.description && (
                    <Text style={downloadDesc}>{dl.description}</Text>
                  )}
                  <Link href={dl.url} style={downloadButton}>
                    ↓ Download
                  </Link>
                </Section>
              ))}
            </Section>

            {/* Print note for Legacy */}
            {printNote && (
              <Section style={noteBox}>
                <Text style={noteTitle}>🖨️ Printing Tips</Text>
                <Text style={noteText}>{printNote}</Text>
              </Section>
            )}

            <Hr style={divider} />

            {/* CTA to tribute page */}
            <Text style={paragraph}>
              You can also view {subjectName}&apos;s tribute page online anytime:
            </Text>
            <Section style={ctaSection}>
              <Link href={tributeUrl} style={ctaButton}>
                View {subjectName}&apos;s Tribute →
              </Link>
            </Section>

            <Hr style={divider} />

            <Text style={smallText}>
              Download links are valid for one year. If you need help, reply to this email or
              write to{' '}
              <Link href="mailto:support@foreverremembered.ai" style={link}>
                support@foreverremembered.ai
              </Link>
              .
            </Text>

            <Text style={smallText}>
              With care,
              <br />
              The Forever Remembered team
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Forever Remembered · Honoring those we love
            </Text>
            <Text style={footerText}>
              <Link href={`${tributeUrl}?unsubscribe=1`} style={footerLink}>
                Unsubscribe
              </Link>{' '}
              · You received this because you made a purchase on foreverremembered.ai
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default FulfillmentDeliveryEmail

// ── Styles ──────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#FFFBF5',
  fontFamily: 'Georgia, "Times New Roman", serif',
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0 20px',
}

const header: React.CSSProperties = {
  padding: '32px 0 24px',
  borderBottom: '1px solid #E8DDD0',
}

const logo: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#78340f',
  margin: 0,
  letterSpacing: '-0.3px',
}

const content: React.CSSProperties = {
  padding: '32px 0',
}

const heading: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: '700',
  color: '#1C1007',
  margin: '0 0 16px',
  lineHeight: '1.3',
}

const paragraph: React.CSSProperties = {
  fontSize: '16px',
  color: '#3D2B1A',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const downloadsBox: React.CSSProperties = {
  backgroundColor: '#F5EDE0',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
}

const downloadsLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#9A7B5A',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  margin: '0 0 12px',
  fontFamily: 'Arial, sans-serif',
}

const downloadItem: React.CSSProperties = {
  borderTop: '1px solid #E8DDD0',
  paddingTop: '12px',
  marginTop: '12px',
}

const downloadTitle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: '700',
  color: '#1C1007',
  margin: '0 0 4px',
}

const downloadDesc: React.CSSProperties = {
  fontSize: '13px',
  color: '#6B5A45',
  margin: '0 0 8px',
  fontStyle: 'italic',
}

const downloadButton: React.CSSProperties = {
  backgroundColor: '#D97706',
  color: '#ffffff',
  padding: '8px 20px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: '700',
  textDecoration: 'none',
  display: 'inline-block',
}

const noteBox: React.CSSProperties = {
  backgroundColor: '#FEF9EE',
  border: '1px solid #E8DDD0',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '16px 0',
}

const noteTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#3D2B1A',
  margin: '0 0 6px',
}

const noteText: React.CSSProperties = {
  fontSize: '13px',
  color: '#6B5A45',
  lineHeight: '1.6',
  margin: 0,
}

const ctaSection: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '20px 0 28px',
}

const ctaButton: React.CSSProperties = {
  backgroundColor: '#D97706',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '999px',
  fontSize: '16px',
  fontWeight: '700',
  textDecoration: 'none',
  display: 'inline-block',
}

const divider: React.CSSProperties = {
  borderColor: '#E8DDD0',
  margin: '28px 0',
}

const smallText: React.CSSProperties = {
  fontSize: '14px',
  color: '#6B5A45',
  lineHeight: '1.6',
  margin: '0 0 12px',
}

const link: React.CSSProperties = {
  color: '#D97706',
  textDecoration: 'none',
}

const footer: React.CSSProperties = {
  padding: '24px 0 32px',
  borderTop: '1px solid #E8DDD0',
}

const footerText: React.CSSProperties = {
  fontSize: '12px',
  color: '#9A7B5A',
  lineHeight: '1.6',
  margin: '4px 0',
  textAlign: 'center' as const,
  fontFamily: 'Arial, sans-serif',
}

const footerLink: React.CSSProperties = {
  color: '#9A7B5A',
  textDecoration: 'underline',
}
