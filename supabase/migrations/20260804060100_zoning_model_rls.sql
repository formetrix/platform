-- FM-0016: RLS for zoning reference tables and parcel_zoning.
-- Reference data: authenticated read; mutations via service_role / future ingestion RPC.
-- parcel_zoning: same read posture as parcels (authenticated); no authenticated writes.

alter table public.zoning_municipalities enable row level security;
alter table public.zoning_districts enable row level security;
alter table public.zoning_overlays enable row level security;
alter table public.zoning_land_uses enable row level security;
alter table public.zoning_dimensional_regulations enable row level security;
alter table public.parcel_zoning enable row level security;
alter table public.parcel_zoning_overlays enable row level security;

create policy zoning_municipalities_select_authenticated
  on public.zoning_municipalities for select to authenticated using (true);

create policy zoning_districts_select_authenticated
  on public.zoning_districts for select to authenticated using (true);

create policy zoning_overlays_select_authenticated
  on public.zoning_overlays for select to authenticated using (true);

create policy zoning_land_uses_select_authenticated
  on public.zoning_land_uses for select to authenticated using (true);

create policy zoning_dimensional_select_authenticated
  on public.zoning_dimensional_regulations for select to authenticated using (true);

create policy parcel_zoning_select_authenticated
  on public.parcel_zoning for select to authenticated using (true);

create policy parcel_zoning_overlays_select_authenticated
  on public.parcel_zoning_overlays for select to authenticated using (true);
