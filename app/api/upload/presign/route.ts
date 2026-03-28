/**
 * POST /api/upload/presign
 * Get presigned URLs for direct-to-Supabase photo upload
 * Photos upload directly from browser to Supabase Storage (bypasses Vercel limits)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import type { PresignRequest, PresignResponse } from '@/lib/types'

const MAX_FILE_SIZE_MB = 15
const MAX_PHOTOS = 10
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'image/heif']

export async function POST(req: NextRequest) {
  let body: PresignRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.files || !Array.isArray(body.files)) {
    return NextResponse.json({ error: 'Files array required' }, { status: 400 })
  }

  if (body.files.length > MAX_PHOTOS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PHOTOS} photos allowed` },
      { status: 400 }
    )
  }

  // Validate each file
  for (const file of body.files) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      )
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large: maximum ${MAX_FILE_SIZE_MB}MB per photo` },
        { status: 400 }
      )
    }
  }

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    // Return mock presigned URLs for development
    const uploads = body.files.map(file => {
      const photoId = uuidv4()
      const ext = file.type.includes('png') ? 'png' : file.type.includes('heic') ? 'heic' : 'jpg'
      const storagePath = `temp/${photoId}.${ext}`
      return {
        presignedUrl: `/api/upload/mock?path=${storagePath}`,
        storagePath,
        photoId,
      }
    })
    return NextResponse.json({ uploads } as PresignResponse)
  }

  const db = createServerClient()

  try {
    const uploads = await Promise.all(
      body.files.map(async (file) => {
        const photoId = uuidv4()
        const ext = file.type.includes('png') ? 'png' 
          : file.type.includes('heic') ? 'heic' 
          : file.type.includes('webp') ? 'webp' 
          : 'jpg'
        const storagePath = `temp/${photoId}.${ext}`

        // Create presigned upload URL (60 min expiry)
        const { data, error } = await db.storage
          .from('tribute-photos')
          .createSignedUploadUrl(storagePath)

        if (error || !data) {
          throw new Error(`Failed to create presigned URL: ${error?.message}`)
        }

        return {
          presignedUrl: data.signedUrl,
          storagePath,
          photoId,
        }
      })
    )

    return NextResponse.json({ uploads } as PresignResponse)
  } catch (error) {
    console.error('Failed to create presigned URLs:', error)
    return NextResponse.json(
      { error: 'Failed to prepare upload. Please try again.' },
      { status: 500 }
    )
  }
}

// Need to install uuid
// npm install uuid @types/uuid
