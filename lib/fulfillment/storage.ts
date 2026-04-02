/**
 * Fulfillment Storage
 *
 * Uploads generated PDFs to Supabase Storage and returns
 * signed (or public) download URLs.
 *
 * Bucket: fulfillment-files  (private — accessed via signed URLs)
 * Path pattern: {orderId}/{filename}.pdf
 */

import { createServerClient } from '@/lib/supabase'

const BUCKET = 'fulfillment-files'

/**
 * Ensure the fulfillment-files bucket exists.
 * Called once on first use — safe to call repeatedly.
 */
async function ensureBucket(): Promise<void> {
  const db = createServerClient()
  const { data: buckets } = await db.storage.listBuckets()
  const exists = buckets?.some((b) => b.name === BUCKET)

  if (!exists) {
    const { error } = await db.storage.createBucket(BUCKET, {
      public: false,
      allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
      fileSizeLimit: 52428800, // 50 MB
    })
    if (error) {
      throw new Error(`Failed to create storage bucket: ${error.message}`)
    }
    console.log(`Created Supabase storage bucket: ${BUCKET}`)
  }
}

/**
 * Upload a PDF buffer to Supabase storage.
 * Returns a signed URL valid for 365 days.
 */
export async function uploadPDF(
  orderId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  await ensureBucket()

  const db = createServerClient()
  const storagePath = `${orderId}/${filename}`

  // Upload (overwrite if exists — idempotent)
  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: true,
      cacheControl: '31536000', // 1 year cache
    })

  if (uploadError) {
    throw new Error(`Failed to upload PDF to storage: ${uploadError.message}`)
  }

  // Generate a signed URL valid for 1 year (365 days)
  const SECONDS_IN_YEAR = 365 * 24 * 60 * 60
  const { data: signedData, error: signError } = await db.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SECONDS_IN_YEAR)

  if (signError || !signedData?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${signError?.message}`)
  }

  return signedData.signedUrl
}

/**
 * Upload an image buffer (PNG, etc.) to Supabase storage.
 * Returns a signed URL valid for 365 days.
 */
export async function uploadImage(
  orderId: string,
  filename: string,
  buffer: Buffer,
  contentType: string = 'image/png'
): Promise<string> {
  await ensureBucket()

  const db = createServerClient()
  const storagePath = `${orderId}/${filename}`

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
      cacheControl: '31536000',
    })

  if (uploadError) {
    throw new Error(`Failed to upload image to storage: ${uploadError.message}`)
  }

  const SECONDS_IN_YEAR = 365 * 24 * 60 * 60
  const { data: signedData, error: signError } = await db.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SECONDS_IN_YEAR)

  if (signError || !signedData?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${signError?.message}`)
  }

  return signedData.signedUrl
}

/**
 * Upload multiple PDFs and return a map of filename → signed URL
 */
export async function uploadPDFs(
  orderId: string,
  files: Array<{ filename: string; buffer: Buffer }>
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}

  for (const { filename, buffer } of files) {
    results[filename] = await uploadPDF(orderId, filename, buffer)
  }

  return results
}
