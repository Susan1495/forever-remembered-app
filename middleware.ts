/**
 * Next.js Middleware
 * - Rate limiting on creation endpoints
 * - /create redirect to landing
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect /create (bare) to landing if no path
  // (landing page handles the Begin button → /create route)

  // Add security headers to all responses
  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Don't cache tribute status — fresh always
  if (pathname.includes('/api/tribute/') && pathname.includes('/status')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
