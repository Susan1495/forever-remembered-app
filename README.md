# Forever Remembered — Phase 1

> A viral tribute platform. Upload photos, write a few sentences — AI generates a beautiful memorial page in under 90 seconds. Free forever.

**Status:** Phase 1 scaffold — build passes, needs env vars wired up to go live.

## Quick Start

```bash
# Clone
git clone https://github.com/Susan1495/forever-remembered-app.git
cd forever-remembered-app

# Install
npm install

# Configure environment
cp .env.example .env.local
# Fill in .env.local with your keys (see Environment Variables below)

# Run development server
npm run dev
# Open http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | GPT-4o + DALL-E 3 |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase admin key (server-side only) |
| `RESEND_API_KEY` | ✅ | Transactional email |
| `NEXT_PUBLIC_URL` | ✅ | App URL (https://foreverremembered.ai in prod) |
| `UPSTASH_REDIS_REST_URL` | ⚪ | Rate limiting (optional — dev works without it) |
| `UPSTASH_REDIS_REST_TOKEN` | ⚪ | Rate limiting (optional) |
| `EMAIL_FROM` | ⚪ | From email (defaults to hello@foreverremembered.ai) |

## Database Setup

Run the migration in Supabase:

```sql
-- Run in Supabase SQL editor or via CLI
-- File: supabase/migrations/001_initial_schema.sql
```

Also create the storage bucket:
1. Supabase Dashboard → Storage → New Bucket
2. Name: `tribute-photos`
3. Public: ✅ (required for CDN URLs)

## Architecture

```
app/
├── page.tsx                         # Landing page (Screen 0)
├── create/
│   ├── page.tsx                     # Creation form (Screens 1 & 2)
│   └── generating/[slug]/page.tsx   # Generation loader (Screen 3)
├── tribute/[slug]/
│   ├── page.tsx                     # Tribute page SSR (Screen 4)
│   └── TributePage.tsx              # Client-side interactions
└── api/
    ├── tribute/create/              # POST — creates tribute + starts AI
    ├── tribute/[slug]/status/       # GET  — poll generation status
    ├── tribute/[slug]/candle/       # POST — increment candle count
    ├── upload/presign/              # POST — get Supabase presigned URLs
    ├── upsell/lead/                 # POST — capture upsell email
    └── og/[slug]/                   # GET  — dynamic OG image

lib/
├── ai/
│   ├── moderation.ts               # OpenAI content moderation
│   ├── analyze-photos.ts           # GPT-4o Vision photo analysis
│   ├── generate-text.ts            # GPT-4o tribute text generation
│   ├── generate-art.ts             # DALL-E 3 placeholder art
│   └── generate-tribute.ts         # Full pipeline orchestrator
├── db/
│   ├── tributes.ts                 # Tribute CRUD
│   ├── photos.ts                   # Photo records
│   └── upsell-leads.ts             # Email capture
├── email/send.ts                   # Resend email functions
├── rate-limit.ts                   # Upstash Redis rate limiting
├── slug.ts                         # Slug generation + age detection
├── supabase.ts                     # Supabase client (server + public)
└── types.ts                        # TypeScript types

emails/
├── tribute-ready.tsx               # "Your tribute is ready" email
└── upsell-interest.tsx             # "We'll be in touch" email

components/
├── create/                         # Creation flow components
└── tribute/                        # Tribute page components
```

## AI Pipeline

1. **Content Moderation** — OpenAI Moderation API, runs before anything else
2. **Photo Analysis** — GPT-4o Vision analyzes photos → hero selection, captions, themes
3. **Placeholder Art** — DALL-E 3 generates watercolor art when no photos uploaded
4. **Text Generation** — GPT-4o generates headline, biography, pull quote
5. **Template Selection** — Maps AI themes to visual template (golden-hour/classic/garden/minimal)
6. **DB Update** — Sets status → 'published', triggers email

## Visual Themes

| ID | Name | Use case |
|---|---|---|
| `golden-hour` | Golden Hour | Default, warm amber |
| `classic` | Classic | Faith, strength, wisdom |
| `garden` | Garden | Nature, pets, gentle |
| `minimal` | Minimal | Children, modern, clean |

## Edge Cases Handled

- **No photos** → DALL-E 3 watercolor art generated
- **Still living** → Celebration mode (present tense, "Honoring" instead of "In memory of")
- **Child/infant** → Soft tone, no career/legacy language
- **Pet** → Garden theme, warm companion tone
- **Just a name** → Fallback text generation with era context

## Deployment (Vercel)

1. Connect repo to Vercel
2. Add all env vars in Vercel dashboard
3. Deploy — all routes work out of the box with Next.js 14

## Rate Limits

- Tribute creation: 3 per IP per hour (Upstash Redis)
- Status polling: 20 per minute per IP
- Candle: 1 per IP per tribute per day

All limits degrade gracefully (allow-all) when Redis is not configured.

---

Built with care, for the hardest moments. 🕯️
