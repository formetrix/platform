-- FM-0030: Restrict parcel/zoning ingestion RPCs to the service role.
--
-- `upsert_parcel_from_provider` (FM-0012) and `upsert_parcel_zoning_from_provider`
-- (FM-0016) are SECURITY DEFINER: they run as the owner and bypass RLS, which is
-- what lets trusted ingestion write `public.parcels` even though that table grants
-- `authenticated` no INSERT/UPDATE policy at all.
--
-- Both migrations ended with `revoke all ... from public` followed by
-- `grant execute ... to service_role`, which reads as "service role only" but is
-- not. Supabase's default privileges grant EXECUTE on new functions in `public`
-- directly to the `anon` and `authenticated` roles, and REVOKE ... FROM PUBLIC
-- does not touch a grant held by a named role. A configuration audit confirmed
-- `has_function_privilege('anon', ...)` was true on the hosted project: anyone
-- holding the publishable key could insert or overwrite shared parcel and zoning
-- reference data, bypassing RLS — exactly the fabricated-land-record scenario
-- FORMETRIX.md §7 forbids.
--
-- Fixed here by revoking from the named roles as well, then re-granting only to
-- `service_role`.
--
-- Scope note: the underlying default-privilege behavior is global and is left
-- alone deliberately. Narrowing it would also strip `authenticated` from
-- functions that are supposed to be callable by signed-in users
-- (`create_organization_with_owner`, the RLS helpers `is_active_org_member` /
-- `has_org_role` / `can_access_property`). Every future SECURITY DEFINER function
-- that must stay server-only needs the same explicit revoke; the regression test
-- in src/lib/properties/ingestion/rpc-permissions.test.ts enforces that for the
-- ingestion RPCs.

-- ---------------------------------------------------------------------------
-- Apply to every overload, not just the signature that exists today.
-- `create or replace` with an added parameter produces a *new* function that
-- would silently inherit the default grants — which is how this was missed once
-- already. Looping over proname covers that case.
-- ---------------------------------------------------------------------------
do $$
declare
  fn record;
  ingestion_functions constant text[] := array[
    'upsert_parcel_from_provider',
    'upsert_parcel_zoning_from_provider'
  ];
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any (ingestion_functions)
  loop
    execute format('revoke all on function %s from public', fn.signature);
    execute format('revoke all on function %s from anon', fn.signature);
    execute format('revoke all on function %s from authenticated', fn.signature);
    execute format('grant execute on function %s to service_role', fn.signature);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Self-verify: fail the migration rather than reporting success on a database
-- where the privileges did not actually change.
-- ---------------------------------------------------------------------------
do $$
declare
  offenders text;
begin
  select string_agg(format('%s executable by %s', p.oid::regprocedure, r.role_name), '; ')
  into offenders
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  cross join lateral (values ('anon'), ('authenticated')) as r(role_name)
  where n.nspname = 'public'
    and p.proname in ('upsert_parcel_from_provider', 'upsert_parcel_zoning_from_provider')
    and has_function_privilege(r.role_name, p.oid, 'EXECUTE');

  if offenders is not null then
    raise exception 'FM-0030: ingestion RPC still executable by an untrusted role: %', offenders;
  end if;
end;
$$;

comment on function public.upsert_parcel_from_provider(
  text, text, text, text, text, text, text, text, numeric, text, text, timestamptz, timestamptz, jsonb, text
) is
  'Service-role parcel upsert by (provider, provider_parcel_id). Used by Regrid ingestion (FM-0012). EXECUTE is granted to service_role only (FM-0030).';

comment on function public.upsert_parcel_zoning_from_provider(
  uuid, text, text, text, text, text, text, text, text, text, text, boolean,
  timestamptz, timestamptz, jsonb, numeric, numeric, numeric, numeric, numeric,
  numeric, numeric, text, text, text[], text[], text[], text[]
) is
  'Service-role zoning upsert for a parcel classification (FM-0016). EXECUTE is granted to service_role only (FM-0030).';
