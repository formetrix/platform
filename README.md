# Formetrix — Platform

Formetrix is an AI-powered real estate development intelligence platform. This repository is the
application codebase. **Read [`FORMETRIX.md`](./FORMETRIX.md) first** — it is the constitution for
this project and governs every architectural and product decision here.

> **Status:** foundation only. No product features (properties, parcels, zoning, feasibility,
> financial analysis, AI recommendations) have been built yet. This repo currently proves out the
> application shell — routing, theming, error handling, and the integration points for Supabase
> and Mapbox — so feature work has a stable base to build on.

## Governing documents

`docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/UI.md`,
and `.cursor/rules/formetrix.mdc` now live in this repository (FM-0002) — not yet committed to
git, see `management/TICKETS.md`. `platform/` is the sole canonical Formetrix repository; no
other directory (including any sibling "Founder Pack" folder) is an active reference for this
project going forward.

## Stack

| Layer         | Choice                                   | Why                                                                                                  |
| ------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Framework     | Next.js 15 (App Router)                  | Required by `FORMETRIX.md` §9.                                                                       |
| Language      | TypeScript (strict)                      | Required by §9/§12.                                                                                  |
| Styling       | Tailwind CSS v4                          | Required by §9. CSS-first config (no `tailwind.config.ts`; see `src/app/globals.css`).               |
| Data          | Supabase (Postgres/PostGIS)              | Required by §9. Client scaffolding only — not connected yet.                                         |
| Maps          | Mapbox                                   | Required by §9. Placeholder only — no `mapbox-gl` dependency until a map feature exists.             |
| Theming       | `next-themes`                            | Small, well-maintained, solves SSR flash-of-wrong-theme correctly; not worth hand-rolling.           |
| Class merging | `clsx` + `tailwind-merge`                | Standard pairing for conditional Tailwind class composition without duplicate/conflicting utilities. |
| Formatting    | Prettier + `prettier-plugin-tailwindcss` | Deterministic formatting and class ordering, wired into ESLint via `eslint-config-prettier`.         |

No other runtime dependencies were added. Anything not listed above (a data-fetching library, a
form library, a component primitive library, `mapbox-gl` itself) was deliberately left out —
`FORMETRIX.md` §21 asks that a dependency earn its place when a feature actually needs it, not in
advance.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in when Supabase/Mapbox credentials exist
npm run dev
```

Scripts:

- `npm run dev` — start the dev server (webpack; add `--turbopack` yourself if you want it)
- `npm run build` / `npm run start` — production build and serve
- `npm run lint` / `npm run lint:fix` — ESLint (Next.js core-web-vitals + TypeScript rules)
- `npm run typecheck` — `tsc --noEmit`
- `npm run format` / `npm run format:check` — Prettier

## Folder structure

```
src/
  app/                      Routes (App Router). Pages stay thin — no business logic here.
    layout.tsx              Root layout: fonts, metadata, Providers, header/footer shell.
    page.tsx                Placeholder home page.
    globals.css             Tailwind entry point + theme tokens + dark-mode variant.
    error.tsx                Route-level error boundary.
    global-error.tsx         Root-layout error boundary (must render its own <html>/<body>).
    loading.tsx              Root-level loading fallback.
    not-found.tsx             404 page.

  components/
    ui/                      Generic, business-agnostic primitives (Button, Card, Spinner, Skeleton).
    layout/                  App shell pieces (SiteHeader, SiteFooter).
    theme/                   ThemeProvider + ThemeToggle (wraps next-themes).
    providers/               Providers composition root; AuthProvider placeholder.
    error/                   ErrorFallback, shared by error.tsx boundaries.

  features/                  Feature modules go here (empty — see features/README.md).

  lib/
    supabase/                Browser/server/middleware clients, config validation, health check (not connected yet).
    mapbox/                  Mapbox config placeholder (env var only, no SDK installed yet).
    utils/                   Small, generic helpers (currently: cn()).
    env.ts                   Typed, lazy environment variable access.

  types/
    auth.ts                  Placeholder auth types.

  config/
    site.ts                  Non-secret site metadata (name, tagline, URL).
