-- ============================================================
-- Migration 004: AI focal point detection for hero photos
-- Adds focal_point_x / focal_point_y columns to tribute_photos
-- Values are 0.0–1.0 from top-left corner
-- ============================================================

ALTER TABLE tribute_photos
  ADD COLUMN IF NOT EXISTS focal_point_x FLOAT NULL, -- 0.0 (left) → 1.0 (right)
  ADD COLUMN IF NOT EXISTS focal_point_y FLOAT NULL; -- 0.0 (top)  → 1.0 (bottom)

COMMENT ON COLUMN tribute_photos.focal_point_x IS 'Horizontal focal point 0.0–1.0 (left→right), detected by GPT-4o Vision';
COMMENT ON COLUMN tribute_photos.focal_point_y IS 'Vertical focal point 0.0–1.0 (top→bottom), detected by GPT-4o Vision';
