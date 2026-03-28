-- ============================================================
-- Phase 1 schema (Supabase / Postgres)
-- Run as migrations via Supabase CLI or dashboard
-- ============================================================

-- Tributes (core table)
CREATE TABLE tributes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,         -- e.g. "eleanor-hayes-xk7p2"
  
  -- Creator info (anonymous in Phase 1 — no auth)
  creator_email   TEXT NULL,                    -- captured post-creation or upsell
  creator_ip      TEXT NULL,                    -- for rate limiting, hashed
  
  -- Subject info
  subject_name    TEXT NOT NULL,
  subject_bio     TEXT,                         -- user-written description
  birth_date      DATE NULL,
  death_date      DATE NULL,
  relationship    TEXT NULL,                    -- "Parent", "Friend", etc.
  extra_context   TEXT NULL,                    -- optional Step 2 textarea
  is_living       BOOLEAN DEFAULT FALSE,        -- true = celebration mode
  subject_age_group TEXT NULL,                  -- 'adult' | 'child' | 'infant' | 'pet'
  
  -- AI output (stored as JSON columns)
  ai_headline     TEXT NULL,
  ai_pull_quote   TEXT NULL,
  ai_body         JSONB NULL,                   -- { opening, life, legacy, closing }
  ai_themes       TEXT[] NULL,                  -- ['gentle', 'family', 'humor']
  hero_photo_idx  INTEGER DEFAULT 0,
  template_id     TEXT NULL,                    -- 'golden-hour' | 'classic' | 'garden' | 'minimal'
  ai_photo_captions JSONB NULL,                 -- { "photo_id": "caption text" }
  
  -- Status
  status          TEXT NOT NULL DEFAULT 'processing', -- processing | published | failed | draft
  
  -- Engagement (Phase 1 simple counters)
  view_count      INTEGER DEFAULT 0,
  candle_count    INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  published_at    TIMESTAMPTZ NULL,
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year') -- free tier expiry
);

CREATE INDEX idx_tributes_slug ON tributes(slug);
CREATE INDEX idx_tributes_status ON tributes(status);
CREATE INDEX idx_tributes_created_at ON tributes(created_at DESC);

-- Photos
CREATE TABLE tribute_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribute_id      UUID NOT NULL REFERENCES tributes(id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,                -- Supabase Storage path
  cdn_url         TEXT NOT NULL,                -- Public CDN URL
  display_order   INTEGER NOT NULL DEFAULT 0,
  file_size_bytes INTEGER NULL,
  width           INTEGER NULL,
  height          INTEGER NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tribute_photos_tribute_id ON tribute_photos(tribute_id);

-- Upsell leads (email capture only in Phase 1)
CREATE TABLE upsell_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribute_id      UUID NOT NULL REFERENCES tributes(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  trigger         TEXT NULL,                    -- 'post_creation' | 'share' | 'return'
  notified_at     TIMESTAMPTZ NULL,             -- when we sent them the upsell email
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_upsell_leads_tribute_email ON upsell_leads(tribute_id, email);

-- Analytics events (lightweight, no third-party)
CREATE TABLE tribute_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribute_id      UUID NOT NULL REFERENCES tributes(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,                -- view | share | candle | upsell_shown | upsell_email_captured
  referrer        TEXT NULL,
  user_agent      TEXT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tribute_events_tribute_id ON tribute_events(tribute_id);
CREATE INDEX idx_tribute_events_event_type ON tribute_events(event_type);
CREATE INDEX idx_tribute_events_created_at ON tribute_events(created_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE tributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribute_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribute_events ENABLE ROW LEVEL SECURITY;

-- Public can read published tributes
CREATE POLICY "published tributes are public"
  ON tributes FOR SELECT
  USING (status = 'published');

-- Public can read photos of published tributes
CREATE POLICY "photos of published tributes are public"
  ON tribute_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tributes t
      WHERE t.id = tribute_id AND t.status = 'published'
    )
  );

-- All writes go through service role only (API routes)
-- No public insert/update/delete policies

-- ============================================================
-- Helper function: increment candle count atomically
-- ============================================================
CREATE OR REPLACE FUNCTION increment_candle_count(tribute_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE tributes
  SET candle_count = candle_count + 1
  WHERE slug = tribute_slug AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Storage buckets (run in Supabase dashboard or via CLI)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('tribute-photos', 'tribute-photos', true);
