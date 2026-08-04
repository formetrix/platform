-- FM-0016: Zoning reference data + parcel zoning classification.
-- Depends on: 20260731210100_properties_parcels.sql, 20260731210200_properties_parcels_rls.sql
-- Multi-provider ready: provider + provider_* identity on municipalities, districts, parcel links.
-- Never invent classifications — rows exist only when a provider/import writes them.

-- ---------------------------------------------------------------------------
-- zoning_municipalities — jurisdiction that publishes zoning codes
-- ---------------------------------------------------------------------------
create table public.zoning_municipalities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state_region text,
  country_code text,
  provider text not null,
  provider_municipality_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint zoning_municipalities_name_length check (char_length(name) between 1 and 200),
  constraint zoning_municipalities_provider_unique unique (provider, provider_municipality_id)
);

comment on table public.zoning_municipalities is
  'FM-0016: Zoning jurisdiction (city/county). Shared reference; provider-keyed.';

create trigger zoning_municipalities_set_updated_at
before update on public.zoning_municipalities
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- zoning_districts — code + district name within a municipality
-- ---------------------------------------------------------------------------
create table public.zoning_districts (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.zoning_municipalities (id) on delete cascade,
  code text not null,
  name text,
  description text,
  provider text not null,
  provider_district_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint zoning_districts_code_length check (char_length(code) between 1 and 64),
  constraint zoning_districts_provider_unique unique (provider, provider_district_id),
  constraint zoning_districts_municipality_code_unique unique (municipality_id, code)
);

comment on table public.zoning_districts is
  'FM-0016: Zoning district/code within a municipality (e.g. R-1).';

create index zoning_districts_municipality_id_idx on public.zoning_districts (municipality_id);

create trigger zoning_districts_set_updated_at
before update on public.zoning_districts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- zoning_overlays — optional overlay districts (historic, flood, etc.)
-- ---------------------------------------------------------------------------
create table public.zoning_overlays (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.zoning_municipalities (id) on delete cascade,
  code text not null,
  name text,
  description text,
  provider text not null,
  provider_overlay_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint zoning_overlays_code_length check (char_length(code) between 1 and 64),
  constraint zoning_overlays_provider_unique unique (provider, provider_overlay_id),
  constraint zoning_overlays_municipality_code_unique unique (municipality_id, code)
);

create index zoning_overlays_municipality_id_idx on public.zoning_overlays (municipality_id);

create trigger zoning_overlays_set_updated_at
before update on public.zoning_overlays
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- zoning_land_uses — permitted / conditional / prohibited uses per district
-- ---------------------------------------------------------------------------
create table public.zoning_land_uses (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.zoning_districts (id) on delete cascade,
  use_label text not null,
  permission text not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint zoning_land_uses_label_length check (char_length(use_label) between 1 and 200),
  constraint zoning_land_uses_permission_check check (
    permission in ('permitted', 'conditional', 'prohibited')
  )
);

create index zoning_land_uses_district_id_idx on public.zoning_land_uses (district_id);
create index zoning_land_uses_district_permission_idx
  on public.zoning_land_uses (district_id, permission);

-- ---------------------------------------------------------------------------
-- zoning_dimensional_regulations — FAR, height, setbacks, coverage, parking
-- ---------------------------------------------------------------------------
create table public.zoning_dimensional_regulations (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.zoning_districts (id) on delete cascade,
  max_far numeric(12, 4),
  max_density_units_per_acre numeric(12, 4),
  max_height_ft numeric(12, 2),
  max_lot_coverage_pct numeric(7, 3),
  setback_front_ft numeric(12, 2),
  setback_side_ft numeric(12, 2),
  setback_rear_ft numeric(12, 2),
  parking_requirement_text text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint zoning_dimensional_district_unique unique (district_id),
  constraint zoning_dimensional_far_nonneg check (max_far is null or max_far >= 0),
  constraint zoning_dimensional_density_nonneg check (
    max_density_units_per_acre is null or max_density_units_per_acre >= 0
  ),
  constraint zoning_dimensional_height_nonneg check (max_height_ft is null or max_height_ft >= 0),
  constraint zoning_dimensional_coverage_range check (
    max_lot_coverage_pct is null
    or (max_lot_coverage_pct >= 0 and max_lot_coverage_pct <= 100)
  ),
  constraint zoning_dimensional_setbacks_nonneg check (
    (setback_front_ft is null or setback_front_ft >= 0)
    and (setback_side_ft is null or setback_side_ft >= 0)
    and (setback_rear_ft is null or setback_rear_ft >= 0)
  )
);

comment on table public.zoning_dimensional_regulations is
  'FM-0016: Dimensional regs for a district. Units explicit (ft, %, FAR). Null = unknown, not zero.';

create trigger zoning_dimensional_set_updated_at
before update on public.zoning_dimensional_regulations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- parcel_zoning — classification link (parcel ↔ district) + provenance
-- ---------------------------------------------------------------------------
create table public.parcel_zoning (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references public.parcels (id) on delete cascade,
  district_id uuid not null references public.zoning_districts (id) on delete restrict,
  is_primary boolean not null default true,
  provider text not null,
  provider_record_id text not null,
  source_retrieved_at timestamptz,
  source_updated_at timestamptz,
  raw_source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint parcel_zoning_provider_unique unique (provider, provider_record_id),
  constraint parcel_zoning_parcel_district_unique unique (parcel_id, district_id)
);

comment on table public.parcel_zoning is
  'FM-0016: Parcel zoning classification with provider provenance. One primary per parcel.';

create index parcel_zoning_parcel_id_idx on public.parcel_zoning (parcel_id);
create index parcel_zoning_district_id_idx on public.parcel_zoning (district_id);

create unique index parcel_zoning_one_primary_per_parcel
  on public.parcel_zoning (parcel_id)
  where is_primary;

create trigger parcel_zoning_set_updated_at
before update on public.parcel_zoning
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- parcel_zoning_overlays — overlays applying to a parcel zoning record
-- ---------------------------------------------------------------------------
create table public.parcel_zoning_overlays (
  parcel_zoning_id uuid not null references public.parcel_zoning (id) on delete cascade,
  overlay_id uuid not null references public.zoning_overlays (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (parcel_zoning_id, overlay_id)
);

create index parcel_zoning_overlays_overlay_id_idx
  on public.parcel_zoning_overlays (overlay_id);
