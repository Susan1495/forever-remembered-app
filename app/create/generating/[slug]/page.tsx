/**
 * Screen 3: Generation loading screen
 * Route: /create/generating/[slug]
 */

import { GenerationLoader } from '@/components/create/GenerationLoader'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ relationship?: string }>
}

export default async function GeneratingPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { relationship } = await searchParams

  return (
    <GenerationLoader
      slug={slug}
      relationship={relationship}
    />
  )
}

export const metadata = {
  title: 'Creating your tribute… — Forever Remembered',
  robots: { index: false, follow: false },
}
