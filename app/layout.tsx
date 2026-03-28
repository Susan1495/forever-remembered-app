import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Forever Remembered — Create a free tribute for someone you love',
  description:
    'Upload a few photos. Write a few sentences. In under 2 minutes, we\'ll create a beautiful tribute page you can share with everyone who loved them. Free, always.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || 'https://foreverremembered.ai'),
  openGraph: {
    title: 'Forever Remembered — Create a free tribute for someone you love',
    description:
      'Upload a few photos. Write a few sentences. In under 2 minutes, we\'ll create a beautiful tribute page you can share with everyone who loved them.',
    type: 'website',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'A warm, soft memorial tribute page — made with love.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
