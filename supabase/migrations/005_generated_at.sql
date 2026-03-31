-- ============================================================
-- Migration 005: Add generated_at timestamp to tributes
-- Records when AI generation pipeline completes successfully.
-- Distinct from published_at (which is set simultaneously) to
-- allow future decoupling (e.g., scheduled publish after generation).
-- ============================================================

ALTER TABLE tributes
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN tributes.generated_at IS 'Timestamp when AI generation pipeline completed successfully. Set alongside status=published.';

-- Backfill: for already-published tributes, use published_at as generated_at
UPDATE tributes
SET generated_at = published_at
WHERE status = 'published'
  AND published_at IS NOT NULL
  AND generated_at IS NULL;
