/**
 * "Your tribute is ready" email template
 * Sent when generation completes and creator_email is on record
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

interface TributeReadyEmailProps {
  subjectName: string
  tributeUrl: string
  heroPhotoUrl?: string
}

export function TributeReadyEmail({
  subjectName,
  tributeUrl,
  heroPhotoUrl,
}: TributeReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{subjectName}&apos;s tribute is ready ✨</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Hero photo if available */}
          {heroPhotoUrl && (
            <Section style={heroSection}>
              {/*
               * width="480" caps the rendered width in email clients that
               * honour the HTML attribute. height is intentionally omitted
               * so the client preserves the image's natural aspect ratio —
               * ensuring portrait photos display as portrait.
               *
               * The src URL must be EXIF-normalised before reaching here
               * (see buildEmailPhotoUrl in lib/email/send.ts) because email
               * clients do not read EXIF orientation tags; without that
               * normalisation, a portrait mobile photo would render landscape.
               */}
              <Img
                src={heroPhotoUrl}
                alt={`${subjectName}'s tribute`}
                width="480"
                style={heroImage}
              />
            </Section>
          )}

          {/* Header */}
          <Section style={headerSection}>
            <Text style={brandText}>Forever Remembered</Text>
          </Section>

          {/* Main content */}
          <Section style={contentSection}>
            <Heading style={headingStyle}>{subjectName}&apos;s tribute is ready.</Heading>

            <Text style={bodyText}>
              We put together something we hope does them justice.
            </Text>

            <Text style={bodyText}>
              Take a moment. Read it. It&apos;s theirs now.
            </Text>

            {/* CTA Button */}
            <Section style={buttonSection}>
              <Button href={tributeUrl} style={buttonStyle}>
                View {subjectName}&apos;s Tribute →
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={mutedText}>
              This tribute is free and will be available for 1 year.
              If you&apos;d like to preserve it permanently, we can help with that.
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

const heroSection = {
  padding: '0',
  overflow: 'hidden',
}

/**
 * Email-safe image styles.
 *
 * Key constraints for email clients:
 * - width="480" attribute on <Img> caps the render width; combined with
 *   style width:100% it scales down on narrow viewports without ever
 *   going wider than 480px.
 * - height="auto" / no fixed height → the image keeps its natural aspect
 *   ratio, so a portrait photo stays portrait.
 * - objectFit is intentionally omitted — it's unsupported in email clients
 *   and was previously masking orientation/sizing bugs.
 * - EXIF orientation is normalised server-side before the URL reaches here
 *   (see lib/email/send.ts → buildEmailPhotoUrl), so the pixels already
 *   reflect the correct orientation; we don't need any CSS rotation.
 */
const heroImage = {
  width: '100%',
  maxWidth: '480px',
  height: 'auto',
  display: 'block',
}

const headerSection = {
  padding: '24px 32px 0',
}

const brandText = {
  color: '#D97706',
  fontSize: '14px',
  fontFamily: 'Georgia, serif',
  letterSpacing: '0.05em',
  margin: '0',
}

const contentSection = {
  padding: '24px 32px',
}

const headingStyle = {
  color: '#1C1007',
  fontSize: '28px',
  fontFamily: 'Georgia, serif',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 20px',
}

const bodyText = {
  color: '#3D2B14',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const buttonSection = {
  margin: '32px 0',
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

export default TributeReadyEmail
