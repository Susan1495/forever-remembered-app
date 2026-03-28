/**
 * Screen 3: Generation loading screen
 * Route: /create/generating/[slug]
 */

import { GenerationLoader } from '@/components/create/GenerationLoader'

interface PageProps {
  params: { slug: string }
  searchParams: { relationship?: string }
}

export default function GeneratingPage({ params, searchParams }: PageProps) {
  return (
    <GenerationLoader
      slug={params.slug}
      relationship={searchParams.relationship}
    />
  )
}

export const metadata = {
  title: 'Creating your tribute… — Forever Remembered',
  robots: { index: false, follow: false },
}
