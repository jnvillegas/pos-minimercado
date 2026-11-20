-- Migration: 20261121000000_user_profiles_and_saas_billing.sql
-- Description: User profiles table (personal data, DNI/CUIL, alias), SaaS billing info on businesses, and profile RPC

-- 1. Create user_profiles table
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text default '',
  dni_cuil text default '',
  alias text default '',
  avatar_url text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_id on public.user_profiles(id);

-- Grants
grant all on public.user_profiles to postgres, authenticated, service_role;
grant select on public.user_profiles to anon;

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Policies for user_profiles
create policy "Users can view their own profile"
  on public.user_profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Users can update their own profile"
  on public.user_profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Users can insert their own profile"
  on public.user_profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "Platform admins can view all profiles"
  on public.user_profiles for select
  to authenticated
  using (public.is_platform_admin());

create policy "Business members can view colleague profiles"
  on public.user_profiles for select
  to authenticated
  using (
    id in (
      select bm.user_id from public.business_members bm
      where bm.business_id in (select public.get_user_business_ids())
    )
  );

-- 2. Trigger on auth.users for new profile auto-creation
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- 3. Backfill all existing users in auth.users
insert into public.user_profiles (id, full_name)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

-- 4. Extend businesses with SaaS subscription details
alter table public.businesses
  add column if not exists subscription_plan text not null default 'pro',
  add column if not exists subscription_status text not null default 'active',
  add column if not exists subscription_price numeric not null default 15000,
  add column if not exists subscription_renewal_at timestamptz not null default (now() + interval '30 days'),
  add column if not exists business_cuit text default '',
  add column if not exists billing_alias text default '';

-- 5. Helper RPC to get complete profile payload in a single round-trip
create or replace function public.get_my_profile()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_profile record;
  v_user record;
  v_platform_role text;
  v_business_role text;
  v_business_id uuid;
  v_business_name text;
  v_business_cuit text;
  v_subscription_plan text;
  v_subscription_status text;
  v_subscription_price numeric;
  v_subscription_renewal_at timestamptz;
begin
  select * into v_user from auth.users where id = auth.uid();
  if v_user is null then
    return null;
  end if;

  select * into v_profile from public.user_profiles where id = auth.uid();
  
  -- Check platform admin role
  select role into v_platform_role from public.platform_admins where user_id = auth.uid() limit 1;

  -- Primary business membership
  select 
    bm.role,
    b.id,
    b.name,
    coalesce(b.business_cuit, ''),
    coalesce(b.subscription_plan, 'pro'),
    coalesce(b.subscription_status, 'active'),
    coalesce(b.subscription_price, 15000),
    b.subscription_renewal_at
  into 
    v_business_role,
    v_business_id,
    v_business_name,
    v_business_cuit,
    v_subscription_plan,
    v_subscription_status,
    v_subscription_price,
    v_subscription_renewal_at
  from public.business_members bm
  join public.businesses b on b.id = bm.business_id
  where bm.user_id = auth.uid()
  limit 1;

  return jsonb_build_object(
    'id', v_user.id,
    'email', v_user.email,
    'full_name', coalesce(v_profile.full_name, v_user.raw_user_meta_data->>'full_name', split_part(v_user.email, '@', 1)),
    'phone', coalesce(v_profile.phone, ''),
    'dni_cuil', coalesce(v_profile.dni_cuil, ''),
    'alias', coalesce(v_profile.alias, ''),
    'avatar_url', coalesce(v_profile.avatar_url, ''),
    'created_at', v_user.created_at,
    'is_platform_admin', (v_platform_role is not null),
    'platform_role', v_platform_role,
    'business_id', v_business_id,
    'business_role', v_business_role,
    'business_name', v_business_name,
    'business_cuit', v_business_cuit,
    'subscription_plan', coalesce(v_subscription_plan, 'pro'),
    'subscription_status', coalesce(v_subscription_status, 'active'),
    'subscription_price', coalesce(v_subscription_price, 15000),
    'subscription_renewal_at', v_subscription_renewal_at
  );
end;
$$;
