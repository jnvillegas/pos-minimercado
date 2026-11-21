-- Migration: 20261121000003_admin_subscription_rpcs.sql
-- Description: Security Definer RPCs and auto-registration for platform admins to ensure subscription updates always save

-- 1. Upgrade is_platform_admin() with email fallback, service role, and auto-registration
create or replace function public.is_platform_admin()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  _uid uuid := auth.uid();
  _is_admin boolean := false;
begin
  -- Postgres superuser or service_role always has platform admin access
  if current_user in ('postgres', 'service_role') then
    return true;
  end if;

  if _uid is null then
    return false;
  end if;

  select exists (
    select 1 from public.platform_admins
    where user_id = _uid
  ) into _is_admin;

  if _is_admin then
    return true;
  end if;

  -- If user has authorized email, auto-register them in platform_admins
  if exists (
    select 1 from auth.users
    where id = _uid
      and lower(email) in (
        'dueño@minimercado.com',
        'jnvillegas86@gmail.com',
        'jnvillegas85@gmail.com'
      )
  ) then
    insert into public.platform_admins (user_id, role)
    values (_uid, 'superadmin')
    on conflict (user_id) do nothing;
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.is_platform_admin to postgres, authenticated, service_role;

-- 2. Create update_platform_plan RPC
create or replace function public.update_platform_plan(
  p_plan_id text,
  p_name text,
  p_subtitle text,
  p_price numeric,
  p_badge text,
  p_features jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Acceso denegado: solo superadministradores pueden configurar planes';
  end if;

  update public.platform_subscription_plans
  set
    name = coalesce(p_name, name),
    subtitle = coalesce(p_subtitle, subtitle),
    price = coalesce(p_price, price),
    badge = coalesce(p_badge, badge),
    features = coalesce(p_features, features),
    updated_at = now()
  where id = p_plan_id;

  if not found then
    insert into public.platform_subscription_plans (id, name, subtitle, price, badge, features)
    values (p_plan_id, p_name, p_subtitle, p_price, p_badge, coalesce(p_features, '[]'::jsonb));
  end if;

  return jsonb_build_object('success', true, 'plan_id', p_plan_id);
end;
$$;

grant execute on function public.update_platform_plan to postgres, authenticated, service_role;

-- 3. Create assign_business_subscription RPC
create or replace function public.assign_business_subscription(
  p_business_id uuid,
  p_plan_id text,
  p_price numeric,
  p_notes text default '',
  p_status text default 'active'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  _final_price numeric := p_price;
begin
  if not public.is_platform_admin() then
    raise exception 'Acceso denegado: solo superadministradores pueden asignar suscripciones';
  end if;

  -- If price was not specified and plan is not custom, take it from catalog
  if p_plan_id <> 'custom' and (_final_price is null or _final_price <= 0) then
    select price into _final_price
    from public.platform_subscription_plans
    where id = p_plan_id;
  end if;

  update public.businesses
  set
    subscription_plan = p_plan_id,
    subscription_price = coalesce(_final_price, 0),
    subscription_notes = coalesce(p_notes, ''),
    subscription_status = coalesce(p_status, 'active'),
    updated_at = now()
  where id = p_business_id;

  if not found then
    raise exception 'Comercio no encontrado con id %', p_business_id;
  end if;

  return jsonb_build_object('success', true, 'business_id', p_business_id);
end;
$$;

grant execute on function public.assign_business_subscription to postgres, authenticated, service_role;

-- 4. Reload PostgREST
notify pgrst, 'reload schema';
