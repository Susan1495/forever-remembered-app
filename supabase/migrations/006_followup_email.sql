-- ============================================================
-- Migration 006: Add follow_up_sent to tributes
-- Forever Remembered — Phase 4 Email Automation
-- ============================================================

-- Track whether the 24-hour follow-up email has been sent.
-- The cron job (/api/cron/follow-up-email) checks this column
-- to avoid sending duplicates.

ALTER TABLE tributes
  ADD COLUMN IF NOT EXISTS follow_up_sent BOOLEAN NOT NULL DEFAULT false;

-- Index for cron job efficiency: finds eligible tributes quickly
CREATE INDEX IF NOT EXISTS idx_tributes_followup_cron
  ON tributes (status, created_at, follow_up_sent)
  WHERE status = 'published' AND follow_up_sent = false;
