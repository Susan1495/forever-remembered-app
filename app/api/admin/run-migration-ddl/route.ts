export const dynamic = 'force-dynamic'
/**
 * POST /api/admin/run-migration-ddl
 * Applies migration 005: adds generated_at column to tributes table.
 * Tries multiple Supabase connection endpoints.
 * Protected by ADMIN_SECRET. Remove after migration is applied.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

export const runtime = 'nodejs'
export const maxDuration = 30

const MIGRATION_SQL = `
  ALTER TABLE tributes
    ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ NULL;

  COMMENT ON COLUMN tributes.generated_at IS 
    'Timestamp when AI generation pipeline completed successfully.';

  UPDATE tributes
  SET generated_at = published_at
  WHERE status = 'published'
    AND published_at IS NOT NULL
    AND generated_at IS NULL;
`

async function tryConnect(config: {
  host: string
  port: number
  user: string
  password: string
}): Promise<Client | null> {
  const client = new Client({
    ...config,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  })
  try {
    await client.connect()
    return client
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`[ddl] Connection to ${config.host}:${config.port} failed: ${msg}`)
    try { await client.end() } catch {}
    return null
  }
}

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbPassword = process.env.DATABASE_PASSWORD
  if (!dbPassword) {
    return NextResponse.json({ error: 'DATABASE_PASSWORD env var not set' }, { status: 500 })
  }

  const projectRef = 'pwncmufflmxehjdrhfyn'
  const endpoints = [
    // Session pooler (supports DDL, IPv4)
    { host: 'aws-0-us-east-1.pooler.supabase.com', port: 5432, user: `postgres.${projectRef}`, password: dbPassword },
    // Transaction pooler (might work for DDL in some configs)
    { host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: `postgres.${projectRef}`, password: dbPassword },
    // Direct DB (IPv6, may work from Vercel)
    { host: `db.${projectRef}.supabase.co`, port: 5432, user: 'postgres', password: dbPassword },
  ]

  let client: Client | null = null
  let connectedHost = ''

  for (const endpoint of endpoints) {
    console.log(`[ddl] Trying ${endpoint.host}:${endpoint.port}...`)
    client = await tryConnect(endpoint)
    if (client) {
      connectedHost = `${endpoint.host}:${endpoint.port}`
      console.log(`[ddl] Connected via ${connectedHost}`)
      break
    }
  }

  if (!client) {
    return NextResponse.json(
      { error: 'Could not connect to database. All connection endpoints failed. Run ALTER TABLE manually in Supabase SQL editor.' },
      { status: 500 }
    )
  }

  try {
    await client.query(MIGRATION_SQL)
    console.log('[ddl] Migration 005 applied successfully')

    const check = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name = 'tributes' AND column_name = 'generated_at'`
    )
    const stats = await client.query(
      `SELECT COUNT(*) as total, COUNT(generated_at) as with_generated_at
       FROM tributes WHERE status = 'published'`
    )

    return NextResponse.json({
      success: true,
      connected_via: connectedHost,
      column_exists: check.rows.length > 0,
      published_tributes: stats.rows[0],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Migration failed: ${message}`, connected_via: connectedHost }, { status: 500 })
  } finally {
    await client.end().catch(() => {})
  }
}
