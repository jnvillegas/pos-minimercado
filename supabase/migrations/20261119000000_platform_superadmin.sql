-- Migration: 20261119000000_platform_superadmin.sql
-- Description: Platform Superadmin management, global metrics RPCs, and tenant directory

-- 1. Create platform_admins table
create table if not exists public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'superadmin' check (role in ('superadmin', 'support')),
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_admins_user_id on public.platform_admins(user_id);

-- Enable RLS
alter table public.platform_admins enable row level security;

-- Helper function to check if current user is platform admin
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins
    where user_id = auth.uid()
  );
$$;

-- RLS policies on platform_admins
create policy "Platform admins can read admin list"
  on public.platform_admins for select
  to authenticated
  using (public.is_platform_admin());

-- 2. Platform Metrics RPC
create or replace function public.get_platform_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_businesses int;
  v_active_today int;
  v_total_gmv numeric;
  v_total_sales_count int;
  v_total_products int;
begin
  -- Require platform admin with auto-bootstrap if table empty
  if not public.is_platform_admin() then
    if not exists (select 1 from public.platform_admins) then
      insert into public.platform_admins (user_id, role)
      values (auth.uid(), 'superadmin')
      on conflict (user_id) do nothing;
    else
      raise exception 'Access denied: caller is not a platform admin';
    end if;
  end if;

  select count(*) into v_total_businesses from public.businesses;

  select count(distinct business_id) into v_active_today
  from (
    select business_id from public.sales where created_at >= current_date
    union
    select business_id from public.cash_shifts where started_at >= current_date or status = 'open'
  ) active_t;

  select coalesce(sum(total_amount), 0), count(*)
  into v_total_gmv, v_total_sales_count
  from public.sales;

  select count(*) into v_total_products from public.products where is_active = true;

  return jsonb_build_object(
    'total_businesses', v_total_businesses,
    'active_today', v_active_today,
    'total_gmv', v_total_gmv,
    'total_sales_count', v_total_sales_count,
    'total_products', v_total_products
  );
end;
$$;

-- 3. List Platform Businesses RPC
create or replace function public.list_platform_businesses()
returns table (
  id uuid,
  name text,
  industry text,
  currency text,
  created_at timestamptz,
  owner_email text,
  total_sales numeric,
  sales_count bigint,
  last_sale_at timestamptz,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    if not exists (select 1 from public.platform_admins) then
      insert into public.platform_admins (user_id, role)
      values (auth.uid(), 'superadmin')
      on conflict (user_id) do nothing;
    else
      raise exception 'Access denied: caller is not a platform admin';
    end if;
  end if;

  return query
  select
    b.id,
    b.name,
    b.industry,
    b.currency,
    b.created_at,
    coalesce(u.email::text, 'Sin email') as owner_email,
    coalesce(s_agg.total_sales, 0) as total_sales,
    coalesce(s_agg.sales_count, 0) as sales_count,
    s_agg.last_sale_at,
    coalesce(s_agg.last_sale_at >= (now() - interval '7 days'), false) as is_active
  from public.businesses b
  left join lateral (
    select bm.user_id
    from public.business_members bm
    where bm.business_id = b.id and bm.role = 'owner'
    order by bm.created_at asc
    limit 1
  ) owner_m on true
  left join auth.users u on u.id = owner_m.user_id
  left join lateral (
    select
      sum(s.total_amount) as total_sales,
      count(s.id) as sales_count,
      max(s.created_at) as last_sale_at
    from public.sales s
    where s.business_id = b.id
  ) s_agg on true
  order by b.created_at desc;
end;
$$;

-- Auto seed admin if present
insert into public.platform_admins (user_id, role)
select id, 'superadmin'
from auth.users
where email in ('dueño@minimercado.com', 'jnvillegas85@gmail.com')
on conflict (user_id) do nothing;
