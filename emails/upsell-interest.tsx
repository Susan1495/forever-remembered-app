/**
 * "Ways to preserve your tribute" upsell email
 * Sent when user captures their email in the upsell drawer
 */

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

interface UpsellInterestEmailProps {
  subjectName: string
  tributeUrl: string
}

export function UpsellInterestEmail({
  subjectName,
  tributeUrl,
}: UpsellInterestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Ways to preserve {subjectName}&apos;s tribute</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={brandText}>Forever Remembered</Text>
          </Section>

          {/* Main content */}
          <Section style={contentSection}>
            <Heading style={headingStyle}>
              Thank you for creating {subjectName}&apos;s tribute.
            </Heading>

            <Text style={bodyText}>
              We&apos;re putting together options to preserve it permanently —
              from a beautiful PDF memorial book to a printed hardcover.
            </Text>

            <Text style={bodyText}>
              We&apos;ll be in touch shortly with the details.
            </Text>

            <Text style={bodyText}>
              In the meantime, {subjectName}&apos;s tribute is safe and ready to share.
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
              Preservation options will keep it permanently.
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
              You received this email because you expressed interest in preserving
              a tribute on Forever Remembered.
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
  padding: '32px 32px 0',
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

export default UpsellInterestEmail
