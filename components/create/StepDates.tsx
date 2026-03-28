'use client'

/**
 * Step 1c: Birth and death dates (both optional)
 */

interface StepDatesProps {
  birthDate: string
  deathDate: string
  onBirthChange: (value: string) => void
  onDeathChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}

export function StepDates({
  birthDate,
  deathDate,
  onBirthChange,
  onDeathChange,
  onNext,
  onBack,
}: StepDatesProps) {
  // Infer living status
  const isLiving = birthDate && !deathDate

  return (
    <div className="space-y-5">
      <p className="text-sm text-brown-400 italic">
        These are optional — fill in what you know.
      </p>

      {/* Two date inputs side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-brown-500 mb-1.5 font-medium">
            Born
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={e => onBirthChange(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full text-base text-brown-900 bg-amber-50/50 border border-brown-200 focus:border-amber-500 outline-none rounded-xl px-3 py-3 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-brown-500 mb-1.5 font-medium">
            Passed
          </label>
          <input
            type="date"
            value={deathDate}
            onChange={e => onDeathChange(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full text-base text-brown-900 bg-amber-50/50 border border-brown-200 focus:border-amber-500 outline-none rounded-xl px-3 py-3 transition-colors"
          />
        </div>
      </div>

      {/* Living person indicator */}
      {isLiving && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm text-amber-700 font-serif">
            ✨ This will be a celebration tribute — honoring someone still with us.
          </p>
        </div>
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
          Continue →
        </button>
      </div>
    </div>
  )
}
