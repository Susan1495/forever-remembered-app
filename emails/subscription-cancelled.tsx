/**
 * Subscription cancelled email
 * Sent when a Cherish subscription is deleted/cancelled in Stripe.
 * Warm, respectful tone — acknowledges the loss, offers a path back.
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

interface SubscriptionCancelledEmailProps {
  subjectName: string
  tributeUrl: string
  resubscribeUrl: string
  customerEmail: string
}

export function SubscriptionCancelledEmail({
  subjectName,
  tributeUrl,
  resubscribeUrl,
  customerEmail,
}: SubscriptionCancelledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{subjectName}'s tribute has been paused — here's how to restore it</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>Forever Remembered</Text>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Text style={emoji}>🌹</Text>

            <Text style={heading}>{subjectName}&apos;s tribute has been paused</Text>

            <Text style={paragraph}>
              Your Cherish subscription has ended, so {subjectName}&apos;s tribute is now paused.
              The tribute and all of its memories are safe — nothing has been deleted.
            </Text>

            <Text style={paragraph}>
              Whenever you&apos;re ready, you can reactivate it in just a moment. The tribute will
              be live again immediately.
            </Text>

            {/* Resubscribe CTA */}
            <Section style={ctaSection}>
              <Link href={resubscribeUrl} style={ctaButton}>
                Restore {subjectName}&apos;s tribute →
              </Link>
            </Section>

            {/* Reassurance box */}
            <Section style={infoBox}>
              <Text style={infoBoxText}>
                <strong>Nothing is lost.</strong> All of {subjectName}&apos;s photos, story, and
                content remain intact. The page simply isn&apos;t publicly visible until you
                resubscribe.
              </Text>
            </Section>

            <Hr style={divider} />

            <Text style={smallText}>
              If you cancelled intentionally and have feedback, we&apos;d love to hear from you.
              Reply to this email or write to{' '}
              <Link href="mailto:support@foreverremembered.ai" style={link}>
                support@foreverremembered.ai
              </Link>
              .
            </Text>

            <Text style={paragraph}>
              <Link href={tributeUrl} style={link}>
                View {subjectName}&apos;s tribute page →
              </Link>
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
              This email was sent to {customerEmail} because your Cherish subscription on
              foreverremembered.ai has ended.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default SubscriptionCancelledEmail

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

const infoBox: React.CSSProperties = {
  margin: '0 0 20px',
}

const infoBoxText: React.CSSProperties = {
  fontSize: '14px',
  color: '#3D2B1A',
  lineHeight: '1.6',
  margin: 0,
  padding: '14px 18px',
  backgroundColor: '#F5EDE0',
  borderRadius: '10px',
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
