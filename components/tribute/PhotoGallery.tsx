/**
 * Tribute photo gallery
 * Layout adapts based on photo count:
 * 0: AI art full-width
 * 1: Large single frame
 * 2-3: 2-column grid
 * 4-6: 3-column masonry
 * 7-10: scrollable carousel
 */

import type { TributePhoto } from '@/lib/types'

interface PhotoGalleryProps {
  photos: TributePhoto[]
  captions: Record<string, string> | null
  heroPhotoIdx: number
}

export function PhotoGallery({ photos, captions, heroPhotoIdx }: PhotoGalleryProps) {
  // Hero photo is shown in the hero section, exclude it here if multiple photos
  const galleryPhotos = photos.length > 1
    ? photos.filter((_, i) => i !== heroPhotoIdx)
    : photos

  if (galleryPhotos.length === 0) return null

  const count = galleryPhotos.length

  return (
    <section className="py-8">
      <div className="max-w-2xl mx-auto px-4">
        {count === 1 && <SinglePhoto photo={galleryPhotos[0]} captions={captions} />}
        {count >= 2 && count <= 3 && <GridGallery photos={galleryPhotos} captions={captions} cols={2} />}
        {count >= 4 && count <= 6 && <GridGallery photos={galleryPhotos} captions={captions} cols={3} />}
        {count >= 7 && <CarouselGallery photos={galleryPhotos} captions={captions} />}
      </div>
    </section>
  )
}

function SinglePhoto({
  photo,
  captions,
}: {
  photo: TributePhoto
  captions: Record<string, string> | null
}) {
  const caption = captions?.[photo.id]

  return (
    <div className="text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.cdn_url}
        alt=""
        className="max-w-full mx-auto rounded-2xl shadow-xl"
        style={{
          maxHeight: '500px',
          objectFit: 'cover',
          border: '4px solid var(--color-surface)',
        }}
        loading="lazy"
      />
      {caption && (
        <p
          className="mt-3 text-sm italic"
          style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-serif)' }}
        >
          {caption}
        </p>
      )}
    </div>
  )
}

function GridGallery({
  photos,
  captions,
  cols,
}: {
  photos: TributePhoto[]
  captions: Record<string, string> | null
  cols: 2 | 3
}) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {photos.map(photo => {
        const caption = captions?.[photo.id]
        return (
          <div key={photo.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.cdn_url}
              alt={caption || ''}
              className="w-full rounded-xl shadow-md"
              style={{
                aspectRatio: '1',
                objectFit: 'cover',
              }}
              loading="lazy"
            />
            {caption && (
              <p
                className="mt-1.5 text-xs italic text-center"
                style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-serif)' }}
              >
                {caption}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CarouselGallery({
  photos,
  captions,
}: {
  photos: TributePhoto[]
  captions: Record<string, string> | null
}) {
  return (
    <div>
      {/* Main scrollable carousel */}
      <div
        className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {photos.map(photo => {
          const caption = captions?.[photo.id]
          return (
            <div
              key={photo.id}
              className="flex-none snap-center"
              style={{ width: '80vw', maxWidth: '320px' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.cdn_url}
                alt={caption || ''}
                className="w-full rounded-xl shadow-md"
                style={{ aspectRatio: '1', objectFit: 'cover' }}
                loading="lazy"
              />
              {caption && (
                <p
                  className="mt-1.5 text-xs italic text-center"
                  style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-serif)' }}
                >
                  {caption}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
        {photos.map((photo) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.id}
            src={photo.cdn_url}
            alt=""
            className="flex-none rounded-lg opacity-70 hover:opacity-100 cursor-pointer transition-opacity"
            style={{ width: 48, height: 48, objectFit: 'cover' as const }}
            loading="lazy"
          />
        ))}
      </div>
    </div>
  )
}
