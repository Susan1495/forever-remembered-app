-- ============================================================
-- Migration 008: Memories table (guestbook for tribute pages)
-- Forever Remembered
-- Run via: supabase db push
-- ============================================================

CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribute_id UUID NOT NULL REFERENCES tributes(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  body TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS memories_tribute_id_idx ON memories(tribute_id);
