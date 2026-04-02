/**
 * Order confirmation email
 * Sent when Stripe checkout completes successfully
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
} from '@react-email/components'

interface OrderConfirmationEmailProps {
  subjectName: string
  tributeUrl: string
  tier: 'keep' | 'cherish' | 'legacy' | 'cherish_monthly' | 'cherish_annual' | 'pdf'
  amountFormatted: string // e.g. "$39"
  customerEmail: string
}

const TIER_LABELS: Record<string, string> = {
  keep: 'Keep',
  cherish: 'Cherish',
  legacy: 'Legacy',
}

const TIER_TAGLINES: Record<string, string> = {
  keep: 'Permanent tribute page + PDF memorial card',
  cherish: 'Permanent tribute + photo restoration + memorial book PDF',
  legacy: 'The complete legacy package — digital + hardcover book',
}

const TIER_WHATS_NEXT: Record<string, string> = {
  keep: "We're preparing a beautiful PDF memorial card for you. You'll receive a download link within a few minutes.",
  cherish:
    "We're restoring photos, preparing your memorial book PDF, and creating a printable QR code. Everything will be ready within 15 minutes.",
  legacy:
    "We're preparing your complete legacy package — AI biography, video tribute, and your hardcover book order. The digital pieces will be ready within 30 minutes; your book ships within 7–10 days.",
}

export function OrderConfirmationEmail({
  subjectName,
  tributeUrl,
  tier,
  amountFormatted,
  customerEmail,
}: OrderConfirmationEmailProps) {
  const tierLabel = TIER_LABELS[tier]
  const tierTagline = TIER_TAGLINES[tier]
  const whatsNext = TIER_WHATS_NEXT[tier]

  return (
    <Html>
      <Head />
      <Preview>Your order for {subjectName}&apos;s tribute is confirmed ✨</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>Forever Remembered</Text>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Text style={heading}>Your order is confirmed.</Text>

            <Text style={paragraph}>
              Thank you for honoring {subjectName} with the {tierLabel} package ({amountFormatted}).
            </Text>

            <Text style={{ ...paragraph, color: '#6B5A45', fontSize: '14px' }}>
              {tierTagline}
            </Text>

            {/* Order summary box */}
            <Section style={orderBox}>
              <Text style={orderBoxLabel}>Order Summary</Text>
              <Text style={orderBoxRow}>
                <strong>{tierLabel} package</strong> — {amountFormatted}
              </Text>
              <Text style={orderBoxRow}>
                For: <strong>{subjectName}</strong>
              </Text>
              <Text style={orderBoxRow}>
                Confirmation sent to: {customerEmail}
              </Text>
            </Section>

            <Text style={paragraph}>
              <strong>What happens next:</strong>
            </Text>
            <Text style={paragraph}>{whatsNext}</Text>

            {/* CTA button */}
            <Section style={ctaSection}>
              <Link href={tributeUrl} style={ctaButton}>
                View {subjectName}&apos;s Tribute →
              </Link>
            </Section>

            <Hr style={divider} />

            <Text style={smallText}>
              If you have any questions, reply to this email or write to us at{' '}
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

export default OrderConfirmationEmail

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

const orderBox: React.CSSProperties = {
  backgroundColor: '#F5EDE0',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '24px 0',
}

const orderBoxLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#9A7B5A',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  margin: '0 0 8px',
  fontFamily: 'Arial, sans-serif',
}

const orderBoxRow: React.CSSProperties = {
  fontSize: '15px',
  color: '#3D2B1A',
  margin: '4px 0',
  lineHeight: '1.5',
}

const ctaSection: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '28px 0',
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
