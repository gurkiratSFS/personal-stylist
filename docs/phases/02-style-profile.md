# Phase 2 — Style Profile

## What shipped

- Soft progressive `/onboarding` wizard (skippable) for style essentials
- `style_profiles`, `appearance_profiles`, `user_preferences`, `user_photos` with RLS
- Private Storage bucket `user-photos` with signed uploads/URLs and delete
- User-authored Style DNA seeded from answers (never fake AI claims)
- Profile hub: locale, Style DNA notes, style preferences, optional appearance, photo vault
- Home completion banner + DNA summary when essentials exist
- Signup/sign-in redirect to `/onboarding` when essentials are incomplete

## Essentials for “onboarding complete”

At least one fashion category, one preferred style, a budget band, climate, and lifestyle.

Colors, fit, appearance, and photos remain optional.

## Migration

`supabase/migrations/20261124072730_style_profile_and_photos.sql`

Push with:

```bash
# PowerShell
$env:SUPABASE_ACCESS_TOKEN="…"
$env:SUPABASE_DB_PASSWORD="…"   # from DB_PASSWORD in .env
npx supabase db push --remote --yes
```

## Environment

Same as Phase 1. No new public env vars. Storage uses the existing Supabase project keys.

## Privacy notes

- Photos require explicit storage consent before upload
- AI processing consent stays `not_requested` until a later phase sends an image to a model
- Paths stored in Postgres; files in private bucket; delete removes both
- User images are not used for model training

## Jest

```bash
npm test
```

Covers style/appearance/photo schemas, DNA seed/merge, ownership and storage-path rules, protected `/onboarding` path.

## Manual checklist

1. Sign up → land on `/onboarding` (no marketing chrome).
2. Complete essentials → Style DNA on Profile → Home banner gone.
3. Skip onboarding → Home banner → Resume prefills.
4. Upload face photo with consent → preview → Save → appears in vault.
5. Upload without consent blocked.
6. Delete photo → removed from UI and storage.
7. Appearance can save empty / optional fields only.
8. Second account cannot access first account photo paths.
9. Analyzer and other modules still show honest stage pages.
10. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## RLS / storage checklist

- Authenticated users can only CRUD their own style/appearance/prefs/photos rows
- Storage objects under `user-photos/{auth.uid()}/…` only
- Bucket is private (`public = false`)
