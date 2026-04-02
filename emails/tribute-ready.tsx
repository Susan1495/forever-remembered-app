/**
 * "Your tribute is ready" email template
 * Sent when generation completes and creator_email is on record.
 * Includes soft upsell below the tribute link.
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
  celebrateUrl?: string
  heroPhotoUrl?: string
}

export function TributeReadyEmail({
  subjectName,
  tributeUrl,
  celebrateUrl,
  heroPhotoUrl,
}: TributeReadyEmailProps) {
  // Link for upsell CTA — celebrate page if provided, otherwise direct to tribute
  const upsellUrl = celebrateUrl || tributeUrl

  return (
    <Html>
      <Head />
      <Preview>Your tribute for {subjectName} is ready 🌹</Preview>
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
            <Heading style={headingStyle}>Your tribute for {subjectName} is ready 🌹</Heading>

            <Text style={bodyText}>
              We put together something we hope does them justice.
            </Text>

            <Text style={bodyText}>
              Take a moment. Read it. It&apos;s theirs now.
            </Text>

            {/* Primary CTA Button */}
            <Section style={buttonSection}>
              <Button href={tributeUrl} style={buttonStyle}>
                View {subjectName}&apos;s Tribute →
              </Button>
            </Section>

            <Hr style={divider} />

            {/* Share with family section */}
            <Section style={shareSectionStyle}>
              <Text style={shareHeadingStyle}>Share with family</Text>
              <Text style={shareIntroText}>
                We wrote something you can send right now:
              </Text>
              <Section style={shareQuoteBox}>
                <Text style={shareQuoteText}>
                  &ldquo;I just created a tribute for {subjectName} and wanted you to see it.
                  Take a moment &mdash;{' '}
                  <Link href={tributeUrl} style={shareLinkStyle}>
                    {tributeUrl}
                  </Link>
                  &rdquo;
                </Text>
              </Section>
              <Text style={shareFootnoteText}>(Feel free to make it your own.)</Text>
            </Section>

            <Hr style={divider} />

            {/* Soft upsell section */}
            <Section style={upsellSection}>
              <Text style={upsellHeading}>Want to preserve this forever?</Text>
              <Text style={upsellBody}>
                A tribute isn&apos;t a one-time thing. Upgrade to keep it alive so family and friends can add memories, photos, and stories for years to come. Starting at <strong>$9.99/month</strong>.
              </Text>

              {/* Upsell CTA — smaller, secondary */}
              <Section style={{ textAlign: 'center' as const, margin: '20px 0' }}>
                <Button href={upsellUrl} style={upsellButtonStyle}>
                  Preserve from $9.99 →
                </Button>
              </Section>
            </Section>
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
  fontSize: '26px',
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

const upsellSection = {
  backgroundColor: '#FFFBF5',
  borderRadius: '12px',
  padding: '20px',
  border: '1px solid #F0E8DC',
}

const upsellHeading = {
  color: '#1C1007',
  fontSize: '16px',
  fontFamily: 'Georgia, serif',
  fontWeight: '700',
  margin: '0 0 10px',
}

const upsellBody = {
  color: '#3D2B14',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}

const upsellButtonStyle = {
  backgroundColor: '#3D2B14',
  borderRadius: '999px',
  color: '#FFFFFF',
  display: 'inline-block',
  fontSize: '14px',
  fontFamily: 'Georgia, serif',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
}

// Share with family section styles
const shareSectionStyle = {
  marginBottom: '0',
}

const shareHeadingStyle = {
  color: '#1C1007',
  fontSize: '16px',
  fontFamily: 'Georgia, serif',
  fontWeight: '700',
  margin: '0 0 10px',
}

const shareIntroText = {
  color: '#3D2B14',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px',
}

const shareQuoteBox = {
  backgroundColor: '#FFFBF5',
  border: '1px solid #F0E8DC',
  borderRadius: '12px',
  padding: '20px',
  margin: '0 0 12px',
}

const shareQuoteText = {
  color: '#92400e',
  fontSize: '15px',
  fontFamily: 'Georgia, serif',
  fontStyle: 'italic',
  lineHeight: '1.65',
  margin: '0',
}

const shareLinkStyle = {
  color: '#92400e',
  textDecoration: 'underline',
}

const shareFootnoteText = {
  color: '#9B8B78',
  fontSize: '13px',
  fontStyle: 'italic',
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
