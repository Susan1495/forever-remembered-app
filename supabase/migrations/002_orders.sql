-- ============================================================
-- Phase 2 Migration: Orders table + tributes tier columns
-- Forever Remembered
-- Run via: supabase db push
-- ============================================================

-- Orders table: tracks every Stripe checkout that completes
CREATE TABLE IF NOT EXISTS orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribute_id            UUID NOT NULL REFERENCES tributes(id) ON DELETE CASCADE,
  stripe_session_id     TEXT UNIQUE NOT NULL,
  stripe_payment_intent TEXT NULL,
  tier                  TEXT NOT NULL CHECK (tier IN ('keep', 'cherish', 'legacy')),
  amount_cents          INTEGER NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'processing', 'fulfilled', 'failed')),
  customer_email        TEXT NOT NULL,
  fulfillment_data      JSONB NULL,           -- stores download links, job IDs, etc.
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at          TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_tribute_id       ON orders(tribute_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session   ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status           ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at       ON orders(created_at DESC);

-- Row Level Security for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write orders (no public access)
-- No public read policy — orders are private data

-- ============================================================
-- Alter tributes table — add tier and subdomain columns
-- ============================================================

ALTER TABLE tributes
  ADD COLUMN IF NOT EXISTS tier TEXT NULL
    CHECK (tier IN ('free', 'keep', 'cherish', 'legacy'));

ALTER TABLE tributes
  ADD COLUMN IF NOT EXISTS custom_subdomain TEXT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tributes_custom_subdomain
  ON tributes(custom_subdomain)
  WHERE custom_subdomain IS NOT NULL;

-- ============================================================
-- Helper: create order record atomically
-- ============================================================
CREATE OR REPLACE FUNCTION create_order(
  p_tribute_id          UUID,
  p_stripe_session_id   TEXT,
  p_tier                TEXT,
  p_amount_cents        INTEGER,
  p_customer_email      TEXT
) RETURNS orders AS $$
DECLARE
  v_order orders;
BEGIN
  INSERT INTO orders (
    tribute_id,
    stripe_session_id,
    tier,
    amount_cents,
    customer_email,
    status
  ) VALUES (
    p_tribute_id,
    p_stripe_session_id,
    p_tier,
    p_amount_cents,
    p_customer_email,
    'pending'
  )
  ON CONFLICT (stripe_session_id) DO NOTHING
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
