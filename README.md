# Formetrix — Platform

Formetrix is an AI-powered real estate development intelligence platform. This repository is the
application codebase. **Read [`FORMETRIX.md`](./FORMETRIX.md) first** — it is the constitution for
this project and governs every architectural and product decision here.

> **Status:** foundation + Property Workspace mock UI + auth session infrastructure. Sign-in/sign-up
> forms are not built yet. Protected application routes require Supabase env vars; without them,
> those routes redirect to an explicit configuration message rather than simulating a session.

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

### Local authentication configuration

Session refresh and protected routes (FM-0009) use Supabase Auth via `@supabase/ssr`.

1. Copy `.env.example` → `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from a Supabase project
   (Project Settings → API). Leave them empty for local UI work that does not need Auth.
3. Restart `npm run dev` after changing env vars.

Behavior without credentials:

- `/` and `/internal/project-dashboard` keep working (Mission Control stays public — ADR-0031).
- `/properties`, `/property/*`, `/settings`, `/organization/*` redirect to
  `/auth/sign-in?error=supabase_unconfigured` with a safe `next` return path.
- No signed-in user is simulated and auth is never silently bypassed.

Sign-in/sign-up **forms are not implemented** yet — `/auth/sign-in` and `/auth/sign-up` are
minimal placeholders so redirects do not 404. See `docs/AUTH_FLOW.md` §12.

### Database migrations

Migration-ready SQL under `supabase/migrations/` (never auto-applied by
`npm run dev` / `build` / CI):

**Organization membership (FM-0010)**

1. `20260731200000_organization_membership.sql`
2. `20260731200100_organization_membership_rls.sql`

**Property / Parcel + PostGIS (FM-0011)**

1. `20260731210000_enable_postgis.sql` — `CREATE EXTENSION IF NOT EXISTS postgis`
2. `20260731210100_properties_parcels.sql` — `properties`, `parcels`, `property_parcels`
3. `20260731210200_properties_parcels_rls.sql` — RLS (+ `can_access_property`)

**Regrid parcel upsert RPC (FM-0012)**

1. `20260731220000_upsert_parcel_from_provider.sql` — service-role
   `upsert_parcel_from_provider` (GeoJSON → MultiPolygon)

Apply manually to a disposable Supabase project (CLI or SQL editor) when ready.
`supabase/seed.dev.example.sql` is a commented development-only example — never
production.

Server helpers (no live DB / Regrid required to import/build):

- `@/lib/organizations` — profile, active org, membership/role checks
- `@/lib/properties` — property CRUD boundaries, parcel attach/list, status rules
- `@/lib/regrid` — typed Regrid API client (token via `REGRID_API_TOKEN`)
- `@/lib/properties` ingestion — `searchParcels`, `importParcel`,
  `createPropertyFromParcel`, `refreshParcel` (mocked in unit tests)

Without credentials or before migrations are applied, helpers return explicit
`unconfigured` / error results rather than inventing data.

### Regrid configuration (server-only)

1. Set `REGRID_API_TOKEN` in `.env.local` (never `NEXT_PUBLIC_`).
2. Optionally set `REGRID_API_BASE_URL` (default `https://app.regrid.com`).
3. Parcel writes also need `SUPABASE_SERVICE_ROLE_KEY` for the upsert RPC.

Unit tests mock `fetch` and an in-memory parcel store — CI does not call Regrid.

### Property Workspace (FM-0013) & Dashboard (FM-0014)

- `/properties` — lists real Properties for the active Organization (empty state if none).
- `/property/[id]` — Property Dashboard (central overview): identity, location, data
  availability, dataset/analysis inventory, parcel/property summaries, timeline,
  recommendation placeholder, and module quick-nav. Section nav routes remain live
  (Coming Soon modules are lazy-load ready).
- **No mock property records.** Requires Supabase Auth + membership; Regrid token is optional
  (parcel empty state explains when import is unavailable).

Scripts:

- `npm run dev` — start the dev server (webpack; add `--turbopack` yourself if you want it)
- `npm run build` / `npm run start` — production build and serve
- `npm run lint` / `npm run lint:fix` — ESLint (Next.js core-web-vitals + TypeScript rules)
- `npm run typecheck` — `tsc --noEmit`
- `npm run format` / `npm run format:check` — Prettier
- `npm run test` — focused Node tests for auth routes/return-paths and organization role/slug/active-org helpers
- `npm run dashboard:update` / `npm run dashboard:check` — recompute / validate the Mission Control snapshot in `management/data/` (see `docs/MISSION_CONTROL.md`)
- `npm run dashboard:health` — run the validation commands and record their results into project health

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

  features/
    properties/              Property Workspace UI (list + /property/[id] shell, Overview, modules/).
    project-dashboard/       Mission Control (/internal/project-dashboard).

  lib/
    supabase/                Browser/server/middleware/admin clients, config validation, health check.
    regrid/                  Typed Regrid parcel API client (FM-0012; server-only token).
    properties/              Property/parcel helpers + ingestion services (search/import/create).
    organizations/           Membership and active-org helpers.
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
- **Root `src/middleware.ts` refreshes sessions and enforces route policy (FM-0009).** It calls
  `updateSession()` from `src/lib/supabase/middleware.ts` (`getClaims()`, not `getSession()`),
  then applies `src/lib/auth/routes.ts` / `return-path.ts`. Server code should resolve identity via
  `getAuthenticatedUser()` (`getUser()`), not client-controlled values.
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
- Sign-in/sign-up forms, password reset UI, OAuth, and wiring `supabase.auth.onAuthStateChange`
  into the client `AuthProvider` placeholder (session middleware + protected routes already exist).
- Row Level Security policies, database schema, and migrations (§13, §19).
- `mapbox-gl` installation and an actual map component.
- Generated Supabase TypeScript types (`supabase gen types typescript`) — Supabase clients are
  currently untyped rather than typed with `any`, per §12.
- All product features: properties, parcels, zoning, feasibility, financial modeling, AI
  recommendations, reports (§4–5).
- Broader automated tests — focused Node tests cover auth route/return-path helpers; expand as
  features grow (§20).
- Committing `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`,
  `docs/UI.md`, and `.cursor/rules/formetrix.mdc` to git — present in the working tree, not yet
  committed (FM-0002).
