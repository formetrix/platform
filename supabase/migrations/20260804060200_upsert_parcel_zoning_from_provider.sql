-- FM-0016: Trusted upsert for multi-provider zoning ingestion (service_role only).
-- Creates/updates municipality, district, dimensional regs, land uses, parcel link.
-- Does not invent values — callers pass explicit nulls for unknown fields.

create or replace function public.upsert_parcel_zoning_from_provider(
  p_parcel_id uuid,
  p_provider text,
  p_provider_record_id text,
  p_municipality_name text,
  p_municipality_provider_id text,
  p_district_code text,
  p_district_provider_id text,
  p_state_region text default null,
  p_country_code text default null,
  p_district_name text default null,
  p_district_description text default null,
  p_is_primary boolean default true,
  p_source_retrieved_at timestamptz default null,
  p_source_updated_at timestamptz default null,
  p_raw_source_metadata jsonb default '{}'::jsonb,
  p_max_far numeric default null,
  p_max_density_units_per_acre numeric default null,
  p_max_height_ft numeric default null,
  p_max_lot_coverage_pct numeric default null,
  p_setback_front_ft numeric default null,
  p_setback_side_ft numeric default null,
  p_setback_rear_ft numeric default null,
  p_parking_requirement_text text default null,
  p_dimensional_notes text default null,
  p_permitted_uses text[] default null,
  p_prohibited_uses text[] default null,
  p_overlay_codes text[] default null,
  p_overlay_names text[] default null
)
returns public.parcel_zoning
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider text;
  v_muni public.zoning_municipalities;
  v_district public.zoning_districts;
  v_row public.parcel_zoning;
  v_label text;
  v_overlay public.zoning_overlays;
  v_i int;
