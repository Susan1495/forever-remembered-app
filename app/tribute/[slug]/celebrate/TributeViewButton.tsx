'use client'

/**
 * TributeViewButton — simple navigation button to the tribute page.
 * Always shows immediately — no spinner, no polling.
 * The tribute page handles any processing state gracefully.
 */

import { useRouter } from 'next/navigation'

interface Props {
  slug: string
  subjectName: string
  initialStatus: string
}

export function TributeViewButton({ slug, subjectName }: Props) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/tribute/${slug}?created=1`)}
      className="font-serif"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        background: '#3D2B14',
        color: '#fff',
        borderRadius: '999px',
        padding: '14px 28px',
        fontSize: '16px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {`View ${subjectName}'s Tribute →`}
    </button>
  )
}
