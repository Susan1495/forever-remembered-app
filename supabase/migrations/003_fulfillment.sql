-- ============================================================
-- Phase 3 Migration: Fulfillment pipeline support
-- Forever Remembered
-- Run via Supabase dashboard SQL editor or: supabase db push
-- ============================================================

-- ============================================================
-- Storage: fulfillment-files bucket
-- This bucket stores generated PDFs for paid orders.
-- Bucket creation is handled by the app at runtime via the
-- Supabase JS client (ensureBucket() in lib/fulfillment/storage.ts).
-- This migration adds RLS policies for the bucket.
-- ============================================================

-- Ensure the bucket exists (idempotent)
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'fulfillment-files',
  'fulfillment-files',
  false,
  ARRAY['application/pdf'],
  52428800  -- 50 MB
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for fulfillment-files bucket
-- Only the service role can read/write (no public access)
-- Signed URLs are generated server-side via the service role key

-- Policy: service role can SELECT (used for signed URL generation)
CREATE POLICY "Service role can read fulfillment files"
  ON storage.objects
  FOR SELECT
  TO service_role
  USING (bucket_id = 'fulfillment-files');

-- Policy: service role can INSERT (used for PDF uploads)
CREATE POLICY "Service role can upload fulfillment files"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'fulfillment-files');

-- Policy: service role can UPDATE (upsert/overwrite)
CREATE POLICY "Service role can update fulfillment files"
  ON storage.objects
  FOR UPDATE
  TO service_role
  USING (bucket_id = 'fulfillment-files');

-- ============================================================
-- Orders table: ensure fulfillment_data column exists
-- (Already added in 002_orders.sql but adding IF NOT EXISTS for safety)
-- ============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment_data JSONB NULL;

-- ============================================================
-- Optional: Index on fulfillment status for monitoring queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status
  ON orders(status, created_at DESC)
  WHERE status IN ('processing', 'failed');

-- ============================================================
-- Notes for Sal:
-- 1. Run this migration in Supabase dashboard → SQL editor
-- 2. Add ADMIN_SECRET to Vercel env vars (any random string)
--    Used to protect the manual retry endpoint:
--    POST /api/fulfillment/retry with header x-admin-secret: YOUR_SECRET
-- 3. The fulfillment-files bucket is created automatically by the app
--    on first use, but you can verify it in Supabase → Storage
-- ============================================================
