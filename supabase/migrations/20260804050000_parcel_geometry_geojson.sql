-- FM-0015: Expose parcel PostGIS geometry as GeoJSON for Mapbox.
-- Depends on: 20260731210100_properties_parcels.sql, 20260731210200_properties_parcels_rls.sql
-- Do NOT invent boundaries — returns only stored geometry via ST_AsGeoJSON.
-- SECURITY INVOKER: parcels RLS still applies (authenticated read).

create or replace function public.parcel_geometries_geojson(p_parcel_ids uuid[])
returns table (
  parcel_id uuid,
  geometry_geojson jsonb,
  centroid_geojson jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id as parcel_id,
    case
      when p.geometry is null then null
      else st_asgeojson(p.geometry)::jsonb
    end as geometry_geojson,
    case
      when p.centroid is null then null
      else st_asgeojson(p.centroid)::jsonb
    end as centroid_geojson
  from public.parcels p
  where p_parcel_ids is not null
    and p.id = any (p_parcel_ids);
$$;

revoke all on function public.parcel_geometries_geojson(uuid[]) from public;
grant execute on function public.parcel_geometries_geojson(uuid[]) to authenticated;

comment on function public.parcel_geometries_geojson(uuid[]) is
  'FM-0015: Return ST_AsGeoJSON for parcel boundary/centroid. SECURITY INVOKER + parcels RLS.';