```

This follows `FORMETRIX.md` §24: feature code will live under `src/features/<domain>/`, with
`src/components/` reserved for things genuinely shared across more than one feature, and
`src/lib/` for infrastructure/integration code with no UI.

## Architectural decisions

- **Feature-based, not layer-based, structure.** `src/features/` will hold one directory per
  domain (properties, parcels, zoning, feasibility, …) once those exist, each owning its own
  components/types/logic. `src/components/`, `src/lib/`, and `src/types/` hold only what is
  genuinely cross-feature, so a feature's blast radius stays contained (§10, §24).
- **External integrations are wrapped, not imported directly.** `src/lib/supabase/*` and
  `src/lib/mapbox/*` are the only files that should import `@supabase/*` or (eventually)
  `mapbox-gl`. Feature code imports these wrappers, not the SDKs — so a provider can be swapped
  without touching every call site (§10).
- **Supabase client is split by environment.** `src/lib/supabase/client.ts` (browser) and
  `server.ts` (Server Components/Route Handlers, cookie-based) are separate because they have
  different lifecycles — the server client must be created per-request, not shared.
- **Supabase config validation is centralized in `src/lib/supabase/config.ts`.** `getSupabaseConfig()`
  aggregates the required env vars into one clear error instead of each call site throwing separately;
  `isSupabaseConfigured()` lets code (like the middleware utility) skip Supabase calls gracefully before
  a real project is connected. `src/lib/supabase/health-check.ts` provides `checkSupabaseHealth()` —
  hits Supabase's documented `/auth/v1/health` endpoint, touches no tables, and is never called
  automatically; it exists to be called manually once real credentials are in `.env.local`.
- **`src/lib/supabase/middleware.ts` is a dormant utility, not live middleware.** `updateSession()`
  follows Supabase's current session-refresh pattern (`getClaims()`, not `getSession()`) but nothing
  imports it yet — no root `src/middleware.ts` exists, so it has no effect until FM-0009 wires it in.
- **Environment variables are read lazily and typed.** `src/lib/env.ts` doesn't validate at
  import time, so the app doesn't crash at build/boot before real credentials exist; a
  `requireEnv()` guard throws a descriptive error only when a code path that truly needs a value
  is actually invoked (§18: fail deliberately, not silently).
- **Dark mode uses Tailwind v4's `@custom-variant`, not the default media-query strategy.**
  `next-themes` toggles a `.dark` class on `<html>`; `globals.css` redefines the `dark:` variant
  to match that class (`@custom-variant dark (&:where(.dark, .dark *));`) instead of
  `prefers-color-scheme`, so the in-app toggle actually controls the theme.
- **Error handling uses Next.js's built-in boundary conventions** (`error.tsx`,
  `global-error.tsx`, `not-found.tsx`, `loading.tsx`) rather than a hand-rolled React error
  boundary component, since the framework's convention already covers segment-level isolation.
  They share one presentational component (`ErrorFallback`) so the "what happened / what can you
  do / is data incomplete" structure required by §18 isn't duplicated.
- **Auth structure is a typed placeholder, not a stub implementation.** `AuthProvider` /
  `useAuth()` exist so feature code can already depend on a stable interface, but they return a
  hardcoded signed-out state. No login/signup UI, session logic, or route protection has been
  built — the task explicitly scoped this pass to structure only.
- **`mapbox-gl` is not installed.** Only the env var and a `isMapboxConfigured()` check exist.
  Installing a mapping library before any component renders a map would be exactly the kind of
  premature complexity §21 warns against.

## Intentionally left for future implementation

- Supabase project connection (env vars are placeholders; nothing has been provisioned).
- Any actual authentication: login/signup flows, protected routes, wiring `src/lib/supabase/middleware.ts`'s
  `updateSession()` into a live root `src/middleware.ts`, `supabase.auth.onAuthStateChange` wiring into `AuthProvider`.
- Row Level Security policies, database schema, and migrations (§13, §19).
- `mapbox-gl` installation and an actual map component.
- Generated Supabase TypeScript types (`supabase gen types typescript`) — Supabase clients are
  currently untyped rather than typed with `any`, per §12.
- All product features: properties, parcels, zoning, feasibility, financial modeling, AI
  recommendations, reports (§4–5).
- Automated tests — none exist yet; §20 requires them once there is meaningful logic to cover.
- Committing `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`,
  `docs/UI.md`, and `.cursor/rules/formetrix.mdc` to git — present in the working tree, not yet
  committed (FM-0002).
