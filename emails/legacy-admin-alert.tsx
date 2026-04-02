/**
 * Legacy Admin Alert Email
 * Sent to Sal when a Legacy ($397) order is fulfilled.
 * Contains customer shipping address + print-ready PDF download link.
 */

import React from 'react'
import {
  Html, Head, Body, Container, Section, Text, Link, Hr, Preview,
} from '@react-email/components'

interface LegacyAdminAlertProps {
  subjectName: string
  customerEmail: string
  shippingAddress?: {
    name?: string
    line1?: string
    line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  } | null
  printReadyPdfUrl: string
  tributeUrl: string
  orderId: string
  amountFormatted: string
}

export function LegacyAdminAlertEmail({
  subjectName,
  customerEmail,
  shippingAddress,
  printReadyPdfUrl,
  tributeUrl,
  orderId,
  amountFormatted,
}: LegacyAdminAlertProps) {
  const hasAddress = shippingAddress?.line1

  return (
    <Html>
      <Head />
      <Preview>🖨️ New Legacy order — {subjectName} — ship to {shippingAddress?.name || customerEmail}</Preview>
      <Body style={{ backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '20px' }}>

          <Section style={{ backgroundColor: '#1C1007', borderRadius: '8px', padding: '24px', marginBottom: '20px' }}>
            <Text style={{ color: '#D97706', fontSize: '20px', fontWeight: '700', margin: 0 }}>
              🖨️ New Legacy Order — Action Required
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '8px 0 0' }}>
              A customer purchased the Legacy package ({amountFormatted}). Print and ship their hardcover book.
            </Text>
          </Section>

          <Section style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
            <Text style={{ fontSize: '11px', fontWeight: '700', color: '#9A7B5A', textTransform: 'uppercase' as const, letterSpacing: '0.8px', margin: '0 0 12px' }}>
              Order Details
            </Text>
            <Text style={{ fontSize: '15px', color: '#1C1007', margin: '0 0 6px' }}>
              <strong>Tribute:</strong> {subjectName}
            </Text>
            <Text style={{ fontSize: '15px', color: '#1C1007', margin: '0 0 6px' }}>
              <strong>Customer:</strong> {customerEmail}
            </Text>
            <Text style={{ fontSize: '15px', color: '#1C1007', margin: '0 0 6px' }}>
              <strong>Amount:</strong> {amountFormatted}
            </Text>
            <Text style={{ fontSize: '13px', color: '#9A7B5A', margin: '0' }}>
              Order ID: {orderId}
            </Text>
          </Section>

          {hasAddress ? (
            <Section style={{ backgroundColor: '#FEF9EE', border: '2px solid #D97706', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
              <Text style={{ fontSize: '11px', fontWeight: '700', color: '#9A7B5A', textTransform: 'uppercase' as const, letterSpacing: '0.8px', margin: '0 0 12px' }}>
                📦 Ship To
              </Text>
              <Text style={{ fontSize: '16px', fontWeight: '700', color: '#1C1007', margin: '0 0 4px' }}>
                {shippingAddress?.name}
              </Text>
              <Text style={{ fontSize: '15px', color: '#3D2B1A', margin: '0 0 2px' }}>{shippingAddress?.line1}</Text>
              {shippingAddress?.line2 && <Text style={{ fontSize: '15px', color: '#3D2B1A', margin: '0 0 2px' }}>{shippingAddress.line2}</Text>}
              <Text style={{ fontSize: '15px', color: '#3D2B1A', margin: '0 0 2px' }}>
                {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.postal_code}
              </Text>
              <Text style={{ fontSize: '15px', color: '#3D2B1A', margin: '0' }}>{shippingAddress?.country}</Text>
            </Section>
          ) : (
            <Section style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <Text style={{ fontSize: '14px', color: '#991B1B', margin: 0 }}>
                ⚠️ No shipping address collected. Reply to the customer at {customerEmail} to get their address.
              </Text>
            </Section>
          )}

          <Section style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
            <Text style={{ fontSize: '11px', fontWeight: '700', color: '#9A7B5A', textTransform: 'uppercase' as const, letterSpacing: '0.8px', margin: '0 0 12px' }}>
              📄 Print-Ready PDF
            </Text>
            <Text style={{ fontSize: '14px', color: '#3D2B1A', margin: '0 0 12px' }}>
              Download the print-ready PDF and order via FedEx Office, Staples, or your preferred print shop. Ask for a hardcover book with matte or gloss finish.
            </Text>
            <Link href={printReadyPdfUrl} style={{ backgroundColor: '#D97706', color: '#ffffff', padding: '12px 24px', borderRadius: '999px', fontSize: '14px', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>
              ↓ Download Print-Ready PDF
            </Link>
          </Section>

          <Section style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
            <Text style={{ fontSize: '11px', fontWeight: '700', color: '#9A7B5A', textTransform: 'uppercase' as const, letterSpacing: '0.8px', margin: '0 0 12px' }}>
              ✅ Fulfillment Checklist
            </Text>
            <Text style={{ fontSize: '14px', color: '#3D2B1A', margin: '0 0 6px' }}>□ Download print-ready PDF above</Text>
            <Text style={{ fontSize: '14px', color: '#3D2B1A', margin: '0 0 6px' }}>□ Order hardcover book at FedEx Office / Staples</Text>
            <Text style={{ fontSize: '14px', color: '#3D2B1A', margin: '0 0 6px' }}>□ Ship to address above via USPS Priority or UPS</Text>
            <Text style={{ fontSize: '14px', color: '#3D2B1A', margin: '0 0 6px' }}>□ Email customer tracking number</Text>
            <Text style={{ fontSize: '14px', color: '#3D2B1A', margin: '0' }}>□ View tribute: <Link href={tributeUrl} style={{ color: '#D97706' }}>{tributeUrl}</Link></Text>
          </Section>

          <Hr style={{ borderColor: '#E8DDD0', margin: '20px 0' }} />
          <Text style={{ fontSize: '12px', color: '#9A7B5A', textAlign: 'center' as const }}>
            Forever Remembered · Admin Alert · Order {orderId}
          </Text>

        </Container>
      </Body>
    </Html>
  )
}

export default LegacyAdminAlertEmail
