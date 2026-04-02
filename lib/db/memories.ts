/**
 * Database operations for tribute memories (guestbook)
 * Server-side only — uses service role client
 */

import { createServerClient } from '@/lib/supabase'

export interface Memory {
  id: string
  tribute_id: string
  author_name: string
  body: string
  photo_url: string | null
  created_at: string
}

export async function createMemory({
  tributeId,
  authorName,
  body,
  photoUrl,
}: {
  tributeId: string
  authorName: string
  body: string
  photoUrl?: string | null
}): Promise<Memory> {
  const db = createServerClient()
  const { data, error } = await db
    .from('memories')
    .insert({
      tribute_id: tributeId,
      author_name: authorName || 'Anonymous',
      body,
      photo_url: photoUrl ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create memory: ${error?.message}`)
  }
  return data as Memory
}

export async function getMemories(tributeId: string): Promise<Memory[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from('memories')
    .select('*')
    .eq('tribute_id', tributeId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch memories: ${error.message}`)
  }
  return (data ?? []) as Memory[]
}
