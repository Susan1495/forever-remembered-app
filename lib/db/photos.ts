/**
 * Database operations for tribute photos
 */

import { createServerClient } from '@/lib/supabase'
import type { TributePhoto } from '@/lib/types'

export async function getTributePhotos(tributeId: string): Promise<TributePhoto[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from('tribute_photos')
    .select('*')
    .eq('tribute_id', tributeId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Failed to fetch tribute photos:', error)
    return []
  }
  return data as TributePhoto[]
}

export async function insertTributePhoto(
  tributeId: string,
  photo: {
    storage_path: string
    cdn_url: string
    display_order: number
    file_size_bytes?: number
    width?: number
    height?: number
  }
): Promise<TributePhoto> {
  const db = createServerClient()
  const { data, error } = await db
    .from('tribute_photos')
    .insert({
      tribute_id: tributeId,
      ...photo,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to insert tribute photo: ${error?.message}`)
  }
  return data as TributePhoto
}

export async function updateTributePhoto(
  photoId: string,
  updates: Partial<{
    focal_point_x: number | null
    focal_point_y: number | null
  }>
): Promise<void> {
  const db = createServerClient()
  const { error } = await db
    .from('tribute_photos')
    .update(updates)
    .eq('id', photoId)

  if (error) {
    throw new Error(`Failed to update tribute photo ${photoId}: ${error.message}`)
  }
}

export async function insertTributePhotos(
  tributeId: string,
  photos: Array<{
    storage_path: string
    cdn_url: string
    display_order: number
    file_size_bytes?: number
  }>
): Promise<void> {
  if (photos.length === 0) return

  const db = createServerClient()
  const { error } = await db.from('tribute_photos').insert(
    photos.map(p => ({
      tribute_id: tributeId,
      ...p,
    }))
  )

  if (error) {
    throw new Error(`Failed to insert tribute photos: ${error.message}`)
  }
}
