-- FM-0010: RLS for profiles, organizations, memberships
-- Uses SECURITY DEFINER helpers to avoid circular RLS on memberships.
-- Apply after 20260731200000_organization_membership.sql. Not auto-applied.

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER helpers (search_path fixed; no privilege escalation paths)
-- ---------------------------------------------------------------------------
create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function public.is_active_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.has_org_role(
  p_organization_id uuid,
  p_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

revoke all on function public.is_active_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, text[]) from public;
grant execute on function public.is_active_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, text[]) to authenticated;

comment on function public.is_active_org_member(uuid) is
  'SECURITY DEFINER: true when auth.uid() has an active membership in the org. Used by RLS to avoid circular policies.';
comment on function public.has_org_role(uuid, text[]) is
  'SECURITY DEFINER: true when auth.uid() is an active member with one of the listed roles.';

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.user_profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;

-- ---------------------------------------------------------------------------
-- user_profiles
-- ---------------------------------------------------------------------------
create policy user_profiles_select_own
  on public.user_profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy user_profiles_insert_own
  on public.user_profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- Users may update their own profile fields, but not impersonate another id.
-- active_organization_id is writable here; app layer still verifies membership.
create policy user_profiles_update_own
  on public.user_profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- organizations — visible only to active members
-- ---------------------------------------------------------------------------
create policy organizations_select_active_members
  on public.organizations
  for select
  to authenticated
  using (public.is_active_org_member(id));

-- Creation: any authenticated user may create an org (onboarding). created_by
-- must be self. Membership row is inserted in a follow-up (service/trigger later).
create policy organizations_insert_authenticated
  on public.organizations
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy organizations_update_owners_admins
  on public.organizations
  for update
  to authenticated
  using (public.has_org_role(id, array['owner', 'admin']::text[]))
  with check (public.has_org_role(id, array['owner', 'admin']::text[]));

create policy organizations_delete_owners
  on public.organizations
  for delete
  to authenticated
  using (public.has_org_role(id, array['owner']::text[]));

-- ---------------------------------------------------------------------------
-- organization_memberships
-- ---------------------------------------------------------------------------
-- Members can read memberships for orgs they actively belong to; invitees can
-- read their own invited row.
create policy memberships_select_visible
  on public.organization_memberships
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_active_org_member(organization_id)
  );

-- Owners/admins may invite (insert) memberships for their org.
-- Bootstrapping the first owner row: allow insert when user_id = auth.uid()
-- and role = owner (org creator path).
create policy memberships_insert_authorized
  on public.organization_memberships
  for insert
  to authenticated
  with check (
    (
      user_id = auth.uid()
      and role = 'owner'
      and status = 'active'
    )
    or public.has_org_role(organization_id, array['owner', 'admin']::text[])
  );

-- Owners/admins may update memberships in their org. Self-role changes are
-- blocked by trigger prevent_membership_self_role_change. Viewers/members
-- cannot manage others.
create policy memberships_update_owners_admins
  on public.organization_memberships
  for update
  to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::text[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin']::text[]));

-- Soft-delete / hard-delete of memberships: owners/admins only.
create policy memberships_delete_owners_admins
  on public.organization_memberships
  for delete
  to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']::text[]));
