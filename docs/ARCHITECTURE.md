# Architecture

Frontend

- Next.js 15 (App Router)
- React
- TypeScript

Backend

- Supabase
- PostgreSQL
- PostGIS

Infrastructure

- GitHub
- Vercel

Design Principles

- Modular
- Typed
- Testable
- Maintainable

## Supabase project wiring (FM-0005)

- **Public env:** `NEXT_PUBLIC_SUPABASE_URL` +
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (prefer); legacy
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` accepted when publishable is unset (ADR-0037).
  Resolution: `src/lib/supabase/public-key.ts` → `getSupabaseConfig()`.
- **Server-only:** `SUPABASE_SERVICE_ROLE_KEY` — never `NEXT_PUBLIC_`; used by
  `createServiceRoleClient()` for trusted ingestion only.
- **Local:** `.env.example` placeholders; `.env.local` git-ignored; restart
  `npm run dev` after edits. Do not overwrite an existing `.env.local` without
  Founder approval.
- **CLI:** `npx supabase login` → `link --project-ref` → `migration list` →
  `db push --dry-run` → Founder-approved `db push`. Never `db reset` on hosted.
- **Health:** `checkSupabaseHealth()` (manual) hits Auth `/auth/v1/health`.
- **Unconfigured UX:** protected routes → branded `/auth/sign-in?error=supabase_unconfigured`.

See README (Founder checklist) and `docs/AUTH_FLOW.md` §12.5.

## Authentication session layer (FM-0009)

- **Session refresh:** root `src/middleware.ts` calls
  `updateSession` from `src/lib/supabase/middleware.ts`.
- **Route policy:** `src/lib/auth/routes.ts`.
- **User resolution:** `getAuthenticatedUser()` (`getUser()`).
- **Mission Control:** `/internal/project-dashboard` remains public (ADR-0031).

See `docs/AUTH_FLOW.md` §12.

## Organization membership layer (FM-0010)

- **Tables:** `user_profiles`, `organizations`, `organization_memberships`.
- **Helpers:** `src/lib/organizations/`.
- **V1:** one active membership per user; roles Owner/Admin/Member/Viewer.

## Property & Parcel spatial layer (FM-0011)

- **PostGIS:** enabled via migration (`CREATE EXTENSION IF NOT EXISTS postgis`).
- **Tables:** `properties` (org-private), `parcels` (shared), `property_parcels` (m:n).
- **SRID:** EPSG:4326; parcel boundary `MultiPolygon`; centroid `Point` (ADR-0033).
- **Provenance:** provider + provider parcel id + timestamps + `raw_source_metadata`.
- **RLS:** property access via org membership helpers; parcel SELECT for authenticated;
  parcel writes via service-role ingestion (FM-0012).
- **Helpers:** `src/lib/properties/` — get/list/create/update property, attach/list parcels,
  status transitions, APN normalization.

See `docs/DATABASE_SCHEMA.md` §5–§5a / §9a.

## Regrid parcel ingestion (FM-0012)

- **Client:** `src/lib/regrid/` — typed Regrid API client (address / APN / point), env
  validation (`REGRID_API_TOKEN`), retry + rate-limit handling, feature → normalized
  candidate mapping. No UI.
- **Services:** `src/lib/properties/ingestion/` —
  `searchParcels` → `importParcel` / `refreshParcel` → `createPropertyFromParcel`.
- **Ingestion flow:** search candidates (no DB write) → select candidate → upsert Parcel
  by `(provider, provider_parcel_id)` → create Organization Property → attach
  `property_parcels` (primary). Duplicate parcels are reused; duplicate links rejected.
- **Writes:** service-role client + `upsert_parcel_from_provider` RPC (GeoJSON →
  MultiPolygon 4326). Authenticated clients cannot INSERT/UPDATE `parcels` (RLS).
- **Provenance:** `provider=regrid`, Regrid `ll_uuid` as `provider_parcel_id`,
  `source_retrieved_at` / `source_updated_at`, `raw_source_metadata` feature snapshot.
- **Out of scope:** search UI, map, Property Workspace wiring, zoning, financials, AI.

See `docs/DATABASE_SCHEMA.md` §9b; ADR-0034.

## Property Workspace UI (FM-0013)

- **Routes:** `/properties` (org list) and `/property/[id]` (workspace) — `force-dynamic`,
  no mock records.
- **Data:** `loadPropertiesList` / `loadPropertyWorkspace` call `@/lib/properties` +
  `@/lib/organizations`. Empty states when Supabase/org/membership/Regrid data is missing.
- **Shell:** header (name, address, status badge, organization, created, recommendation
  placeholder) + left nav (Dashboard + Coming Soon modules).
- **Modules:** lazy-load-ready panels under `src/features/properties/modules/`
  (zoning, financial, constraints, recommendation, documents, activity, …).
- **Design:** Formetrix brand tokens (Deep Navy / Charcoal / Electric Cyan), Inter,
  8px radius, soft elevation (`shadow-soft`).

See ADR-0035.

## Property Dashboard (FM-0014)

- **Landing:** `/property/[id]` composes `PropertyDashboard` — the central workspace
  overview (nav label: Dashboard).
- **Shows:** what the property is (identity, status, org, APN), where it is (address /
  county / coords), parcel + property summaries, data-availability indicators,
  available datasets, available analyses (honest `not_built` for future modules),
  recommendation placeholder, timeline/activity summary, module quick-nav.
- **Inventory:** `buildDashboardInventory(view)` derives availability from live
  `WorkspaceView` only — never invents zoning/financial values.
- **Out of scope:** Mapbox, zoning engine, financial calculations, AI recommendations.

See ADR-0036.
