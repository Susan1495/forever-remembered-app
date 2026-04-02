'use client'

/**
 * Step 2: Photo upload component
 * - Multi-select photo upload
 * - Direct-to-Supabase via presigned URLs
 * - Individual progress per photo
 * - 3-column grid with delete button
 */

import { useState, useRef, useCallback } from 'react'
import type { UploadedPhoto } from '@/lib/types'

const MAX_PHOTOS = 10
const MAX_FILE_SIZE_MB = 15
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'image/heif']

interface PhotoUploaderProps {
  photos: UploadedPhoto[]
  onPhotosChange: (photos: UploadedPhoto[]) => void
  extraContext: string
  onExtraContextChange: (value: string) => void
  creatorEmail: string
  onCreatorEmailChange: (value: string) => void
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
  nameValid: boolean
}

export function PhotoUploader({
  photos,
  onPhotosChange,
  extraContext,
  onExtraContextChange,
  creatorEmail,
  onCreatorEmailChange,
  onSubmit,
  onBack,
  isSubmitting,
  nameValid,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const remaining = MAX_PHOTOS - photos.length

      if (fileArray.length > remaining) {
        setError(`We'll use the first ${MAX_PHOTOS} — you can add more later.`)
      }

      const validFiles = fileArray.slice(0, remaining).filter(file => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          console.warn(`Skipping unsupported file type: ${file.type}`)
          return false
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          setError(`We had trouble with that photo. Try another, or skip for now.`)
          return false
        }
        return true
      })

      if (validFiles.length === 0) return

      // Create photo objects with preview URLs
      const newPhotos: UploadedPhoto[] = validFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        uploadProgress: 0,
        uploadStatus: 'pending',
      }))

      // Add to list immediately (optimistic UI)
      const updated = [...photos, ...newPhotos]
      onPhotosChange(updated)

      // Start uploading each photo
      for (const photo of newPhotos) {
        uploadPhoto(photo, updated, onPhotosChange)
      }
    },
    [photos, onPhotosChange]
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
      e.target.value = '' // Reset so same file can be re-selected
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleRemove = (photoId: string) => {
    const updated = photos.filter(p => p.id !== photoId)
    onPhotosChange(updated)
  }

  const canAddMore = photos.length < MAX_PHOTOS

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      {canAddMore && (
        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-amber-500 bg-amber-50'
              : 'border-brown-200 bg-amber-50/30 hover:border-amber-400 hover:bg-amber-50/60'
          }`}
          style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="text-4xl mb-2">📷</div>
          <p className="font-serif text-brown-700 text-base font-medium">
            Tap to choose photos
          </p>
          <p className="text-brown-400 text-sm hidden md:block">
            Or drag and drop
          </p>
          <p className="text-brown-400 text-xs">
            JPEG, PNG, HEIC, WebP · Up to {MAX_FILE_SIZE_MB}MB each
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/webp,image/heif"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="relative aspect-square">
              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover rounded-xl"
              />

              {/* Upload progress overlay */}
              {photo.uploadStatus === 'uploading' && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-end">
                  <div
                    className="h-1 bg-amber-500 rounded-full transition-all duration-200"
                    style={{ width: `${photo.uploadProgress}%` }}
                  />
                </div>
              )}

              {/* Error state */}
              {photo.uploadStatus === 'error' && (
                <div className="absolute inset-0 bg-red-900/60 rounded-xl flex items-center justify-center">
                  <p className="text-white text-xs text-center px-2">Tap to retry</p>
                </div>
              )}

              {/* First photo indicator */}
              {idx === 0 && photo.uploadStatus === 'done' && (
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  Cover
                </div>
              )}

              {/* Delete button */}
              <button
                onClick={() => handleRemove(photo.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                aria-label={`Remove photo ${idx + 1}`}
              >
                ×
              </button>
            </div>
          ))}

          {/* Add more button */}
          {canAddMore && photos.length > 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-brown-200 hover:border-amber-400 rounded-xl flex items-center justify-center text-brown-400 hover:text-amber-500 transition-colors"
            >
              <span className="text-2xl">+</span>
            </button>
          )}
        </div>
      )}

      {/* No photos prompt */}
      {photos.length === 0 && (
        <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100">
          <p className="text-brown-600 text-sm font-serif">
            No photos? That&apos;s okay.
          </p>
          <p className="text-brown-500 text-xs mt-1">
            We&apos;ll create something beautiful — just tell us a little more about them below.
          </p>
        </div>
      )}

      {/* Extra context textarea */}
      <div>
        <div className="h-px bg-brown-100 my-4" />
        <label className="block text-xs text-brown-400 mb-2">
          Anything else you&apos;d like us to know? <span className="italic">(optional)</span>
        </label>
        <textarea
          value={extraContext}
          onChange={e => onExtraContextChange(e.target.value)}
          rows={2}
          className="w-full text-base font-serif text-brown-900 bg-amber-50/30 border border-brown-200 focus:border-amber-500 outline-none rounded-xl px-4 py-3 transition-colors resize-none"
          style={{ fontSize: '16px' }}
        />
      </div>

      {/* Email capture */}
      <div>
        <div className="h-px bg-brown-100 my-4" />
        <label className="block text-xs text-brown-400 mb-2">
          Email address <span className="italic">(optional — we&apos;ll send you the link when it&apos;s ready)</span>
        </label>
        <input
          type="email"
          value={creatorEmail}
          onChange={e => onCreatorEmailChange(e.target.value)}
          placeholder="your@email.com"
          className="w-full text-base font-serif text-brown-900 bg-amber-50/30 border border-brown-200 focus:border-amber-500 outline-none rounded-xl px-4 py-3 transition-colors"
          style={{ fontSize: '16px' }}
          autoComplete="email"
          inputMode="email"
        />
      </div>

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={!nameValid || isSubmitting || photos.some(p => p.uploadStatus === 'uploading')}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-brown-200 disabled:text-brown-400 text-white font-serif font-semibold text-lg rounded-full py-4 px-8 transition-all duration-200 min-h-[56px] disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Starting…
          </>
        ) : photos.some(p => p.uploadStatus === 'uploading') ? (
          'Uploading photos…'
        ) : (
          "Create Their Tribute — It's Free"
        )}
      </button>

      <button
        onClick={onBack}
        className="w-full text-brown-400 hover:text-brown-600 text-sm text-center py-2 transition-colors"
      >
        ← Back to their story
      </button>
    </div>
  )
}

/**
 * Upload a single photo via presigned URL
 * Updates photos state with progress
 */
async function uploadPhoto(
  photo: UploadedPhoto,
  allPhotos: UploadedPhoto[],
  setPhotos: (photos: UploadedPhoto[]) => void
): Promise<void> {
  const updatePhoto = (updates: Partial<UploadedPhoto>) => {
    setPhotos(
      allPhotos.map(p => (p.id === photo.id ? { ...p, ...updates } : p))
    )
  }

  try {
    updatePhoto({ uploadStatus: 'uploading', uploadProgress: 0 })

    // Get presigned URL
    const presignRes = await fetch('/api/upload/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: [{ name: photo.file.name, type: photo.file.type, size: photo.file.size }],
      }),
    })

    if (!presignRes.ok) throw new Error('Failed to get upload URL')

    const { uploads } = await presignRes.json()
    const { presignedUrl, storagePath } = uploads[0]

    // Upload directly to Supabase Storage
    // For mock URLs, just simulate success
    if (presignedUrl.startsWith('/api/upload/mock')) {
      updatePhoto({
        uploadStatus: 'done',
        uploadProgress: 100,
        storagePath,
        uploadedUrl: presignedUrl,
      })
      return
    }

    const xhr = new XMLHttpRequest()
    await new Promise<void>((resolve, reject) => {
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          updatePhoto({ uploadProgress: progress })
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`))
        }
      }
      xhr.onerror = () => reject(new Error('Upload failed'))
      xhr.open('PUT', presignedUrl)
      xhr.setRequestHeader('Content-Type', photo.file.type)
      xhr.send(photo.file)
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const cdnUrl = supabaseUrl
      ? `${supabaseUrl}/storage/v1/object/public/tribute-photos/${storagePath}`
      : presignedUrl

    updatePhoto({
      uploadStatus: 'done',
      uploadProgress: 100,
      storagePath,
      uploadedUrl: cdnUrl,
    })
  } catch (error) {
    console.error('Upload failed:', error)
    updatePhoto({ uploadStatus: 'error', uploadProgress: 0 })
  }
}
