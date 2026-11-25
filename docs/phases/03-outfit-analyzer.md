# Phase 3 — Outfit Analyzer

## What shipped

- Live `/analyze` module: upload, history, saved looks, compare, and report detail
- Tables: `outfits`, `outfit_analyses`, `outfit_recommendations`, `saved_looks`, `outfit_follow_ups`, `ai_jobs`, `ai_usage`
- Private Storage bucket `outfit-images` with signed uploads/URLs and per-user RLS
- Provider-independent vision adapter (`lib/ai/vision/*`) with Gemini as the first implementation
- Background jobs via server action `after()` → bearer-auth `/api/ai/outfit/run`
- Zod-validated reports (7 categories; no trend relevance yet)
- Setup-required UI when `GOOGLE_GEMINI_API_KEY` is missing
- Consent gates for storage and AI processing; copy states images are not used for model training

## Migration

`supabase/migrations/20261125043818_outfit_analyzer.sql`

Push with:

```bash
# PowerShell
$env:SUPABASE_ACCESS_TOKEN="…"
$env:SUPABASE_DB_PASSWORD="…"   # from DB_PASSWORD in .env
npx supabase db push --remote --yes
```

## Environment

New server-only vars (see `.env.example`):

- `GOOGLE_GEMINI_API_KEY` — optional; missing key shows setup state
- `GEMINI_MODEL` — optional; defaults to `gemini-3.5-flash`
- `INTERNAL_RUNNER_TOKEN` — shared secret for `/api/ai/outfit/run` (dev fallback exists)
- `APP_URL` — base URL for the internal runner fetch (defaults to `http://localhost:3000`)

Never prefix these with `NEXT_PUBLIC_`.

## User flow

1. Open Outfit Analyzer → consent to store + analyze
2. Upload JPEG/PNG/WebP → choose feedback depth and optional occasion
3. Job queues → pending page polls → report with scores, strengths, improvements, suggestions
4. Save look, ask follow-up, or compare two saved looks
5. Failed or unfinished uploads appear under **Needs attention** / `/analyze/uploads` for retry without re-uploading
6. Without a vision key, the module shows unavailable state (no invented scores); draft uploads remain listable

## Privacy / safety

- Scores are a styling assessment, not attractiveness or personal worth
- AI consent must be `granted` before a job is enqueued
- Invalid model JSON is rejected (`invalid_model_response`); raw payloads are never stored
- Images stay in private `outfit-images/{userId}/…`

## Jest

```bash
npm test
```

Covers report schema bounds, Gemini adapter rejection/redaction, ownership rules, runner auth, missing-key / consent gates, and invalid-model failure path.

## Manual checklist

1. With Gemini key set: upload outfit → pending → report loads with 7 categories.
2. Save look → appears on Saved; unsaved removes it.
3. Ask a follow-up on a report → answer appears after job completes.
4. Save two looks → Compare → preference summary returns.
5. Remove/unset `GOOGLE_GEMINI_API_KEY` → setup-required panel; no fake scores.
6. Deny AI consent → analysis blocked with clear error.
7. Second account cannot see first account outfits/analyses.
8. Sidebar marks Outfit Analyzer as available.
9. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Out of scope (later phases)

- Trend relevance score (Phase 8)
- Product links (Phase 9)
- Generated outfit images
- Assistant tool `analyze_outfit` (Phase 10)
