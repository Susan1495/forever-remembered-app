'use client'

/**
 * Screen 1 & 2: Tribute creation flow
 * Route: /create
 * Single-page multi-step form — state managed in React, no sub-routes
 * Progress persisted to localStorage
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StepName } from '@/components/create/StepName'
import { StepBio } from '@/components/create/StepBio'
import { StepDates } from '@/components/create/StepDates'
import { StepRelationship } from '@/components/create/StepRelationship'
import { PhotoUploader } from '@/components/create/PhotoUploader'
import type { TributeFormData } from '@/lib/types'

// Sub-steps within the flow
type SubStep = 'name' | 'bio' | 'dates' | 'relationship' | 'photos'

const SUB_STEPS: SubStep[] = ['name', 'bio', 'dates', 'relationship', 'photos']

const EMPTY_FORM: TributeFormData = {
  subjectName: '',
  subjectBio: '',
  birthDate: '',
  deathDate: '',
  relationship: '',
  relationshipOther: '',
  extraContext: '',
  photos: [],
  creatorEmail: '',
}

const STORAGE_KEY = 'fr-creation-progress'

export default function CreatePage() {
  const router = useRouter()
  const [subStep, setSubStep] = useState<SubStep>('name')
  const [form, setForm] = useState<TributeFormData>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Load saved progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Don't restore photos — they can't be re-uploaded from localStorage
        setForm({ ...EMPTY_FORM, ...parsed, photos: [] })
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Save progress to localStorage (except photos — too large)
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { photos: _photos, ...saveable } = form
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveable))
    } catch {
      // Ignore storage errors
    }
  }, [form])

  const updateForm = (updates: Partial<TributeFormData>) => {
    setForm(prev => ({ ...prev, ...updates }))
  }

  const currentStepIdx = SUB_STEPS.indexOf(subStep)

  const goNext = () => {
    const next = SUB_STEPS[currentStepIdx + 1]
    if (next) setSubStep(next)
  }

  const goBack = () => {
    const prev = SUB_STEPS[currentStepIdx - 1]
    if (prev) setSubStep(prev)
  }

  const handleSubmit = async () => {
    if (!form.subjectName.trim()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Collect uploaded photo paths
      const photoStoragePaths = form.photos
        .filter(p => p.uploadStatus === 'done' && p.storagePath)
        .map(p => p.storagePath!)

      const res = await fetch('/api/tribute/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: form.subjectName.trim(),
          subjectBio: form.subjectBio.trim() || undefined,
          birthDate: form.birthDate || undefined,
          deathDate: form.deathDate || undefined,
          relationship: form.relationship || undefined,
          extraContext: form.extraContext.trim() || undefined,
          photoStoragePaths,
          creatorEmail: form.creatorEmail.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 429) {
          setSubmitError("You've created a few tributes recently. Please wait a bit before trying again.")
        } else {
          setSubmitError(data.error || 'Something went wrong on our end. Please try again.')
        }
        return
      }

      const { slug } = await res.json()

      // Clear localStorage progress
      localStorage.removeItem(STORAGE_KEY)

      // Navigate to generation loading screen
      router.push(`/create/generating/${slug}`)
    } catch {
      setSubmitError('Something went wrong on our end. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-brown-50">
      {/* Header */}
      <header className="px-5 pt-safe-top pb-4 flex items-center justify-between sticky top-0 bg-brown-50/95 backdrop-blur z-10 border-b border-brown-100/50">
        <a href="/" className="font-serif text-amber-600 text-sm tracking-wide">
          Forever Remembered
        </a>

        {/* Step dots */}
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i <= currentStepIdx
                  ? 'bg-amber-500'
                  : 'bg-brown-200'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Form content */}
      <div className="max-w-lg mx-auto px-5 py-8">
        {/* Step heading */}
        <div className="mb-8">
          {subStep !== 'photos' && (
            <>
              <p className="text-brown-400 text-sm mb-1">
                {subStep === 'name' ? 'Who are you honoring today?' : 'Tell us about them'}
              </p>
              <h1 className="font-serif text-2xl font-bold text-brown-900">
                {subStep === 'name' && 'Their name'}
                {subStep === 'bio' && 'A little about them'}
                {subStep === 'dates' && 'Important dates'}
                {subStep === 'relationship' && 'Your relationship to them'}
              </h1>
              {form.subjectName && subStep !== 'name' && (
                <p className="text-amber-600 font-serif text-sm mt-1">{form.subjectName}</p>
              )}
            </>
          )}

          {subStep === 'photos' && (
            <>
              <h1 className="font-serif text-2xl font-bold text-brown-900 mb-1">
                Add their photos
              </h1>
              <p className="text-brown-500 text-sm">
                Add a photo or two — or as many as you have.
              </p>
              <p className="text-brown-400 text-xs mt-1 italic">
                Don&apos;t worry if they&apos;re not perfect. These are memories, not magazine covers.
              </p>
            </>
          )}
        </div>

        {/* Error message */}
        {submitError && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-700 text-sm">{submitError}</p>
          </div>
        )}

        {/* Step content */}
        {subStep === 'name' && (
          <StepName
            value={form.subjectName}
            onChange={v => updateForm({ subjectName: v })}
            onNext={goNext}
          />
        )}

        {subStep === 'bio' && (
          <StepBio
            value={form.subjectBio}
            onChange={v => updateForm({ subjectBio: v })}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {subStep === 'dates' && (
          <StepDates
            birthDate={form.birthDate}
            deathDate={form.deathDate}
            onBirthChange={v => updateForm({ birthDate: v })}
            onDeathChange={v => updateForm({ deathDate: v })}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {subStep === 'relationship' && (
          <StepRelationship
            value={form.relationship}
            onChange={v => updateForm({ relationship: v })}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {subStep === 'photos' && (
          <PhotoUploader
            photos={form.photos}
            onPhotosChange={photos => updateForm({ photos })}
            extraContext={form.extraContext}
            onExtraContextChange={v => updateForm({ extraContext: v })}
            creatorEmail={form.creatorEmail}
            onCreatorEmailChange={v => updateForm({ creatorEmail: v })}
            onSubmit={handleSubmit}
            onBack={goBack}
            isSubmitting={isSubmitting}
            nameValid={!!form.subjectName.trim()}
          />
        )}
      </div>
    </main>
  )
}
