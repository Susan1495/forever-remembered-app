/**
 * Supabase client setup
 * - Server client: uses service role key (full access, server-side only)
 * - Public client: uses anon key (client-side reads only)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Public client — safe for browser, read-only on published tributes
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey)

// Server client — full access, NEVER expose to browser
// Only import this in server components / API routes
export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
