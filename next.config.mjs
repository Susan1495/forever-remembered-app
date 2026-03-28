/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization — allow Supabase CDN domain
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        // DALL-E generated images
      },
    ],
  },

  // Disable powered-by header
  poweredByHeader: false,

  // Strict mode for better development experience
  reactStrictMode: true,

  // Log build errors more clearly
  typescript: {
    // Warns about type errors without blocking the build during development
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // ESLint — don't block builds for ESLint errors during development
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },

  experimental: {
    // Server actions for future use
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

export default nextConfig
