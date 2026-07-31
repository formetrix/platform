-- FM-0010: Organization & workspace membership foundation
-- Migration-ready PostgreSQL for Supabase. Do NOT apply automatically.
-- Apply manually when a Supabase project is provisioned (see README).

-- ---------------------------------------------------------------------------
-- Helpers: updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- user_profiles
-- Application profile 1:1 with auth.users. PK id == auth user id (ADR-0032).
-- TypeScript exposes authUserId as an alias of id.
-- ---------------------------------------------------------------------------
create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  active_organization_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_profiles_email_unique unique (email)
);

create index user_profiles_email_idx on public.user_profiles (email);

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

comment on table public.user_profiles is
  'Application user profile. id equals auth.users.id (authUserId).';
comment on column public.user_profiles.active_organization_id is
  'Preferred active organization; always verified against an active membership before use.';

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_by uuid references public.user_profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organizations_slug_unique unique (slug),
  constraint organizations_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(slug) between 2 and 48
  ),
  constraint organizations_name_length check (char_length(name) between 2 and 80)
);

create index organizations_created_by_idx on public.organizations (created_by);

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

-- Deferred FK from profiles → organizations (active org preference)
alter table public.user_profiles
  add constraint user_profiles_active_organization_id_fkey
  foreign key (active_organization_id)
  references public.organizations (id)
  on delete set null;

-- ---------------------------------------------------------------------------
-- organization_memberships
-- ---------------------------------------------------------------------------
create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  role text not null,
  status text not null,
  invited_by uuid references public.user_profiles (id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_memberships_org_user_unique unique (organization_id, user_id),
  constraint organization_memberships_role_check check (
    role in ('owner', 'admin', 'member', 'viewer')
  ),
  constraint organization_memberships_status_check check (
    status in ('invited', 'active', 'suspended', 'removed')
  )
);

create index organization_memberships_user_id_idx
  on public.organization_memberships (user_id);
create index organization_memberships_organization_id_idx
  on public.organization_memberships (organization_id);
create index organization_memberships_org_status_idx
  on public.organization_memberships (organization_id, status);

-- V1: at most one active membership per user (FD-0002). Drop/replace when
-- multi-organization membership is product-enabled.
create unique index organization_memberships_one_active_per_user
  on public.organization_memberships (user_id)
  where (status = 'active');

create trigger organization_memberships_set_updated_at
before update on public.organization_memberships
for each row execute function public.set_updated_at();

-- Prevent a user from changing their own role (blocks self-elevation).
create or replace function public.prevent_membership_self_role_change()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null
     and old.user_id = auth.uid()
     and new.role is distinct from old.role then
    raise exception 'Members cannot change their own role';
  end if;
  return new;
end;
$$;

create trigger organization_memberships_no_self_role_change
before update on public.organization_memberships
for each row execute function public.prevent_membership_self_role_change();
