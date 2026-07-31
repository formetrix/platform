-- FM-0011: Properties, shared parcels, property_parcels (PostGIS).
-- Depends on: 20260731200000_organization_membership.sql, 20260731210000_enable_postgis.sql
-- Do NOT apply automatically. See README / docs/DATABASE_SCHEMA.md.
--
-- Spatial design (ADR-0033):
-- - SRID 4326 (WGS 84) for nationally scalable lon/lat storage and web maps.
-- - Parcel boundary: geometry(MultiPolygon, 4326) — multiparts are common.
-- - Parcel centroid: geometry(Point, 4326), maintained from boundary when present.
-- - Property lat/lng: optional display pin only; never authoritative vs parcel geometry.
-- - Acreage: numeric acres (US customary) as reported by provider; not recomputed here.

-- ---------------------------------------------------------------------------
-- properties — Organization-private opportunity records
-- ---------------------------------------------------------------------------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  status text not null default 'discovered',
  address_line_1 text,
  address_line_2 text,
  city text,
  state_region text,
  postal_code text,
  country_code text,
  latitude double precision,
  longitude double precision,
  created_by uuid references public.user_profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  constraint properties_name_length check (char_length(name) between 1 and 200),
  constraint properties_status_v1_check check (
    status in (
      'discovered',
      'evaluating',
      'under_contract',
      'acquired',
      'archived'
    )
  ),
  constraint properties_lat_range check (
    latitude is null or (latitude >= -90 and latitude <= 90)
  ),
  constraint properties_lng_range check (
    longitude is null or (longitude >= -180 and longitude <= 180)
  ),
  constraint properties_lat_lng_pair check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  )
);

comment on table public.properties is
  'Organization-private acquisition/development opportunity. Not a Parcel.';
comment on column public.properties.latitude is
  'Optional map display pin only. Authoritative geometry lives on parcels.';
comment on column public.properties.longitude is
  'Optional map display pin only. Authoritative geometry lives on parcels.';
comment on column public.properties.status is
  'V1 lifecycle (FD-0004). Deferred statuses (planning…completed) are not active values yet.';

create index properties_organization_id_idx on public.properties (organization_id);
create index properties_organization_status_idx on public.properties (organization_id, status);
create index properties_created_by_idx on public.properties (created_by);

create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- parcels — shared land reference data (cross-org safe)
-- ---------------------------------------------------------------------------
create table public.parcels (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_parcel_id text not null,
  apn text,
  normalized_apn text,
  county text,
  state_region text,
  country_code text,
  situs_address text,
  -- Provider-reported acreage in acres (US). Not derived from geometry in V1.
  acreage numeric(14, 6),
  geometry geometry(MultiPolygon, 4326),
  centroid geometry(Point, 4326),
  geometry_source text,
  source_retrieved_at timestamptz,
  source_updated_at timestamptz,
  raw_source_metadata jsonb not null default '{}'::jsonb,
  geometry_quality text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint parcels_provider_parcel_unique unique (provider, provider_parcel_id),
  constraint parcels_acreage_nonnegative check (acreage is null or acreage >= 0),
  constraint parcels_geometry_srid check (
    geometry is null or st_srid(geometry) = 4326
  ),
  constraint parcels_centroid_srid check (
    centroid is null or st_srid(centroid) = 4326
  ),
  constraint parcels_geometry_quality_check check (
    geometry_quality is null
    or geometry_quality in ('high', 'medium', 'low', 'unknown')
  )
);

comment on table public.parcels is
  'Shared parcel reference data. Must never store Organization-private Property analysis.';
comment on column public.parcels.geometry is
  'Source parcel boundary as MultiPolygon in EPSG:4326. Not development/derived geometry.';
comment on column public.parcels.centroid is
  'Representative point; auto-filled from geometry when boundary is present.';
comment on column public.parcels.raw_source_metadata is
  'Provider payload snapshot for provenance. Refresh appends/updates with timestamps preserved.';
comment on column public.parcels.normalized_apn is
  'Uppercase alphanumeric APN for cross-provider lookup; display APN stays in apn.';

create index parcels_normalized_apn_idx on public.parcels (normalized_apn);
create index parcels_state_county_idx on public.parcels (state_region, county);
create index parcels_geometry_gix on public.parcels using gist (geometry);
create index parcels_centroid_gix on public.parcels using gist (centroid);

create trigger parcels_set_updated_at
before update on public.parcels
for each row execute function public.set_updated_at();

-- Keep centroid in sync with boundary when geometry is set/changed.
create or replace function public.parcels_sync_centroid()
returns trigger
language plpgsql
as $$
begin
  if new.geometry is not null then
    if not st_isvalid(new.geometry) then
      raise exception 'Parcel geometry must be a valid MultiPolygon';
    end if;
    -- Force MultiPolygon if a Polygon is somehow supplied.
    if geometrytype(new.geometry) = 'POLYGON' then
      new.geometry := st_multi(new.geometry);
    end if;
    if new.centroid is null or (tg_op = 'UPDATE' and old.geometry is distinct from new.geometry) then
      new.centroid := st_pointonsurface(new.geometry);
    end if;
  end if;
  return new;
end;
$$;

create trigger parcels_sync_centroid
before insert or update of geometry, centroid on public.parcels
for each row execute function public.parcels_sync_centroid();

-- ---------------------------------------------------------------------------
-- property_parcels — m:n link (private via Property ownership)
-- ---------------------------------------------------------------------------
create table public.property_parcels (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  parcel_id uuid not null references public.parcels (id) on delete restrict,
  relationship_type text not null default 'component',
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint property_parcels_unique unique (property_id, parcel_id),
  constraint property_parcels_relationship_check check (
    relationship_type in ('primary_site', 'component', 'adjacent', 'other')
  )
);

comment on table public.property_parcels is
  'Links Organization-private Properties to shared Parcels without copying private data onto parcels.';

create index property_parcels_property_id_idx on public.property_parcels (property_id);
create index property_parcels_parcel_id_idx on public.property_parcels (parcel_id);

-- At most one primary parcel per Property.
create unique index property_parcels_one_primary_per_property
  on public.property_parcels (property_id)
  where (is_primary);
