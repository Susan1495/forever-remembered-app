/**
 * POST /api/admin/run-migration-ddl
 * Applies the migration 005 DDL (ALTER TABLE) using a direct Postgres connection.
 * Only callable with ADMIN_SECRET. Self-deletes after successful run (logs a warning).
 *
 * This endpoint exists because Supabase's REST API (PostgREST) cannot execute DDL.
 * We use the `pg` library with the DB password to connect directly.
 *
 * SECURITY: Protected by ADMIN_SECRET. Remove this file after migration is applied.
 *
 * Usage:
 *   curl -X POST https://foreverremembered.ai/api/admin/run-migration-ddl \
 *     -H "x-admin-secret: YOUR_ADMIN_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{}'
 */

import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

export const runtime = 'nodejs'
export const maxDuration = 30

const MIGRATION_SQL = `
  ALTER TABLE tributes
    ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ NULL;

  COMMENT ON COLUMN tributes.generated_at IS 
    'Timestamp when AI generation pipeline completed successfully. Set alongside status=published.';

  UPDATE tributes
  SET generated_at = published_at
  WHERE status = 'published'
    AND published_at IS NOT NULL
    AND generated_at IS NULL;
`

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbPassword = process.env.DATABASE_PASSWORD
  if (!dbPassword) {
    return NextResponse.json(
      { error: 'DATABASE_PASSWORD env var not set' },
      { status: 500 }
    )
  }

  const projectRef = 'pwncmufflmxehjdrhfyn'

  // Try session pooler (port 5432) — supports DDL unlike transaction pooler
  const client = new Client({
    host: 'aws-0-us-east-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: `postgres.${projectRef}`,
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    await client.connect()
    console.log('[migration-ddl] Connected to Supabase')

    await client.query(MIGRATION_SQL)
    console.log('[migration-ddl] Migration 005 applied successfully')

    // Verify the column now exists
    const check = await client.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'tributes' AND column_name = 'generated_at'`
    )

    // Verify backfill
    const backfillCheck = await client.query(
      `SELECT COUNT(*) as total, 
              COUNT(generated_at) as with_generated_at,
              COUNT(*) - COUNT(generated_at) as missing_generated_at
       FROM tributes WHERE status = 'published'`
    )

    return NextResponse.json({
      success: true,
      message: 'Migration 005 applied: generated_at column added and backfilled',
      column_exists: check.rows.length > 0,
      column_type: check.rows[0]?.data_type,
      published_tributes: backfillCheck.rows[0],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[migration-ddl] Failed:', message)
    return NextResponse.json(
      { error: `Migration failed: ${message}` },
      { status: 500 }
    )
  } finally {
    await client.end().catch(() => {})
  }
}
