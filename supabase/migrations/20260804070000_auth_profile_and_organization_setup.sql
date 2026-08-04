-- FM-0006A: Authentication UI support — profile provisioning + first-login org setup.
--
-- Two pieces the application layer must not do by hand:
--   1. A user_profiles row for every auth.users row, created atomically with the
--      Auth user so no signed-in user can exist without a profile.
--   2. Organization + owner membership + active-organization preference created
--      in ONE transaction. Doing this as three client round-trips can leave an
--      orphan organization with no owner if a later step fails.
--
-- Both run SECURITY DEFINER. Neither accepts a caller-supplied user id: the
-- actor is always auth.uid() / the inserted auth row, so a client cannot create
-- an organization owned by someone else (FORMETRIX.md §19).

-- ---------------------------------------------------------------------------
-- 1. Profile provisioning from auth.users
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict do nothing;
  return new;
exception
  when others then
    -- A profile problem must never block account creation — GoTrue would surface
    -- it as an opaque "Database error saving new user". The application calls
    -- ensureUserProfile() after authentication, which repairs a missing row.
    raise warning 'handle_new_auth_user could not provision a profile for %: %', new.id, sqlerrm;
    return new;
end;
$$;

comment on function public.handle_new_auth_user is
  'FM-0006A: creates public.user_profiles for a new auth.users row. Never blocks signup.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Keep the profile email in step with a confirmed Auth email change. Skipped
-- when another profile already holds the address (user_profiles_email_unique),
-- so an email change can never fail the Auth-side update.
create or replace function public.handle_auth_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is not null
     and not exists (
       select 1 from public.user_profiles p
       where p.email = new.email and p.id <> new.id
     ) then
    update public.user_profiles
    set email = new.email
    where id = new.id;
  end if;
  return new;
exception
  when others then
    raise warning 'handle_auth_user_email_change failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

comment on function public.handle_auth_user_email_change is
  'FM-0006A: mirrors a confirmed auth.users email change onto public.user_profiles.';

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
after update of email on auth.users
for each row
when (new.email is distinct from old.email)
execute function public.handle_auth_user_email_change();

-- Backfill profiles for Auth users that predate the trigger.
insert into public.user_profiles (id, email)
select u.id, u.email
from auth.users u
where u.email is not null
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 2. First-login organization setup (atomic)
-- ---------------------------------------------------------------------------
-- Returns a status instead of raising, so the UI can show a specific,
-- actionable message ("that URL is taken") rather than parsing SQLSTATEs:
--   ok | unauthenticated | invalid_name | invalid_slug | profile_missing
--   | already_member | slug_taken | conflict
create or replace function public.create_organization_with_owner(
  p_name text,
  p_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_name text := btrim(coalesce(p_name, ''));
  v_slug text := lower(btrim(coalesce(p_slug, '')));
  v_org public.organizations;
begin
  if v_user_id is null then
    return jsonb_build_object('status', 'unauthenticated');
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    return jsonb_build_object('status', 'invalid_name');
  end if;

  -- Mirrors organizations_slug_format / src/lib/organizations/slug.ts.
  if char_length(v_slug) < 2
     or char_length(v_slug) > 48
     or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    return jsonb_build_object('status', 'invalid_slug');
  end if;

  select u.email into v_email from auth.users u where u.id = v_user_id;
  if v_email is null then
    return jsonb_build_object('status', 'unauthenticated');
  end if;

  -- Defensive: the auth trigger normally did this already.
  insert into public.user_profiles (id, email)
  values (v_user_id, v_email)
  on conflict do nothing;

  if not exists (select 1 from public.user_profiles where id = v_user_id) then
    return jsonb_build_object('status', 'profile_missing');
  end if;

  -- V1 policy (FD-0002): exactly one active membership per user. Enforced here
  -- for a readable message, and by organization_memberships_one_active_per_user.
  if exists (
    select 1 from public.organization_memberships
    where user_id = v_user_id and status = 'active'
  ) then
    return jsonb_build_object('status', 'already_member');
  end if;

  if exists (select 1 from public.organizations where slug = v_slug) then
    return jsonb_build_object('status', 'slug_taken');
  end if;

  insert into public.organizations (name, slug, created_by)
  values (v_name, v_slug, v_user_id)
  returning * into v_org;

  insert into public.organization_memberships (
    organization_id, user_id, role, status, joined_at
  )
  values (
    v_org.id, v_user_id, 'owner', 'active', timezone('utc', now())
  );

  update public.user_profiles
  set active_organization_id = v_org.id
  where id = v_user_id;

  return jsonb_build_object(
    'status', 'ok',
    'organization', jsonb_build_object(
      'id', v_org.id,
      'name', v_org.name,
      'slug', v_org.slug,
      'created_by', v_org.created_by,
      'created_at', v_org.created_at,
      'updated_at', v_org.updated_at
    )
  );
exception
  when unique_violation then
    -- Lost a race against a concurrent create (duplicate slug, or a second
    -- active membership). The whole function rolls back; nothing partial lands.
    return jsonb_build_object('status', 'conflict');
end;
$$;

comment on function public.create_organization_with_owner is
  'FM-0006A: atomically creates an Organization, its owner Membership, and the active-organization preference for auth.uid(). Returns a status object.';

revoke all on function public.create_organization_with_owner(text, text) from public;
grant execute on function public.create_organization_with_owner(text, text) to authenticated;
