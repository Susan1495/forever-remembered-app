'use client'

/**
 * Step 1b: Biography textarea
 * Auto-expands, rotating placeholder, character indicator after 750
 */

import { useState, useEffect, useRef } from 'react'

const PLACEHOLDERS = [
  "What would you want a stranger to know about them?",
  "What made them laugh?",
  "What did they love most in this world?",
  "How did they make you feel when you were together?",
  "What's a memory you'll never forget?",
]

interface StepBioProps {
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}

export function StepBio({ value, onChange, onNext, onBack }: StepBioProps) {
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Rotate placeholder every 8s when focused with empty value
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  // Auto-expand textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  const charCount = value.length
  const showCharIndicator = charCount > 750

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          rows={4}
          className="w-full text-base font-serif text-brown-900 bg-amber-50/50 border border-brown-200 focus:border-amber-500 outline-none rounded-xl p-4 resize-none transition-colors placeholder:text-brown-300 leading-relaxed"
          style={{ minHeight: '120px' }}
          aria-label="Tell us about them"
        />

        {/* Character indicator — only after 750 */}
        {showCharIndicator && (
          <div className="absolute bottom-3 right-3 text-xs text-brown-400">
            {charCount}+
          </div>
        )}
      </div>

      {/* Nudge if empty */}
      {!value && (
        <p className="text-xs text-brown-400 italic">
          Even a few sentences helps us do them justice.
        </p>
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
          {value ? 'Add photos →' : 'Skip for now →'}
        </button>
      </div>
    </div>
  )
}
