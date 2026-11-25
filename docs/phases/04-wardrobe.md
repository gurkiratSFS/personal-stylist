# Phase 4 — Digital Wardrobe

## What shipped

- Live `/wardrobe` module: items grid with category filter, needs-attention uploads, combinations, and calendar
- Tables: `wardrobe_items`, `wardrobe_item_attributes`, `outfit_combinations`, `outfit_combination_items`, `outfit_calendar`
- Extended `ai_jobs` with `wardrobe_categorize` and `wardrobe_generate_combinations`
- Private Storage bucket `wardrobe-images` with signed uploads/URLs and per-user RLS
- Vision adapter extensions: `categorizeItem` (image) and `generateCombinations` (catalog JSON)
- Background jobs via `after()` → bearer-auth `/api/ai/wardrobe/run`
- Manual combination builder plus AI generate (only owned item IDs; foreign IDs rejected)
- Favorites, discard, and calendar date assignment
- Setup-required UI when Gemini key is missing (manual add + manual combos still work)

## Migration

`supabase/migrations/20261125092637_wardrobe.sql`

Push with:

```bash
# PowerShell
$env:SUPABASE_ACCESS_TOKEN="…"
$env:SUPABASE_DB_PASSWORD="…"   # from DB_PASSWORD in .env
npx supabase db push --remote --yes
```

## Environment

Reuses Phase 3 server-only vars (see `.env.example`):

- `GOOGLE_GEMINI_API_KEY`
- `GEMINI_MODEL`
- `INTERNAL_RUNNER_TOKEN`
- `APP_URL`

No new public env vars.

## User flow

1. Open My Wardrobe → Add a piece → storage (+ optional AI) consent → upload JPEG/PNG/WebP
2. With AI consent and key: categorize job → pending → item detail with suggested category/color/attrs
3. Without AI: set category manually to mark the item ready
4. Combinations: build manually from ready items, or Generate outfits (occasion + count)
5. Favorite or discard AI/manual looks; assign a look to a calendar date
6. Draft/failed categorizations appear under Needs attention for retry without re-upload

## Privacy / safety

- Same-owner trigger on `outfit_combination_items`
- AI generate only receives the user’s ready catalog; unknown item IDs are dropped/rejected
- Consent required before categorize/generate; images not used for model training
- Images stay in private `wardrobe-images/{userId}/…`
- Deleting an item removes combination links; empty combinations are cleaned up

## Jest

```bash
npm test
```

Covers categorize/generate schemas, foreign-ID allowlist behavior, ownership helpers, and user-facing error mapping.

## Manual checklist

1. With Gemini key: upload item → pending → category/color filled; edit and save.
2. Add 3+ ready items → Generate outfits → pending → combinations appear; favorite one; discard another.
3. Build a manual combination from owned items only.
4. Assign a combination to a calendar date; remove it.
5. Remove/unset `GOOGLE_GEMINI_API_KEY` → setup panel; manual add + manual combo still work; generate blocked.
6. Deny AI consent → categorize blocked; manual category still works.
7. Second account cannot see first account items/combinations.
8. Sidebar marks My Wardrobe as available.
9. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Out of scope (later phases)

- Missing-essentials shopping (Phase 9)
- Wear-count analytics beyond calendar
- Assistant tools (`get_wardrobe`, `generate_wardrobe_outfits`) — Phase 10
- Linking wardrobe combos to Phase 3 `saved_looks`
- Generated outfit images
