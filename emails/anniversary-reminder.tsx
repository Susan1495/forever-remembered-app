/**
 * Anniversary Reminder Email
 *
 * Sent to family members on key dates (birthday, death anniversary, custom).
 * Warm, celebratory — not sad. Focused on the life lived.
 *
 * Props:
 *   subjectName    — full name of the person being remembered
 *   tributeUrl     — full URL to the tribute page
 *   reflection     — AI-generated 2-3 sentence reflection or short poem
 *   occasion       — e.g. "birthday", "anniversary", "Wedding Anniversary"
 *   heroPhotoUrl   — optional hero photo URL (EXIF-normalised for email)
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
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface AnniversaryReminderEmailProps {
  subjectName: string
  tributeUrl: string
  reflection: string
  occasion: string
  heroPhotoUrl?: string
  unsubscribeUrl?: string
}

export function AnniversaryReminderEmail({
  subjectName,
  tributeUrl,
  reflection,
  occasion,
  heroPhotoUrl,
  unsubscribeUrl,
}: AnniversaryReminderEmailProps) {
  const unsubUrl = unsubscribeUrl || `${tributeUrl}?unsubscribe=anniversary`

  return (
    <Html>
      <Head />
      <Preview>Remembering {subjectName} today 🌹</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          {/* Hero photo */}
          {heroPhotoUrl && (
            <Section style={heroSection}>
              <Img
                src={heroPhotoUrl}
                alt={`${subjectName}`}
                width="480"
                style={heroImage}
              />
            </Section>
          )}

          {/* Brand header */}
          <Section style={headerSection}>
            <Text style={brandText}>Forever Remembered</Text>
          </Section>

          {/* Rose divider */}
          <Section style={{ textAlign: 'center', padding: '4px 32px 0' }}>
            <Text style={roseAccent}>🌹</Text>
          </Section>

          {/* Main content */}
          <Section style={contentSection}>
            <Heading style={headingStyle}>
              Today we&rsquo;re thinking of {subjectName}
            </Heading>

            <Text style={occasionBadge}>
              {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
            </Text>

            {/* AI-generated reflection */}
            <Section style={reflectionBox}>
              <Text style={reflectionText}>
                &ldquo;{reflection}&rdquo;
              </Text>
            </Section>

            {/* CTA */}
            <Section style={buttonSection}>
              <Button href={tributeUrl} style={buttonStyle}>
                Visit {subjectName}&rsquo;s Tribute →
              </Button>
            </Section>

            <Text style={warmClosingText}>
              Their memory lives on — and so does their story.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerSignoff}>
              With love,
              <br />
              The Forever Remembered team
            </Text>
            <Text style={legalText}>
              You&rsquo;re receiving this because someone signed you up for anniversary
              reminders for {subjectName}&rsquo;s tribute.
              <br />
              <Link href={unsubUrl} style={linkStyle}>
                Unsubscribe from these reminders
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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

const heroSection = {
  padding: '0',
  overflow: 'hidden',
}

const heroImage = {
  width: '100%',
  maxWidth: '480px',
  height: 'auto',
  display: 'block',
}

const headerSection = {
  padding: '28px 32px 0',
}

const brandText = {
  color: '#D97706',
  fontSize: '13px',
  fontFamily: 'Georgia, serif',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  margin: '0',
}

const roseAccent = {
  fontSize: '32px',
  margin: '8px 0 0',
}

const contentSection = {
  padding: '20px 32px 32px',
}

const headingStyle = {
  color: '#1C1007',
  fontSize: '26px',
  fontFamily: 'Georgia, serif',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 12px',
}

const occasionBadge = {
  display: 'inline-block',
  background: '#FEF3E2',
  color: '#92400E',
  fontSize: '12px',
  fontFamily: 'Georgia, serif',
  fontWeight: '600',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  borderRadius: '999px',
  padding: '4px 14px',
  border: '1px solid #FDE68A',
  margin: '0 0 24px',
}

const reflectionBox = {
  backgroundColor: '#FFFBF5',
  border: '1px solid #F0E8DC',
  borderLeft: '4px solid #D97706',
  borderRadius: '0 12px 12px 0',
  padding: '20px 24px',
  margin: '0 0 28px',
}

const reflectionText = {
  color: '#3D2B14',
  fontSize: '16px',
  fontFamily: 'Georgia, serif',
  fontStyle: 'italic',
  lineHeight: '1.7',
  margin: '0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const buttonStyle = {
  backgroundColor: '#D97706',
  borderRadius: '999px',
  color: '#FFFFFF',
  display: 'inline-block',
  fontSize: '16px',
  fontFamily: 'Georgia, serif',
  fontWeight: '600',
  padding: '16px 36px',
  textDecoration: 'none',
}

const warmClosingText = {
  color: '#9B8B78',
  fontSize: '14px',
  fontStyle: 'italic',
  textAlign: 'center' as const,
  margin: '0',
}

const divider = {
  borderColor: '#F0E8DC',
  margin: '0',
}

const footerSection = {
  padding: '24px 32px 32px',
}

const footerSignoff = {
  color: '#3D2B14',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 20px',
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

export default AnniversaryReminderEmail
