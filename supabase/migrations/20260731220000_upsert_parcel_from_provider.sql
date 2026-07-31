-- FM-0012: Trusted parcel upsert for provider ingestion (service_role only).
-- Accepts GeoJSON (Polygon or MultiPolygon); stores MultiPolygon EPSG:4326.
-- Identity: unique (provider, provider_parcel_id) — reuse on conflict.

create or replace function public.upsert_parcel_from_provider(
  p_provider text,
  p_provider_parcel_id text,
  p_apn text default null,
  p_normalized_apn text default null,
  p_county text default null,
  p_state_region text default null,
  p_country_code text default null,
  p_situs_address text default null,
  p_acreage numeric default null,
  p_geometry_geojson text default null,
  p_geometry_source text default null,
  p_source_retrieved_at timestamptz default null,
  p_source_updated_at timestamptz default null,
  p_raw_source_metadata jsonb default '{}'::jsonb,
  p_geometry_quality text default null
)
returns public.parcels
language plpgsql
security definer
set search_path = public
as $$
declare
  v_geom geometry(MultiPolygon, 4326);
  v_row public.parcels;
begin
  if p_provider is null or length(trim(p_provider)) = 0 then
    raise exception 'provider is required';
  end if;
  if p_provider_parcel_id is null or length(trim(p_provider_parcel_id)) = 0 then
    raise exception 'provider_parcel_id is required';
  end if;

  if p_geometry_geojson is not null and length(trim(p_geometry_geojson)) > 0 then
    v_geom := st_multi(
      st_setsrid(st_geomfromgeojson(p_geometry_geojson), 4326)
    )::geometry(MultiPolygon, 4326);
  end if;

  insert into public.parcels (
    provider,
    provider_parcel_id,
    apn,
    normalized_apn,
    county,
    state_region,
    country_code,
    situs_address,
    acreage,
    geometry,
    geometry_source,
    source_retrieved_at,
    source_updated_at,
    raw_source_metadata,
    geometry_quality
  )
  values (
    lower(trim(p_provider)),
    trim(p_provider_parcel_id),
    p_apn,
    p_normalized_apn,
    p_county,
    p_state_region,
    p_country_code,
    p_situs_address,
    p_acreage,
    v_geom,
    p_geometry_source,
    p_source_retrieved_at,
    p_source_updated_at,
    coalesce(p_raw_source_metadata, '{}'::jsonb),
    p_geometry_quality
  )
  on conflict (provider, provider_parcel_id) do update set
    apn = excluded.apn,
    normalized_apn = excluded.normalized_apn,
    county = excluded.county,
    state_region = excluded.state_region,
    country_code = excluded.country_code,
    situs_address = excluded.situs_address,
    acreage = excluded.acreage,
    geometry = coalesce(excluded.geometry, public.parcels.geometry),
    geometry_source = coalesce(excluded.geometry_source, public.parcels.geometry_source),
    source_retrieved_at = excluded.source_retrieved_at,
    source_updated_at = coalesce(excluded.source_updated_at, public.parcels.source_updated_at),
    raw_source_metadata = excluded.raw_source_metadata,
    geometry_quality = coalesce(excluded.geometry_quality, public.parcels.geometry_quality),
    updated_at = timezone('utc', now())
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.upsert_parcel_from_provider is
  'Service-role parcel upsert by (provider, provider_parcel_id). Used by Regrid ingestion (FM-0012).';

revoke all on function public.upsert_parcel_from_provider(
  text, text, text, text, text, text, text, text, numeric, text, text, timestamptz, timestamptz, jsonb, text
) from public;

grant execute on function public.upsert_parcel_from_provider(
  text, text, text, text, text, text, text, text, numeric, text, text, timestamptz, timestamptz, jsonb, text
) to service_role;
