/**
 * 24-hour follow-up email template
 * Sent 24h after tribute creation if no purchase has been made.
 * Subject: "The people you shared [Name]'s tribute with loved it 💛"
 */

import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface TributeFollowupEmailProps {
  subjectName: string
  tributeUrl: string
  celebrateUrl?: string
}

export function TributeFollowupEmail({
  subjectName,
  tributeUrl,
  celebrateUrl,
}: TributeFollowupEmailProps) {
  const upsellUrl = celebrateUrl || tributeUrl

  return (
    <Html>
      <Head />
      <Preview>The people you shared {subjectName}&apos;s tribute with loved it 💛</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={brandText}>Forever Remembered</Text>
          </Section>

          {/* Warm amber accent bar */}
          <div
            style={{
              height: '4px',
              background: 'linear-gradient(90deg, #D97706, #F59E0B, #D97706)',
            }}
          />

          {/* Main content */}
          <Section style={contentSection}>
            <Heading style={headingStyle}>
              The people you shared {subjectName}&apos;s tribute with loved it 💛
            </Heading>

            <Text style={bodyText}>
              Yesterday you created something truly meaningful. The tribute you made for{' '}
              {subjectName} has already been viewed and shared — and the people who saw it
              felt it.
            </Text>

            <Text style={bodyText}>
              That kind of love deserves to last.
            </Text>

            {/* Urgency section */}
            <Section style={urgencyBox}>
              <Text style={urgencyHeading}>⏳ Don&apos;t let it fade</Text>
              <Text style={urgencyBody}>
                Free tributes are available for 1 year. Make it permanent before the
                link expires — upgrade now and {subjectName}&apos;s tribute will be
                preserved forever.
              </Text>
            </Section>

            {/* Tier options — text-based, email-safe */}
            <Section style={tiersSection}>
              <Text style={tierRow}>
                <strong style={{ color: '#1C1007' }}>Keep — $39</strong>
                <br />
                <span style={{ color: '#6B5A45' }}>Permanent tribute page + shareable link + printable PDF card</span>
              </Text>

              <Hr style={tierDivider} />

              <Text style={tierRow}>
                <strong style={{ color: '#1C1007' }}>Cherish — $127</strong>
                {' '}
                <span style={badgeStyle}>Most Loved</span>
                <br />
                <span style={{ color: '#6B5A45' }}>Everything in Keep + 8-page memorial book PDF + photo restoration</span>
              </Text>

              <Hr style={tierDivider} />

              <Text style={tierRow}>
                <strong style={{ color: '#1C1007' }}>Legacy — $397</strong>
                <br />
                <span style={{ color: '#6B5A45' }}>Everything in Cherish + print-ready version for framing</span>
              </Text>
            </Section>

            {/* CTA */}
            <Section style={buttonSection}>
              <Button href={upsellUrl} style={buttonStyle}>
                Make it permanent →
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={mutedText}>
              Or{' '}
              <Link href={tributeUrl} style={linkStyle}>
                view the free tribute
              </Link>{' '}
              at any time.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              With care,
              <br />
              The Forever Remembered team
            </Text>
            <Hr style={divider} />
            <Text style={legalText}>
              You received this email because you created a tribute on Forever Remembered.
              <br />
              <Link href={`${tributeUrl}?unsubscribe=1`} style={linkStyle}>
                Unsubscribe
              </Link>
              {' · '}
              <Link href="https://foreverremembered.ai/privacy" style={linkStyle}>
                Privacy Policy
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const bodyStyle = {
  backgroundColor: '#FFFBF5',
  fontFamily: 'Georgia, "Times New Roman", serif',
  margin: '0',
  padding: '0',
}

const containerStyle = {
  maxWidth: '480px',
  margin: '0 auto',
  backgroundColor: '#FFFFFF',
}

const headerSection = {
  padding: '24px 32px 0',
}

const brandText = {
  color: '#D97706',
  fontSize: '14px',
  fontFamily: 'Georgia, serif',
  letterSpacing: '0.05em',
  margin: '0 0 16px',
}

const contentSection = {
  padding: '32px 32px 24px',
}

const headingStyle = {
  color: '#1C1007',
  fontSize: '24px',
  fontFamily: 'Georgia, serif',
  fontWeight: '700',
  lineHeight: '1.35',
  margin: '0 0 20px',
}

const bodyText = {
  color: '#3D2B14',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const urgencyBox = {
  backgroundColor: '#FEF3E2',
  borderRadius: '10px',
  padding: '16px 20px',
  margin: '24px 0',
  borderLeft: '3px solid #D97706',
}

const urgencyHeading = {
  color: '#92400E',
  fontSize: '15px',
  fontFamily: 'Georgia, serif',
  fontWeight: '700',
  margin: '0 0 8px',
}

const urgencyBody = {
  color: '#3D2B14',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}

const tiersSection = {
  margin: '24px 0',
}

const tierRow = {
  color: '#3D2B14',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
  padding: '10px 0',
}

const badgeStyle = {
  display: 'inline-block' as const,
  backgroundColor: '#D97706',
  color: '#FFFFFF',
  fontSize: '10px',
  fontFamily: 'Georgia, serif',
  fontWeight: '600',
  padding: '2px 8px',
  borderRadius: '999px',
  letterSpacing: '0.05em',
  verticalAlign: 'middle' as const,
  marginLeft: '6px',
}

const tierDivider = {
  borderColor: '#F0E8DC',
  margin: '4px 0',
}

const buttonSection = {
  margin: '32px 0 24px',
  textAlign: 'center' as const,
}

const buttonStyle = {
  backgroundColor: '#D97706',
  borderRadius: '999px',
  color: '#FFFFFF',
  display: 'inline-block',
  fontSize: '16px',
  fontFamily: 'Georgia, serif',
  fontWeight: '600',
  padding: '16px 32px',
  textDecoration: 'none',
}

const divider = {
  borderColor: '#F0E8DC',
  margin: '24px 0',
}

const mutedText = {
  color: '#6B5A45',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
  textAlign: 'center' as const,
}

const footerSection = {
  padding: '0 32px 32px',
}

const footerText = {
  color: '#3D2B14',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 24px',
}

const legalText = {
  color: '#9B8B78',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0',
}

const linkStyle = {
  color: '#D97706',
  textDecoration: 'underline',
}

export default TributeFollowupEmail
