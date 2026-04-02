/**
 * Payment warning email
 * Sent when a Stripe invoice payment fails for a Cherish subscription.
 * Warm, gentle tone — reminds the customer their tribute will pause in 7 days.
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

interface PaymentWarningEmailProps {
  subjectName: string
  tributeUrl: string
  updatePaymentUrl: string
  customerEmail: string
}

export function PaymentWarningEmail({
  subjectName,
  tributeUrl,
  updatePaymentUrl,
  customerEmail,
}: PaymentWarningEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Action needed — update your payment to keep {subjectName}'s tribute alive</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>Forever Remembered</Text>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Text style={emoji}>🕯️</Text>

            <Text style={heading}>
              A gentle heads-up about {subjectName}&apos;s tribute
            </Text>

            <Text style={paragraph}>
              We weren&apos;t able to process your last payment. {subjectName}&apos;s tribute is
              still live right now, but it will pause in <strong>7 days</strong> if the payment
              isn&apos;t updated.
            </Text>

            <Text style={paragraph}>
              This is easy to fix — just update your payment method and everything continues as
              normal, with no interruption to the tribute.
            </Text>

            {/* CTA button */}
            <Section style={ctaSection}>
              <Link href={updatePaymentUrl} style={ctaButton}>
                Update payment method →
              </Link>
            </Section>

            <Text style={noteText}>
              If your payment doesn&apos;t update within 7 days, the tribute will pause (not
              delete). You can always reactivate it whenever you&apos;re ready.
            </Text>

            <Hr style={divider} />

            <Text style={paragraph}>
              <Link href={tributeUrl} style={link}>
                View {subjectName}&apos;s tribute →
              </Link>
            </Text>

            <Text style={smallText}>
              Questions? Reply to this email or write to us at{' '}
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
            <Text style={footerText}>Forever Remembered · Honoring those we love</Text>
            <Text style={footerText}>
              This email was sent to {customerEmail} because you have a Cherish subscription on
              foreverremembered.ai
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default PaymentWarningEmail

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

const emoji: React.CSSProperties = {
  fontSize: '40px',
  textAlign: 'center' as const,
  margin: '0 0 16px',
}

const heading: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#1C1007',
  margin: '0 0 20px',
  lineHeight: '1.3',
}

const paragraph: React.CSSProperties = {
  fontSize: '16px',
  color: '#3D2B1A',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const noteText: React.CSSProperties = {
  fontSize: '14px',
  color: '#6B5A45',
  lineHeight: '1.6',
  margin: '16px 0',
  padding: '14px 18px',
  backgroundColor: '#F5EDE0',
  borderRadius: '10px',
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
