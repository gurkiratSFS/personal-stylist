# Phase 1 — Account and Home

## What shipped

- Email/password registration, sign-in, sign-out, and password recovery
- `/auth/confirm` PKCE exchange for recovery links
- `profiles` table with trigger on `auth.users`, RLS, and generated types
- Profile page for display name, country, language, currency, and timezone
- Protected app routes under `(app)` with sidebar navigation (Home, Analyzer, Wardrobe, Discover, Grooming, Shopping, Assistant, Profile)
- Public marketing site under `(marketing)` and chrome-free auth under `(auth)`
- Home dashboard with personalized greeting, profile summary, journey previews, and honest empty states
- Module stage pages for unfinished destinations (no invented scores or catalogs)
- Cookie/session access removed from root layout; app pages that need auth use `instant = false` / Suspense boundaries

## Dashboard setup required

1. Auth → Providers → Email: disable **Confirm email**.
2. Auth → URL configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/confirm` and `http://localhost:3000/**`
3. Keep the email provider enabled so password-reset messages can send.

## Environment

Same as Phase 0. Names only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `DB_PASSWORD`
- `SUPABASE_ACCESS_TOKEN`

Migration push needs `SUPABASE_ACCESS_TOKEN` and `DB_PASSWORD` exported as `SUPABASE_DB_PASSWORD`.

## Jest

```bash
npm test
```

Covers auth schemas, profile schemas, `canAccessProfile`, auth path helpers, navigation availability, and the browser client key boundary.

## Manual checklist

1. Confirm email is disabled; redirect URLs are set.
2. Open `/` — full landing with imagery; no blocking prerender error in the console.
3. Sign up → land on `/home` signed in (app shell, no marketing footer).
4. Sign out → open `/login` — split-screen auth without marketing chrome → sign in again.
5. Forgot password → email link → set new password.
6. Edit profile preferences; reload and confirm they persist.
7. Analyzer / wardrobe / discover / grooming / shopping / assistant show designed stage pages.
8. Logged-out visit to `/home` or `/profile` redirects to login.
9. Page source does not expose the secret key or access token.
10. Mobile: marketing menu, auth visual-then-form, app horizontal module nav.
