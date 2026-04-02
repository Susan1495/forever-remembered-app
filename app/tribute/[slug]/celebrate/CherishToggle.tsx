'use client'

/**
 * CherishToggle — Monthly / Annual billing toggle for the Cherish tier card.
 * Isolated client island so it doesn't affect server component scroll behavior.
 */

import { useState } from 'react'
import { CheckoutButton } from './CheckoutButton'

interface CherishToggleProps {
  tributeSlug: string
}

export function CherishToggle({ tributeSlug }: CherishToggleProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  const isAnnual = billing === 'annual'

  return (
    <div>
      {/* Toggle */}
      <div
        style={{
          display: 'inline-flex',
          background: '#F5EDE0',
          borderRadius: '999px',
          padding: '3px',
          marginBottom: '16px',
          border: '1px solid #E8DDD0',
        }}
      >
        <button
          onClick={() => setBilling('monthly')}
          className="font-serif"
          style={{
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: !isAnnual ? '#D97706' : 'transparent',
            color: !isAnnual ? '#fff' : '#9B8B78',
          }}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling('annual')}
          className="font-serif"
          style={{
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: isAnnual ? '#D97706' : 'transparent',
            color: isAnnual ? '#fff' : '#9B8B78',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          Annual
          <span
            style={{
              background: isAnnual ? 'rgba(255,255,255,0.25)' : '#D97706',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '999px',
            }}
          >
            Save 34%
          </span>
        </button>
      </div>

      {/* Price display */}
      <div style={{ marginBottom: '16px' }}>
        <div
          className="font-serif"
          style={{ color: '#D97706', fontSize: '30px', fontWeight: 700, marginBottom: '2px' }}
        >
          {isAnnual ? '$79/yr' : '$9.99/mo'}
        </div>
        <p className="font-serif" style={{ color: '#9B8B78', fontSize: '13px' }}>
          {isAnnual ? 'billed annually — just $6.58/mo' : 'cancel anytime'}
        </p>
      </div>

      <CheckoutButton
        tributeSlug={tributeSlug}
        tier={isAnnual ? 'cherish_annual' : 'cherish_monthly'}
        label={`Choose Cherish ${isAnnual ? '— Annual' : '— Monthly'}`}
        highlight={true}
      />
    </div>
  )
}
