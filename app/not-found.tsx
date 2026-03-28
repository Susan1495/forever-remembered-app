/**
 * 404 - Not Found page
 * Warm, empathetic — not a cold error page
 */

import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: '#FFFBF5' }}
    >
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-6">🕯️</div>

        <h1 className="font-serif text-2xl font-semibold text-brown-900 mb-3">
          This page doesn&apos;t exist yet.
        </h1>

        <p className="text-brown-500 text-sm leading-relaxed mb-8">
          This tribute doesn&apos;t exist yet — or the link may have changed.
          <br />
          If someone shared this link with you, try asking them for the updated version.
        </p>

        <Link
          href="/"
          className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-serif rounded-full px-6 py-3 transition-colors text-sm"
        >
          Create a tribute →
        </Link>
      </div>
    </main>
  )
}
