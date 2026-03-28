'use client'

/**
 * Step 1a: Name input
 * Large single-line text field, warm whisper text below
 */

interface StepNameProps {
  value: string
  onChange: (value: string) => void
  onNext: () => void
}

export function StepName({ value, onChange, onNext }: StepNameProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onNext()
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Their full name, or what you called them"
          maxLength={100}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          className="w-full text-xl text-brown-900 font-serif bg-transparent border-b-2 border-brown-200 focus:border-amber-500 outline-none py-3 placeholder:text-brown-300 transition-colors"
          style={{ fontSize: '20px' }} // Prevent iOS auto-zoom
          aria-label="Their name"
        />
      </div>

      <p className="text-xs text-brown-400 italic">
        This is theirs. Say it however felt right.
      </p>

      <button
        onClick={onNext}
        disabled={!value.trim()}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-brown-200 disabled:text-brown-400 text-white font-serif font-semibold text-lg rounded-full py-4 px-8 transition-all duration-200 min-h-[56px] disabled:cursor-not-allowed"
      >
        Continue →
      </button>
    </div>
  )
}
