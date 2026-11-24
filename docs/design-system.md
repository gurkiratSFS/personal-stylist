# Design system — Personal Stylist

Production visual language for the public site, authentication, and signed-in product.

## Personality

Warm editorial fashion-tech. Sophisticated neutrals with a muted teal accent. Spacious but image-rich — never empty SaaS chrome or generic purple gradients.

## Color

| Token | Role |
| --- | --- |
| `--background` / `--mist` / `--stone` | Page and soft section surfaces |
| `--ink` / `--foreground` | Primary text and dark campaign panels |
| `--card` | Elevated content surfaces |
| `--accent` | Teal accent for eyebrows, focus, highlights |
| `--primary` | Solid actions (ink) |
| `--border` / `--muted-foreground` | Structure and secondary copy |

Defined in `app/globals.css` as OKLCH CSS variables mapped into Tailwind `@theme`.

## Typography

- Display: **Fraunces** (`font-display`) — headlines, brand wordmark, section titles.
- Body: **Source Sans 3** (`font-body` / `font-sans`) — UI copy, forms, navigation.
- Hierarchy: large display headlines, mid-size section titles, restrained body. Not every heading uses the same size.

## Layout

- Marketing content max width ~`max-w-6xl`.
- Auth: full-viewport split screen (form + campaign visual). No marketing header/footer.
- App: desktop sidebar + main; mobile top bar + horizontal module scroller.
- Prefer alternating image/text bands over repeating identical card grids.

## Components

- Buttons: solid primary, outline secondary, ghost tertiary; taller auth CTAs (`h-11` / `h-12`).
- Inputs: generous height (`h-12` on auth), clear labels, inline validation.
- Surfaces: `surface-panel` for soft elevation; borders over heavy multi-layer shadows.
- Imagery: `public/images/*` fashion/lifestyle assets with meaningful `alt` text.
- Motion: short hover lifts and image scale only — restrained.

## States

Every module page must support loading, empty, error, and populated presentations. Unfinished phases use designed stage pages (`ModuleStage`) with honest copy — never fake scores, trends, or catalogs.

## Breakpoints

Mobile-first. Auth campaign column appears from `lg`. App sidebar from `md`. Marketing nav collapses below `md` into a menu.
