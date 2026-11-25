<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Personal Stylist

AI style and lifestyle companion. Next.js app in this directory. Product spec is `../OVERVIEW.md`. Build one finished phase at a time. Do not generate the whole product in one pass.

Each phase ships a complete user-facing slice: migrations, row-level security, server logic, UI, Jest tests for business logic, and a short feature doc. Later modules stay as honest empty states until their phase. Schema arrives with the feature that uses it.

## Phases

0. Foundation — Supabase CLI, Jest, Zod, shadcn/ui, env docs, app shell.
1. Account and home — register, login, password recovery, profile preferences, marketing site, split auth, app sidebar navigation.
2. Style profile — progressive onboarding, preferences, private photos, editable Style DNA (Done).
3. Outfit analyzer — upload, validated structured AI feedback, saved analyses (Done).
4. Wardrobe — items, AI categorize, manual + AI combinations, favorites, calendar (Done).
5. Color analysis — palette from a photo, user corrections.
6. Grooming studio — hair, beard, and routine guidance. No medical diagnosis.
7. Habits — challenges, reminders, streaks, achievements.
8. Trends — live data from a permitted source only.
9. Shopping — real marketplace data, disclosed affiliate links, wishlist.
10. Assistant — chat with an allowlisted set of server-side tools. No raw SQL.

Start at the current phase. Do not skip ahead to trends, shopping, or the assistant.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui.
- Supabase Postgres, Auth, Storage, and RLS. Schema, policies, and Edge Functions live in this repo under `supabase/` and are applied with the CLI.
- Business logic stays in server modules. UI components render and call those modules.
- Validate external and AI data with Zod before it is stored or shown.
- Provider API keys stay on the server. AI calls go through a provider-independent adapter.

## Supabase

CLI is the dev dependency `supabase` (currently 3.3.0). Run it with `npx supabase`. Discover flags with `--help`. Create migration files only with `npx supabase migration new <name>`.

Local config is `supabase/config.toml`. `project_id` there is the local name, not the hosted ref. The hosted ref is the subdomain of `NEXT_PUBLIC_SUPABASE_URL`.

Link this checkout to the hosted project:

```bash
npx supabase link --project-ref <ref> --yes
```

That command needs a user-scoped personal access token. This repo stores it as `SUPABASE_ACCESS_TOKEN` in `.env`. The project publishable and secret keys do not authenticate the CLI. The token should be scoped to this project with at least `project_admin_read`. Hosted database commands read `SUPABASE_DB_PASSWORD`; this repo stores that password as `DB_PASSWORD` in `.env`, so export it under the CLI name before `db push`, `db pull`, or `migration list --remote`. The CLI does not load `.env` by itself. Do not commit the token or the password. The linked project is `efrhsdxijxwauiveprum` (`personal-stylist`, production).

App environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` — hosted project URL. Safe for the browser.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable key. Safe for the browser.
- `SUPABASE_SECRET_KEY` — server only. Never prefix it with `NEXT_PUBLIC_` and never import it into client components.

`.env` is gitignored. Do not print secret values in docs, logs, or commits.

Enable RLS on every table in an exposed schema, then add policies that match the real access model. Private user rows are scoped to `auth.uid()`. Do not use `user_metadata` for authorization. Keep `security definer` functions out of exposed schemas. Personal photos go in a private bucket with signed URLs and user-scoped paths. Storage upsert needs INSERT, SELECT, and UPDATE.

After a schema change, check advisors when the CLI version supports `supabase db advisors`, then generate the migration from the local database rather than hand-naming a file.

## AI, trends, and shopping

Do not present hardcoded or invented model output as a real analysis. If a provider key is missing, show a setup state that says so.

Do not invent current trends or product catalogs. Those screens stay in a setup state until a permitted source is connected. Affiliate links are labeled.

The assistant may call only validated server tools. It does not receive a database connection or an open SQL interface.

## UI and UX

Treat this as a production consumer product, not a thin MVP shell. Follow `docs/design-system.md`. Marketing pages are long-form and image-led. Auth is full-screen split layout without marketing chrome. The signed-in app uses a real sidebar and designed empty/stage states. Do not invent testimonials, user counts, scores, trends, or product catalogs.

## Tests and docs

Jest covers schemas, ownership checks, AI output validation, and assistant tool authorization. Row-level security is tested against the local Supabase stack, not mocks alone. Page flows are also checked manually in the browser.

When a feature is finished, add a short doc for what shipped, which env vars and migrations it needs, and how to test it. Keep a running list of completed work and what is still open. Design-system and status docs live under `docs/`.

## Safety

Do not update git config. Do not commit unless asked. Do not commit `.env` or credential files. Do not force-push. Read the Next.js guide in `node_modules/next/dist/docs/` before using a Next.js API that may have changed in this version.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
