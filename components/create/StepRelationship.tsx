'use client'

/**
 * Step 1d: Relationship selector
 * Horizontal pill buttons that wrap
 */

import { useState } from 'react'

const RELATIONSHIPS = [
  'Parent',
  'Grandparent',
  'Child',
  'Sibling',
  'Partner/Spouse',
  'Friend',
  'Mentor',
  'Pet',
  'Other',
]

interface StepRelationshipProps {
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}

export function StepRelationship({
  value,
  onChange,
  onNext,
  onBack,
}: StepRelationshipProps) {
  const [showOther, setShowOther] = useState(value && !RELATIONSHIPS.slice(0, -1).includes(value) && value !== 'Other')
  const [otherValue, setOtherValue] = useState(
    value && !RELATIONSHIPS.includes(value) ? value : ''
  )

  const handleSelect = (rel: string) => {
    if (rel === 'Other') {
      setShowOther(true)
      onChange(otherValue || 'Other')
    } else {
      setShowOther(false)
      onChange(rel)
    }
  }

  const handleOtherChange = (val: string) => {
    setOtherValue(val)
    onChange(val)
  }

  const selectedBase = RELATIONSHIPS.includes(value) ? value : value ? 'Other' : ''

  return (
    <div className="space-y-5">
      {/* Pill selector */}
      <div className="flex flex-wrap gap-2">
        {RELATIONSHIPS.map(rel => (
          <button
            key={rel}
            onClick={() => handleSelect(rel)}
            className={`px-4 py-2 rounded-full text-sm font-serif transition-all min-h-[44px] border ${
              selectedBase === rel
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-transparent text-brown-600 border-brown-200 hover:border-amber-400'
            }`}
          >
            {rel}
          </button>
        ))}
      </div>

      {/* "Other" text input */}
      {showOther && (
        <input
          type="text"
          value={otherValue}
          onChange={e => handleOtherChange(e.target.value)}
          placeholder="How would you describe the relationship?"
          maxLength={50}
          autoFocus
          className="w-full text-base font-serif text-brown-900 bg-amber-50/50 border border-brown-200 focus:border-amber-500 outline-none rounded-xl px-4 py-3 transition-colors"
          style={{ fontSize: '16px' }}
        />
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-none bg-transparent border border-brown-200 text-brown-500 font-serif text-base rounded-full py-4 px-6 transition-all hover:border-brown-400 min-h-[56px]"
        >
          ← Back
        </button>

        <button
          onClick={onNext}
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-serif font-semibold text-base rounded-full py-4 px-6 transition-all duration-200 min-h-[56px]"
        >
          Add their photos →
        </button>
      </div>
    </div>
  )
}
