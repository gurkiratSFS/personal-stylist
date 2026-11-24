# Phase 0 — Foundation

## What shipped

- Jest with `next/jest`, plus `@testing-library/jest-dom`
- Zod public and server env schemas in `lib/env.ts`
- Supabase browser and server clients in `lib/supabase/`
- Session refresh in root `proxy.ts` via `supabase.auth.getClaims()`
- shadcn/ui (Nova / neutral) with Button and Card
- Five-item app shell: Home, My Wardrobe, Discover, AI Assistant, Profile
- Pending module pages that say the section is not built yet
- No database migrations and no AI calls

## Environment variables

Names only. Values stay in `.env`, which is gitignored.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `DB_PASSWORD`
- `SUPABASE_ACCESS_TOKEN`

The publishable URL and key are safe for the browser. `SUPABASE_SECRET_KEY` is server only. The CLI reads `SUPABASE_ACCESS_TOKEN` and needs `DB_PASSWORD` exported as `SUPABASE_DB_PASSWORD` for hosted database commands.

## Jest

```bash
npm test
```

Covers:

- Public env accepts a valid URL and publishable key
- Public schema does not include `SUPABASE_SECRET_KEY`
- Server env requires the secret key
- Browser client receives only the URL and publishable key
- Home is open; wardrobe, discover, assistant, and profile are pending

## Manual checklist

1. Run `npm run dev` and open the app.
2. Home shows Personal Stylist and all five navigation items.
3. Wardrobe, Discover, AI Assistant, and Profile each say "This section is not built yet."
4. View page source and confirm it does not contain the secret key or access token.
5. Confirm nothing on screen looks like a live analysis, trend, or product.
