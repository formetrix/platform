-- FM-0011: RLS for properties, property_parcels, and parcels.
-- Reuses public.is_active_org_member / public.has_org_role from FM-0010.
-- Do NOT apply automatically.

-- Helper: property belongs to an org the user actively belongs to.
create or replace function public.can_access_property(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.properties p
    where p.id = p_property_id
      and public.is_active_org_member(p.organization_id)
  );
$$;

revoke all on function public.can_access_property(uuid) from public;
grant execute on function public.can_access_property(uuid) to authenticated;

comment on function public.can_access_property(uuid) is
  'SECURITY DEFINER: true when auth.uid() is an active member of the Property''s Organization.';

alter table public.properties enable row level security;
alter table public.property_parcels enable row level security;
alter table public.parcels enable row level security;

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------
create policy properties_select_active_members
  on public.properties
  for select
  to authenticated
  using (public.is_active_org_member(organization_id));

-- Create: active members with write roles (owner/admin/member). Viewers cannot.
create policy properties_insert_writers
  on public.properties
  for insert
  to authenticated
  with check (
    public.has_org_role(organization_id, array['owner', 'admin', 'member']::text[])
    and (created_by is null or created_by = auth.uid())
  );

create policy properties_update_writers
  on public.properties
  for update
  to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin', 'member']::text[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'member']::text[]));

-- Soft archive preferred; hard delete limited to owners/admins.
create policy properties_delete_owners_admins
  on public.properties
  for delete
  to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::text[]));

-- ---------------------------------------------------------------------------
-- property_parcels — visibility/mutation follow Property ownership
-- ---------------------------------------------------------------------------
create policy property_parcels_select_via_property
  on public.property_parcels
  for select
  to authenticated
  using (public.can_access_property(property_id));

create policy property_parcels_insert_writers
  on public.property_parcels
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.properties p
      where p.id = property_id
        and public.has_org_role(p.organization_id, array['owner', 'admin', 'member']::text[])
    )
  );

create policy property_parcels_update_writers
  on public.property_parcels
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.properties p
      where p.id = property_id
        and public.has_org_role(p.organization_id, array['owner', 'admin', 'member']::text[])
    )
  )
  with check (
    exists (
      select 1
      from public.properties p
      where p.id = property_id
        and public.has_org_role(p.organization_id, array['owner', 'admin', 'member']::text[])
    )
  );

create policy property_parcels_delete_writers
  on public.property_parcels
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.properties p
      where p.id = property_id
        and public.has_org_role(p.organization_id, array['owner', 'admin', 'member']::text[])
    )
  );

-- ---------------------------------------------------------------------------
-- parcels — shared reference read; mutations via trusted ingestion only
-- ---------------------------------------------------------------------------
-- Authenticated users may read parcel reference data (no org-private fields).
-- Linking is gated by property_parcels policies; private Property rows stay private.
create policy parcels_select_authenticated
  on public.parcels
  for select
  to authenticated
  using (true);

-- No insert/update/delete policies for `authenticated`.
-- Ingestion uses the service role (bypasses RLS) or a future SECURITY DEFINER
-- RPC that validates provider payloads server-side (Regrid ticket).