begin
  if p_parcel_id is null then
    raise exception 'parcel_id is required';
  end if;
  if p_provider is null or length(trim(p_provider)) = 0 then
    raise exception 'provider is required';
  end if;
  if p_provider_record_id is null or length(trim(p_provider_record_id)) = 0 then
    raise exception 'provider_record_id is required';
  end if;
  if p_municipality_name is null or length(trim(p_municipality_name)) = 0 then
    raise exception 'municipality_name is required';
  end if;
  if p_municipality_provider_id is null or length(trim(p_municipality_provider_id)) = 0 then
    raise exception 'municipality_provider_id is required';
  end if;
  if p_district_code is null or length(trim(p_district_code)) = 0 then
    raise exception 'district_code is required';
  end if;
  if p_district_provider_id is null or length(trim(p_district_provider_id)) = 0 then
    raise exception 'district_provider_id is required';
  end if;
  if not exists (select 1 from public.parcels where id = p_parcel_id) then
    raise exception 'parcel not found';
  end if;

  v_provider := lower(trim(p_provider));

  insert into public.zoning_municipalities (
    name, state_region, country_code, provider, provider_municipality_id
  )
  values (
    trim(p_municipality_name),
    p_state_region,
    p_country_code,
    v_provider,
    trim(p_municipality_provider_id)
  )
  on conflict (provider, provider_municipality_id) do update set
    name = excluded.name,
    state_region = coalesce(excluded.state_region, public.zoning_municipalities.state_region),
    country_code = coalesce(excluded.country_code, public.zoning_municipalities.country_code),
    updated_at = timezone('utc', now())
  returning * into v_muni;

  insert into public.zoning_districts (
    municipality_id, code, name, description, provider, provider_district_id
  )
  values (
    v_muni.id,
    trim(p_district_code),
    p_district_name,
    p_district_description,
    v_provider,
    trim(p_district_provider_id)
  )
  on conflict (provider, provider_district_id) do update set
    municipality_id = excluded.municipality_id,
    code = excluded.code,
    name = coalesce(excluded.name, public.zoning_districts.name),
    description = coalesce(excluded.description, public.zoning_districts.description),
    updated_at = timezone('utc', now())
  returning * into v_district;

  insert into public.zoning_dimensional_regulations (
    district_id,
    max_far,
    max_density_units_per_acre,
    max_height_ft,
    max_lot_coverage_pct,
    setback_front_ft,
    setback_side_ft,
    setback_rear_ft,
    parking_requirement_text,
    notes
  )
  values (
    v_district.id,
    p_max_far,
    p_max_density_units_per_acre,
    p_max_height_ft,
    p_max_lot_coverage_pct,
    p_setback_front_ft,
    p_setback_side_ft,
    p_setback_rear_ft,
    p_parking_requirement_text,
    p_dimensional_notes
  )
  on conflict (district_id) do update set
    max_far = excluded.max_far,
    max_density_units_per_acre = excluded.max_density_units_per_acre,
    max_height_ft = excluded.max_height_ft,
    max_lot_coverage_pct = excluded.max_lot_coverage_pct,
    setback_front_ft = excluded.setback_front_ft,
    setback_side_ft = excluded.setback_side_ft,
    setback_rear_ft = excluded.setback_rear_ft,
    parking_requirement_text = excluded.parking_requirement_text,
    notes = excluded.notes,
    updated_at = timezone('utc', now());

  delete from public.zoning_land_uses where district_id = v_district.id;

  if p_permitted_uses is not null then
    foreach v_label in array p_permitted_uses loop
      if v_label is not null and length(trim(v_label)) > 0 then
        insert into public.zoning_land_uses (district_id, use_label, permission)
        values (v_district.id, trim(v_label), 'permitted');
      end if;
    end loop;
  end if;

  if p_prohibited_uses is not null then
    foreach v_label in array p_prohibited_uses loop
      if v_label is not null and length(trim(v_label)) > 0 then
        insert into public.zoning_land_uses (district_id, use_label, permission)
        values (v_district.id, trim(v_label), 'prohibited');
      end if;
    end loop;
  end if;

  if p_is_primary then
    update public.parcel_zoning
    set is_primary = false, updated_at = timezone('utc', now())
    where parcel_id = p_parcel_id and is_primary = true;
  end if;

  insert into public.parcel_zoning (
    parcel_id,
    district_id,
    is_primary,
    provider,
    provider_record_id,
    source_retrieved_at,
    source_updated_at,
    raw_source_metadata
  )
  values (
    p_parcel_id,
    v_district.id,
    coalesce(p_is_primary, true),
    v_provider,
    trim(p_provider_record_id),
    p_source_retrieved_at,
    p_source_updated_at,
    coalesce(p_raw_source_metadata, '{}'::jsonb)
  )
  on conflict (provider, provider_record_id) do update set
    parcel_id = excluded.parcel_id,
    district_id = excluded.district_id,
    is_primary = excluded.is_primary,
    source_retrieved_at = excluded.source_retrieved_at,
    source_updated_at = excluded.source_updated_at,
    raw_source_metadata = excluded.raw_source_metadata,
    updated_at = timezone('utc', now())
  returning * into v_row;

  delete from public.parcel_zoning_overlays where parcel_zoning_id = v_row.id;

  if p_overlay_codes is not null then
    for v_i in 1 .. coalesce(array_length(p_overlay_codes, 1), 0) loop
      if p_overlay_codes[v_i] is null or length(trim(p_overlay_codes[v_i])) = 0 then
        continue;
      end if;
      insert into public.zoning_overlays (
        municipality_id, code, name, provider, provider_overlay_id
      )
      values (
        v_muni.id,
        trim(p_overlay_codes[v_i]),
        case
          when p_overlay_names is not null and array_length(p_overlay_names, 1) >= v_i
            then p_overlay_names[v_i]
          else null
        end,
        v_provider,
        v_provider || ':' || v_muni.id::text || ':' || trim(p_overlay_codes[v_i])
      )
      on conflict (provider, provider_overlay_id) do update set
        name = coalesce(excluded.name, public.zoning_overlays.name),
        updated_at = timezone('utc', now())
      returning * into v_overlay;

      insert into public.parcel_zoning_overlays (parcel_zoning_id, overlay_id)
      values (v_row.id, v_overlay.id)
      on conflict do nothing;
    end loop;
  end if;

  return v_row;
end;
$$;

revoke all on function public.upsert_parcel_zoning_from_provider(
  uuid, text, text, text, text, text, text, text, text, text, text, boolean,
  timestamptz, timestamptz, jsonb, numeric, numeric, numeric, numeric, numeric,
  numeric, numeric, text, text, text[], text[], text[], text[]
) from public;

grant execute on function public.upsert_parcel_zoning_from_provider(
  uuid, text, text, text, text, text, text, text, text, text, text, boolean,
  timestamptz, timestamptz, jsonb, numeric, numeric, numeric, numeric, numeric,
  numeric, numeric, text, text, text[], text[], text[], text[]
) to service_role;

comment on function public.upsert_parcel_zoning_from_provider is
  'FM-0016: SECURITY DEFINER zoning upsert for trusted provider ingestion (service_role).';
