-- Migration: 20261118000000_setup_auth_and_business.sql
-- Description: Core schema for businesses, business_members, RLS isolation, and atomic onboarding RPC

-- 1. Create businesses table
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text not null,
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_businesses_created_at on public.businesses(created_at);

-- 2. Create business_members table
create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'cashier')),
  created_at timestamptz not null default now(),
  constraint uq_business_member unique (business_id, user_id)
);

create index if not exists idx_business_members_user_id on public.business_members(user_id);
create index if not exists idx_business_members_business_id on public.business_members(business_id);

-- 3. Security Definer Helper Functions (Prevents RLS Recursion)
create or replace function public.get_user_business_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select business_id from public.business_members where user_id = auth.uid();
$$;

create or replace function public.is_business_member(p_business_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.business_members
    where business_id = p_business_id and user_id = auth.uid()
  );
$$;

create or replace function public.get_business_role(p_business_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.business_members
  where business_id = p_business_id and user_id = auth.uid()
  limit 1;
$$;

-- 4. Enable Row Level Security (RLS)
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;

-- Businesses policies
create policy "Users can view businesses they are member of"
  on public.businesses for select
  to authenticated
  using (id in (select public.get_user_business_ids()));

create policy "Owners and managers can update business details"
  on public.businesses for update
  to authenticated
  using (public.get_business_role(id) in ('owner', 'manager'))
  with check (public.get_business_role(id) in ('owner', 'manager'));

create policy "Owners can delete their business"
  on public.businesses for delete
  to authenticated
  using (public.get_business_role(id) = 'owner');

-- Business members policies
create policy "Members can view membership within their businesses"
  on public.business_members for select
  to authenticated
  using (business_id in (select public.get_user_business_ids()));

create policy "Owners and managers can add members"
  on public.business_members for insert
  to authenticated
  with check (public.get_business_role(business_id) in ('owner', 'manager'));

create policy "Owners can update member roles"
  on public.business_members for update
  to authenticated
  using (public.get_business_role(business_id) = 'owner')
  with check (public.get_business_role(business_id) = 'owner');

create policy "Owners can remove members or members can remove themselves"
  on public.business_members for delete
  to authenticated
  using (public.get_business_role(business_id) = 'owner' or user_id = auth.uid());

-- 5. Atomic Onboarding RPC Function
create or replace function public.create_business_with_owner(
  p_name text,
  p_industry text,
  p_currency text default 'ARS'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_business record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized: user must be authenticated';
  end if;

  if trim(coalesce(p_name, '')) = '' then
    raise exception 'Business name cannot be empty';
  end if;

  if p_currency not in ('ARS', 'USD') then
    raise exception 'Invalid currency. Must be ARS or USD';
  end if;

  -- Create business
  insert into public.businesses (name, industry, currency)
  values (trim(p_name), trim(p_industry), p_currency)
  returning id, name, industry, currency, created_at into v_business;

  -- Insert owner membership
  insert into public.business_members (business_id, user_id, role)
  values (v_business.id, v_user_id, 'owner');

  return jsonb_build_object(
    'id', v_business.id,
    'name', v_business.name,
    'industry', v_business.industry,
    'currency', v_business.currency,
    'role', 'owner'
  );
end;
$$;
