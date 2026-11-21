-- Migration: 20261121000004_suppliers_module.sql
-- Description: Create suppliers table, add supplier_id to products, and configure RLS policies

-- 1. Create suppliers table
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  contact_name text not null default '',
  phone text not null default '',
  email text not null default '',
  cuit text not null default '',
  delivery_days text not null default '',
  payment_info text not null default '',
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_suppliers_business_active on public.suppliers(business_id, is_active);
create index if not exists idx_suppliers_business_name on public.suppliers(business_id, name);

-- Grants & RLS
grant all on public.suppliers to postgres, authenticated, service_role;
alter table public.suppliers enable row level security;

drop policy if exists "Staff can view suppliers for their business" on public.suppliers;
create policy "Staff can view suppliers for their business"
  on public.suppliers for select
  to authenticated
  using (
    business_id in (select public.get_user_business_ids())
    or public.is_platform_admin()
  );

drop policy if exists "Staff can manage suppliers for their business" on public.suppliers;
create policy "Staff can manage suppliers for their business"
  on public.suppliers for all
  to authenticated
  using (
    business_id in (select public.get_user_business_ids())
    or public.is_platform_admin()
  )
  with check (
    business_id in (select public.get_user_business_ids())
    or public.is_platform_admin()
  );

-- 2. Add supplier_id to products
alter table public.products
  add column if not exists supplier_id uuid references public.suppliers(id) on delete set null;

create index if not exists idx_products_business_supplier on public.products(business_id, supplier_id);

-- 3. Reload PostgREST schema cache
notify pgrst, 'reload schema';
