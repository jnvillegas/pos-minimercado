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
-- Migration: 20261118000001_pos_and_catalog.sql
-- Description: Categories, Products, Cash Shifts, Sales, and atomic create_sale RPC

-- 1. Create categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_category_per_business unique (business_id, name)
);

create index if not exists idx_categories_business_id on public.categories(business_id);

-- 2. Create products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  barcode text,
  name text not null,
  cost_price numeric(12, 2) not null default 0.00 check (cost_price >= 0),
  sale_price numeric(12, 2) not null default 0.00 check (sale_price >= 0),
  stock numeric(12, 2) not null default 0.00,
  min_stock numeric(12, 2) not null default 5.00 check (min_stock >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_product_barcode_per_business
  on public.products(business_id, barcode)
  where barcode is not null and barcode <> '';

create index if not exists idx_products_business_active on public.products(business_id, is_active);
create index if not exists idx_products_business_category on public.products(business_id, category_id);
create index if not exists idx_products_business_name on public.products(business_id, name);

-- 3. Create cash_shifts table
create table if not exists public.cash_shifts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  opened_by uuid not null references auth.users(id),
  closed_by uuid references auth.users(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  initial_cash numeric(12, 2) not null check (initial_cash >= 0),
  expected_cash numeric(12, 2),
  actual_cash numeric(12, 2) check (actual_cash is null or actual_cash >= 0),
  difference numeric(12, 2),
  notes text,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_one_open_shift_per_business
  on public.cash_shifts(business_id)
  where status = 'open';

create index if not exists idx_cash_shifts_business_created
  on public.cash_shifts(business_id, created_at desc);

-- 4. Create sales and sale_items tables
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  shift_id uuid references public.cash_shifts(id) on delete restrict,
  user_id uuid not null references auth.users(id),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount_amount numeric(12, 2) not null default 0.00 check (discount_amount >= 0),
  discount_type text check (discount_type in ('percentage', 'fixed') or discount_type is null),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  payment_method text not null check (payment_method in ('cash', 'transfer', 'debit_card', 'credit_card')),
  amount_tendered numeric(12, 2),
  change_due numeric(12, 2) not null default 0.00 check (change_due >= 0),
  status text not null default 'completed' check (status in ('completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sales_business_created on public.sales(business_id, created_at desc);
create index if not exists idx_sales_shift_id on public.sales(shift_id);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  barcode text,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_cost numeric(12, 2) not null default 0.00 check (unit_cost >= 0),
  unit_price numeric(12, 2) not null default 0.00 check (unit_price >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_sale_items_sale_id on public.sale_items(sale_id);

-- 5. Enable Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.cash_shifts enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

-- Policies for categories
create policy "Users can view categories for their business"
  on public.categories for select to authenticated
  using (business_id in (select public.get_user_business_ids()));

create policy "Staff can manage categories for their business"
  on public.categories for all to authenticated
  using (business_id in (select public.get_user_business_ids()))
  with check (business_id in (select public.get_user_business_ids()));

-- Policies for products
create policy "Users can view products for their business"
  on public.products for select to authenticated
  using (business_id in (select public.get_user_business_ids()));

create policy "Staff can manage products for their business"
  on public.products for all to authenticated
  using (business_id in (select public.get_user_business_ids()))
  with check (business_id in (select public.get_user_business_ids()));

-- Policies for cash_shifts
create policy "Users can view cash shifts for their business"
  on public.cash_shifts for select to authenticated
  using (business_id in (select public.get_user_business_ids()));

create policy "Staff can manage cash shifts for their business"
  on public.cash_shifts for all to authenticated
  using (business_id in (select public.get_user_business_ids()))
  with check (business_id in (select public.get_user_business_ids()));

-- Policies for sales
create policy "Users can view sales for their business"
  on public.sales for select to authenticated
  using (business_id in (select public.get_user_business_ids()));

create policy "Staff can insert sales for their business"
  on public.sales for insert to authenticated
  with check (business_id in (select public.get_user_business_ids()));

-- Policies for sale_items
create policy "Users can view sale items for their business"
  on public.sale_items for select to authenticated
  using (exists (
    select 1 from public.sales s
    where s.id = sale_items.sale_id
    and s.business_id in (select public.get_user_business_ids())
  ));

create policy "Staff can insert sale items"
  on public.sale_items for insert to authenticated
  with check (exists (
    select 1 from public.sales s
    where s.id = sale_items.sale_id
    and s.business_id in (select public.get_user_business_ids())
  ));

-- 6. Atomic RPC function: create_sale
create or replace function public.create_sale(
  p_business_id uuid,
  p_items jsonb,
  p_payment_method text,
  p_discount_amount numeric default 0.00,
  p_discount_type text default null,
  p_amount_tendered numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_shift_id uuid;
  v_subtotal numeric := 0.00;
  v_total numeric := 0.00;
  v_change_due numeric := 0.00;
  v_sale_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty numeric;
  v_price numeric;
  v_cost numeric;
  v_p_name text;
  v_barcode text;
  v_current_stock numeric;
  v_item_subtotal numeric;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if not public.is_business_member(p_business_id) then
    raise exception 'User is not a member of this business';
  end if;

  -- 1. Check or auto-provision active cash shift if not open
  select id into v_shift_id
  from public.cash_shifts
  where business_id = p_business_id and status = 'open'
  limit 1;

  -- If no open shift exists, auto-open one with $0.00 initial float so cashier is not blocked
  if v_shift_id is null then
    insert into public.cash_shifts (business_id, opened_by, initial_cash, status)
    values (p_business_id, v_user_id, 0.00, 'open')
    returning id into v_shift_id;
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Sale must contain at least one item';
  end if;

  if p_payment_method not in ('cash', 'transfer', 'debit_card', 'credit_card') then
    raise exception 'Invalid payment method: %', p_payment_method;
  end if;

  -- 2. Calculate subtotal
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'quantity')::numeric, 0);
    v_price := coalesce((v_item->>'unit_price')::numeric, 0);
    if v_qty <= 0 then
      raise exception 'Item quantity must be greater than zero';
    end if;
    v_subtotal := v_subtotal + (v_qty * v_price);
  end loop;

  v_total := greatest(0.00, v_subtotal - coalesce(p_discount_amount, 0.00));

  -- 3. Calculate change due for cash
  if p_payment_method = 'cash' then
    if p_amount_tendered is not null and p_amount_tendered < v_total then
      raise exception 'Amount tendered is less than total amount';
    end if;
    v_change_due := greatest(0.00, coalesce(p_amount_tendered, v_total) - v_total);
  end if;

  -- 4. Insert sales record
  insert into public.sales (
    business_id, shift_id, user_id, subtotal,
    discount_amount, discount_type, total_amount,
    payment_method, amount_tendered, change_due, status
  ) values (
    p_business_id, v_shift_id, v_user_id, v_subtotal,
    coalesce(p_discount_amount, 0.00), p_discount_type, v_total,
    p_payment_method, p_amount_tendered, v_change_due, 'completed'
  )
  returning id into v_sale_id;

  -- 5. Insert sale items and decrement stock
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    v_qty := (v_item->>'quantity')::numeric;
    v_price := (v_item->>'unit_price')::numeric;
    v_cost := coalesce((v_item->>'unit_cost')::numeric, 0.00);
    v_p_name := trim(coalesce(v_item->>'product_name', 'Artículo'));
    v_barcode := nullif(trim(coalesce(v_item->>'barcode', '')), '');
    v_item_subtotal := v_qty * v_price;

    -- Decrement stock if product exists in catalog
    if v_product_id is not null then
      update public.products
      set stock = stock - v_qty,
          updated_at = now()
      where id = v_product_id and business_id = p_business_id;
    end if;

    insert into public.sale_items (
      sale_id, product_id, product_name, barcode,
      quantity, unit_cost, unit_price, subtotal
    ) values (
      v_sale_id, v_product_id, v_p_name, v_barcode,
      v_qty, v_cost, v_price, v_item_subtotal
    );
  end loop;

  return jsonb_build_object(
    'sale_id', v_sale_id,
    'total_amount', v_total,
    'change_due', v_change_due,
    'status', 'completed'
  );
end;
$$;
-- Migration: 20261118000002_inventory_operations.sql
-- Description: Stock adjustment and batch import RPCs for inventory management

-- 1. Partial index for low stock items
create index if not exists idx_products_business_low_stock
  on public.products(business_id)
  where stock <= min_stock;

-- 2. Atomic Stock Adjustment RPC
create or replace function public.adjust_product_stock(
  p_product_id uuid,
  p_delta numeric,
  p_reason text default 'manual_adjustment'
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
  v_new_stock numeric;
begin
  select * into v_product
  from public.products
  where id = p_product_id;

  if not found then
    raise exception 'Product not found';
  end if;

  if not public.is_business_member(v_product.business_id) then
    raise exception 'Unauthorized to modify products for this business';
  end if;

  v_new_stock := v_product.stock + p_delta;
  if v_new_stock < 0 then
    raise exception 'Stock cannot be negative (current: %, adjustment: %)', v_product.stock, p_delta;
  end if;

  update public.products
  set stock = v_new_stock,
      updated_at = now()
  where id = p_product_id
  returning * into v_product;

  return v_product;
end;
$$;

-- 3. Batch Import Products RPC
create or replace function public.batch_import_products(
  p_business_id uuid,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
  v_cat_name text;
  v_cat_id uuid;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_cat_created integer := 0;
  v_barcode text;
  v_name text;
  v_cost numeric;
  v_sale numeric;
  v_stock numeric;
  v_min_stock numeric;
  v_existing_id uuid;
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Unauthorized to import products';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_name := trim(coalesce(v_row->>'name', ''));
    if v_name = '' then
      continue;
    end if;

    v_cat_name := trim(coalesce(v_row->>'category', ''));
    v_cat_id := null;

    -- Resolve or insert category
    if v_cat_name <> '' then
      select id into v_cat_id
      from public.categories
      where business_id = p_business_id and lower(name) = lower(v_cat_name)
      limit 1;

      if v_cat_id is null then
        insert into public.categories (business_id, name)
        values (p_business_id, v_cat_name)
        on conflict (business_id, name) do update set name = excluded.name
        returning id into v_cat_id;
        v_cat_created := v_cat_created + 1;
      end if;
    end if;

    v_barcode := nullif(trim(coalesce(v_row->>'barcode', '')), '');
    v_cost := greatest(0, coalesce((v_row->>'cost_price')::numeric, 0.00));
    v_sale := greatest(0, coalesce((v_row->>'sale_price')::numeric, 0.00));
    v_stock := greatest(0, coalesce((v_row->>'stock')::numeric, 0.00));
    v_min_stock := greatest(0, coalesce((v_row->>'min_stock')::numeric, 5.00));

    -- Check if product exists by barcode or name
    v_existing_id := null;
    if v_barcode is not null then
      select id into v_existing_id
      from public.products
      where business_id = p_business_id and barcode = v_barcode
      limit 1;
    end if;

    if v_existing_id is null then
      select id into v_existing_id
      from public.products
      where business_id = p_business_id and lower(name) = lower(v_name)
      limit 1;
    end if;

    if v_existing_id is not null then
      update public.products
      set category_id = coalesce(v_cat_id, category_id),
          barcode = coalesce(v_barcode, barcode),
          name = v_name,
          cost_price = v_cost,
          sale_price = v_sale,
          stock = v_stock,
          min_stock = v_min_stock,
          updated_at = now()
      where id = v_existing_id;
      v_updated := v_updated + 1;
    else
      insert into public.products (
        business_id, category_id, barcode, name,
        cost_price, sale_price, stock, min_stock
      ) values (
        p_business_id, v_cat_id, v_barcode, v_name,
        v_cost, v_sale, v_stock, v_min_stock
      );
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'inserted', v_inserted,
    'updated', v_updated,
    'categories_created', v_cat_created
  );
end;
$$;
-- Migration: 20261118000003_storage_product_images.sql
-- Description: Create product-images storage bucket with public read and authenticated write

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Policies for storage.objects
create policy "Allow authenticated uploads to product-images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');

create policy "Allow authenticated updates to product-images"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images');

create policy "Allow public read of product-images"
on storage.objects for select
to public
using (bucket_id = 'product-images');
-- Migration: 20261118000004_manage_cash_shifts.sql
-- Description: RPCs for opening, closing, and computing metrics for cash shifts

-- 1. Atomic RPC to Open Cash Shift
create or replace function public.open_cash_shift(
  p_business_id uuid,
  p_initial_cash numeric
)
returns public.cash_shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_shift public.cash_shifts;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if not public.is_business_member(p_business_id) then
    raise exception 'User is not a member of this business';
  end if;

  if p_initial_cash < 0 then
    raise exception 'Initial cash float cannot be negative';
  end if;

  -- Verify no open shift exists
  if exists (
    select 1 from public.cash_shifts
    where business_id = p_business_id and status = 'open'
  ) then
    raise exception 'There is already an open cash shift for this business';
  end if;

  insert into public.cash_shifts (
    business_id, opened_by, initial_cash, status
  ) values (
    p_business_id, v_user_id, p_initial_cash, 'open'
  )
  returning * into v_shift;

  return v_shift;
end;
$$;

-- 2. Atomic RPC to Close Cash Shift with Reconciliation
create or replace function public.close_cash_shift(
  p_shift_id uuid,
  p_actual_cash numeric,
  p_notes text default null
)
returns public.cash_shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_shift public.cash_shifts;
  v_cash_sales numeric(12, 2) := 0.00;
  v_expected_cash numeric(12, 2) := 0.00;
  v_difference numeric(12, 2) := 0.00;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  -- Lock shift row for update
  select * into v_shift
  from public.cash_shifts
  where id = p_shift_id
  for update;

  if not found then
    raise exception 'Cash shift not found';
  end if;

  if v_shift.status <> 'open' then
    raise exception 'Cash shift is already closed';
  end if;

  if not public.is_business_member(v_shift.business_id) then
    raise exception 'Unauthorized to close this cash shift';
  end if;

  if p_actual_cash < 0 then
    raise exception 'Actual cash cannot be negative';
  end if;

  -- Calculate cash sales recorded during this shift
  select coalesce(sum(total_amount), 0.00)
  into v_cash_sales
  from public.sales
  where shift_id = p_shift_id and payment_method = 'cash';

  -- Expected cash in drawer = initial float + cash sales
  v_expected_cash := v_shift.initial_cash + v_cash_sales;
  v_difference := p_actual_cash - v_expected_cash;

  -- Enforce mandatory note when difference is non-zero
  if v_difference <> 0.00 and trim(coalesce(p_notes, '')) = '' then
    raise exception 'A justification note is required when there is a cash difference (Difference: %)', v_difference;
  end if;

  update public.cash_shifts
  set status = 'closed',
      closed_by = v_user_id,
      closed_at = now(),
      actual_cash = p_actual_cash,
      expected_cash = v_expected_cash,
      difference = v_difference,
      notes = nullif(trim(p_notes), ''),
      updated_at = now()
  where id = p_shift_id
  returning * into v_shift;

  return v_shift;
end;
$$;

-- 3. Shift Metrics Helper RPC
create or replace function public.get_active_shift_metrics(p_shift_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shift public.cash_shifts;
  v_cash_sales numeric(12, 2) := 0.00;
  v_digital_sales numeric(12, 2) := 0.00;
  v_total_sales numeric(12, 2) := 0.00;
  v_sales_count integer := 0;
begin
  select * into v_shift
  from public.cash_shifts
  where id = p_shift_id;

  if not found then
    raise exception 'Cash shift not found';
  end if;

  if not public.is_business_member(v_shift.business_id) then
    raise exception 'Unauthorized';
  end if;

  -- Aggregates
  select
    coalesce(sum(case when payment_method = 'cash' then total_amount else 0.00 end), 0.00),
    coalesce(sum(case when payment_method <> 'cash' then total_amount else 0.00 end), 0.00),
    coalesce(sum(total_amount), 0.00),
    count(*)
  into v_cash_sales, v_digital_sales, v_total_sales, v_sales_count
  from public.sales
  where shift_id = p_shift_id;

  return jsonb_build_object(
    'shift_id', v_shift.id,
    'status', v_shift.status,
    'initial_cash', v_shift.initial_cash,
    'opened_at', v_shift.opened_at,
    'cash_sales', v_cash_sales,
    'digital_sales', v_digital_sales,
    'total_sales', v_total_sales,
    'sales_count', v_sales_count,
    'expected_cash', (v_shift.initial_cash + v_cash_sales)
  );
end;
$$;
-- Migration: 20261118000005_track_cash_movements.sql
-- Description: cash_movements table, shift balance integration, and unified ledger RPC

-- 1. Create cash_movements table
create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  shift_id uuid references public.cash_shifts(id) on delete set null,
  user_id uuid not null references auth.users(id),
  type text not null check (type in ('income', 'expense')),
  category text not null default 'general',
  concept text not null,
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash', 'transfer', 'debit_card', 'credit_card')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_cash_movements_business_created
  on public.cash_movements(business_id, created_at desc);
create index if not exists idx_cash_movements_shift_id
  on public.cash_movements(shift_id);
create index if not exists idx_cash_movements_type
  on public.cash_movements(business_id, type);

-- 2. Row Level Security Policies
alter table public.cash_movements enable row level security;

create policy "Users can view cash movements for their business"
  on public.cash_movements for select
  to authenticated
  using (business_id in (select public.get_user_business_ids()));

create policy "Staff can insert cash movements for their business"
  on public.cash_movements for insert
  to authenticated
  with check (
    business_id in (select public.get_user_business_ids())
    and public.get_business_role(business_id) in ('owner', 'manager', 'cashier')
  );

create policy "Owners and managers can update or delete cash movements"
  on public.cash_movements for update
  to authenticated
  using (
    business_id in (select public.get_user_business_ids())
    and public.get_business_role(business_id) in ('owner', 'manager')
  );

-- 3. Live Shift Cash Balance Calculation Function
create or replace function public.get_shift_cash_balance(p_shift_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_shift public.cash_shifts;
  v_cash_sales numeric(12, 2) := 0.00;
  v_digital_sales numeric(12, 2) := 0.00;
  v_cash_incomes numeric(12, 2) := 0.00;
  v_cash_expenses numeric(12, 2) := 0.00;
  v_expected_cash numeric(12, 2) := 0.00;
begin
  select * into v_shift from public.cash_shifts where id = p_shift_id;
  if not found then
    return null;
  end if;

  -- Cash sales
  select coalesce(sum(total_amount), 0.00) into v_cash_sales
  from public.sales
  where shift_id = p_shift_id and payment_method = 'cash';

  -- Digital sales
  select coalesce(sum(total_amount), 0.00) into v_digital_sales
  from public.sales
  where shift_id = p_shift_id and payment_method <> 'cash';

  -- Cash movements
  select coalesce(sum(amount), 0.00) into v_cash_incomes
  from public.cash_movements
  where shift_id = p_shift_id and type = 'income' and payment_method = 'cash';

  select coalesce(sum(amount), 0.00) into v_cash_expenses
  from public.cash_movements
  where shift_id = p_shift_id and type = 'expense' and payment_method = 'cash';

  v_expected_cash := v_shift.initial_cash + v_cash_sales + v_cash_incomes - v_cash_expenses;

  return jsonb_build_object(
    'initial_cash', v_shift.initial_cash,
    'cash_sales', v_cash_sales,
    'digital_sales', v_digital_sales,
    'cash_incomes', v_cash_incomes,
    'cash_expenses', v_cash_expenses,
    'expected_cash', v_expected_cash
  );
end;
$$;

-- 4. Update get_active_shift_metrics to factor in cash movements
create or replace function public.get_active_shift_metrics(p_shift_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shift public.cash_shifts;
  v_cash_sales numeric(12, 2) := 0.00;
  v_digital_sales numeric(12, 2) := 0.00;
  v_total_sales numeric(12, 2) := 0.00;
  v_sales_count integer := 0;
  v_cash_incomes numeric(12, 2) := 0.00;
  v_cash_expenses numeric(12, 2) := 0.00;
  v_expected_cash numeric(12, 2) := 0.00;
begin
  select * into v_shift
  from public.cash_shifts
  where id = p_shift_id;

  if not found then
    raise exception 'Cash shift not found';
  end if;

  if not public.is_business_member(v_shift.business_id) then
    raise exception 'Unauthorized';
  end if;

  -- Sales aggregates
  select
    coalesce(sum(case when payment_method = 'cash' then total_amount else 0.00 end), 0.00),
    coalesce(sum(case when payment_method <> 'cash' then total_amount else 0.00 end), 0.00),
    coalesce(sum(total_amount), 0.00),
    count(*)
  into v_cash_sales, v_digital_sales, v_total_sales, v_sales_count
  from public.sales
  where shift_id = p_shift_id;

  -- Movements aggregates
  select coalesce(sum(amount), 0.00) into v_cash_incomes
  from public.cash_movements
  where shift_id = p_shift_id and type = 'income' and payment_method = 'cash';

  select coalesce(sum(amount), 0.00) into v_cash_expenses
  from public.cash_movements
  where shift_id = p_shift_id and type = 'expense' and payment_method = 'cash';

  v_expected_cash := v_shift.initial_cash + v_cash_sales + v_cash_incomes - v_cash_expenses;

  return jsonb_build_object(
    'shift_id', v_shift.id,
    'status', v_shift.status,
    'initial_cash', v_shift.initial_cash,
    'opened_at', v_shift.opened_at,
    'cash_sales', v_cash_sales,
    'digital_sales', v_digital_sales,
    'total_sales', v_total_sales,
    'sales_count', v_sales_count,
    'cash_incomes', v_cash_incomes,
    'cash_expenses', v_cash_expenses,
    'expected_cash', v_expected_cash
  );
end;
$$;

-- 5. Update close_cash_shift to factor in cash movements
create or replace function public.close_cash_shift(
  p_shift_id uuid,
  p_actual_cash numeric,
  p_notes text default null
)
returns public.cash_shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_shift public.cash_shifts;
  v_cash_sales numeric(12, 2) := 0.00;
  v_cash_incomes numeric(12, 2) := 0.00;
  v_cash_expenses numeric(12, 2) := 0.00;
  v_expected_cash numeric(12, 2) := 0.00;
  v_difference numeric(12, 2) := 0.00;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  -- Lock shift row for update
  select * into v_shift
  from public.cash_shifts
  where id = p_shift_id
  for update;

  if not found then
    raise exception 'Cash shift not found';
  end if;

  if v_shift.status <> 'open' then
    raise exception 'Cash shift is already closed';
  end if;

  if not public.is_business_member(v_shift.business_id) then
    raise exception 'Unauthorized to close this cash shift';
  end if;

  if p_actual_cash < 0 then
    raise exception 'Actual cash cannot be negative';
  end if;

  -- Cash sales recorded during this shift
  select coalesce(sum(total_amount), 0.00)
  into v_cash_sales
  from public.sales
  where shift_id = p_shift_id and payment_method = 'cash';

  -- Cash movements recorded during this shift
  select coalesce(sum(amount), 0.00) into v_cash_incomes
  from public.cash_movements
  where shift_id = p_shift_id and type = 'income' and payment_method = 'cash';

  select coalesce(sum(amount), 0.00) into v_cash_expenses
  from public.cash_movements
  where shift_id = p_shift_id and type = 'expense' and payment_method = 'cash';

  -- Expected cash in drawer = initial float + cash sales + cash incomes - cash expenses
  v_expected_cash := v_shift.initial_cash + v_cash_sales + v_cash_incomes - v_cash_expenses;
  v_difference := p_actual_cash - v_expected_cash;

  -- Enforce mandatory note when difference is non-zero
  if v_difference <> 0.00 and trim(coalesce(p_notes, '')) = '' then
    raise exception 'A justification note is required when there is a cash difference (Difference: %)', v_difference;
  end if;

  update public.cash_shifts
  set status = 'closed',
      closed_by = v_user_id,
      closed_at = now(),
      actual_cash = p_actual_cash,
      expected_cash = v_expected_cash,
      difference = v_difference,
      notes = nullif(trim(p_notes), ''),
      updated_at = now()
  where id = p_shift_id
  returning * into v_shift;

  return v_shift;
end;
$$;

-- 6. Unified Movements RPC
create or replace function public.get_unified_movements(
  p_business_id uuid,
  p_start_date timestamptz default null,
  p_end_date timestamptz default null,
  p_type text default null,
  p_payment_method text default null,
  p_search text default null,
  p_limit integer default 100,
  p_offset integer default 0
)
returns table (
  id uuid,
  source text,
  type text,
  category text,
  concept text,
  amount numeric,
  payment_method text,
  created_at timestamptz,
  user_id uuid
)
language sql
security definer
stable
set search_path = public
as $$
  with combined as (
    -- POS Sales as income
    select
      s.id,
      'sale'::text as source,
      'income'::text as type,
      'Venta POS'::text as category,
      concat('Venta #', substring(s.id::text, 1, 8)) as concept,
      s.total_amount as amount,
      s.payment_method,
      s.created_at,
      s.user_id
    from public.sales s
    where s.business_id = p_business_id
      and (p_start_date is null or s.created_at >= p_start_date)
      and (p_end_date is null or s.created_at <= p_end_date)
      and (p_payment_method is null or s.payment_method = p_payment_method)
      and (p_type is null or p_type = 'income')

    union all

    -- Manual cash movements (expenses & manual incomes)
    select
      m.id,
      'movement'::text as source,
      m.type,
      m.category,
      m.concept,
      m.amount,
      m.payment_method,
      m.created_at,
      m.user_id
    from public.cash_movements m
    where m.business_id = p_business_id
      and (p_start_date is null or m.created_at >= p_start_date)
      and (p_end_date is null or m.created_at <= p_end_date)
      and (p_payment_method is null or m.payment_method = p_payment_method)
      and (p_type is null or m.type = p_type)
      and (p_search is null or m.concept ilike concat('%', p_search, '%'))
  )
  select * from combined
  order by created_at desc
  limit p_limit offset p_offset;
$$;
-- Migration: 20261118000006_team_rbac_and_reports.sql
-- Description: business_invitations table, invitation acceptance RPC, and analytical financial report RPC

-- 1. Create business_invitations table
create table if not exists public.business_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  email text not null,
  role text not null check (role in ('manager', 'cashier')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  constraint uq_pending_invite unique (business_id, email, status)
);

create index if not exists idx_business_invitations_token on public.business_invitations(token);
create index if not exists idx_business_invitations_business on public.business_invitations(business_id);

-- 2. Row Level Security Policies
alter table public.business_invitations enable row level security;

create policy "Owners can view and manage invitations for their business"
  on public.business_invitations for all
  to authenticated
  using (
    business_id in (select public.get_user_business_ids())
    and public.get_business_role(business_id) = 'owner'
  )
  with check (
    business_id in (select public.get_user_business_ids())
    and public.get_business_role(business_id) = 'owner'
  );

-- 3. Invitation Acceptance RPC
create or replace function public.accept_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_invite public.business_invitations;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized: User must be signed in to accept an invitation';
  end if;

  select * into v_invite
  from public.business_invitations
  where token = p_token and status = 'pending' and expires_at > now();

  if not found then
    raise exception 'Invitation is invalid or has expired';
  end if;

  -- Insert or update membership
  insert into public.business_members (business_id, user_id, role)
  values (v_invite.business_id, v_user_id, v_invite.role)
  on conflict (business_id, user_id)
  do update set role = v_invite.role;

  -- Mark invitation as accepted
  update public.business_invitations
  set status = 'accepted'
  where id = v_invite.id;

  return jsonb_build_object(
    'business_id', v_invite.business_id,
    'role', v_invite.role,
    'status', 'accepted'
  );
end;
$$;

-- 4. Analytical Financial Report Function
create or replace function public.get_business_financial_report(
  p_business_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_role text;
  v_gross_revenue numeric(12, 2) := 0.00;
  v_cogs numeric(12, 2) := 0.00;
  v_gross_profit numeric(12, 2) := 0.00;
  v_margin_pct numeric(12, 2) := 0.00;
  v_sales_count integer := 0;
  v_aov numeric(12, 2) := 0.00;
  v_daily_trend jsonb;
  v_hourly_distribution jsonb;
  v_payment_methods jsonb;
  v_top_products jsonb;
begin
  v_role := public.get_business_role(p_business_id);
  if v_role <> 'owner' and v_role <> 'manager' then
    raise exception 'Unauthorized: Only business owners or managers can access financial reports';
  end if;

  -- 1. Headline KPIs
  select
    coalesce(sum(s.total_amount), 0.00),
    count(s.id)
  into v_gross_revenue, v_sales_count
  from public.sales s
  where s.business_id = p_business_id
    and s.status = 'completed'
    and s.created_at >= p_start_date
    and s.created_at <= p_end_date;

  select
    coalesce(sum(si.quantity * si.unit_cost), 0.00)
  into v_cogs
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
  where s.business_id = p_business_id
    and s.status = 'completed'
    and s.created_at >= p_start_date
    and s.created_at <= p_end_date;

  v_gross_profit := v_gross_revenue - v_cogs;
  if v_gross_revenue > 0 then
    v_margin_pct := round(((v_gross_profit / v_gross_revenue) * 100)::numeric, 2);
    if v_sales_count > 0 then
      v_aov := round((v_gross_revenue / v_sales_count)::numeric, 2);
    end if;
  end if;

  -- 2. Daily Sales Trend
  select jsonb_agg(d order by d.sale_date) into v_daily_trend
  from (
    select
      to_char(s.created_at, 'YYYY-MM-DD') as sale_date,
      coalesce(sum(s.total_amount), 0.00) as revenue,
      count(s.id) as count
    from public.sales s
    where s.business_id = p_business_id
      and s.status = 'completed'
      and s.created_at >= p_start_date
      and s.created_at <= p_end_date
    group by to_char(s.created_at, 'YYYY-MM-DD')
  ) d;

  -- 3. Peak Hours Distribution (8:00 - 23:00)
  select jsonb_agg(h order by h.hour_of_day) into v_hourly_distribution
  from (
    select
      extract(hour from s.created_at)::integer as hour_of_day,
      count(s.id) as sales_count,
      coalesce(sum(s.total_amount), 0.00) as revenue
    from public.sales s
    where s.business_id = p_business_id
      and s.status = 'completed'
      and s.created_at >= p_start_date
      and s.created_at <= p_end_date
    group by extract(hour from s.created_at)
  ) h;

  -- 4. Payment Method Breakdown
  select jsonb_agg(p) into v_payment_methods
  from (
    select
      s.payment_method,
      count(s.id) as count,
      coalesce(sum(s.total_amount), 0.00) as total
    from public.sales s
    where s.business_id = p_business_id
      and s.status = 'completed'
      and s.created_at >= p_start_date
      and s.created_at <= p_end_date
    group by s.payment_method
  ) p;

  -- 5. Top 10 Best-Selling Products
  select jsonb_agg(t) into v_top_products
  from (
    select
      si.product_name,
      sum(si.quantity) as units_sold,
      coalesce(sum(si.subtotal), 0.00) as revenue,
      coalesce(sum(si.quantity * si.unit_cost), 0.00) as cost,
      coalesce(sum(si.subtotal - (si.quantity * si.unit_cost)), 0.00) as profit
    from public.sale_items si
    join public.sales s on s.id = si.sale_id
    where s.business_id = p_business_id
      and s.status = 'completed'
      and s.created_at >= p_start_date
      and s.created_at <= p_end_date
    group by si.product_name
    order by profit desc
    limit 10
  ) t;

  return jsonb_build_object(
    'gross_revenue', v_gross_revenue,
    'cogs', v_cogs,
    'gross_profit', v_gross_profit,
    'margin_pct', v_margin_pct,
    'sales_count', v_sales_count,
    'aov', v_aov,
    'daily_trend', coalesce(v_daily_trend, '[]'::jsonb),
    'hourly_distribution', coalesce(v_hourly_distribution, '[]'::jsonb),
    'payment_methods', coalesce(v_payment_methods, '[]'::jsonb),
    'top_products', coalesce(v_top_products, '[]'::jsonb)
  );
end;
$$;


-- ==============================================================================
-- Migration: 20261119000000_platform_superadmin.sql
-- Description: Platform Superadmin management, global metrics RPCs, and tenant directory
-- ==============================================================================

create table if not exists public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'superadmin' check (role in ('superadmin', 'support')),
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_admins_user_id on public.platform_admins(user_id);
alter table public.platform_admins enable row level security;

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

create policy "Platform admins can read admin list"
  on public.platform_admins for select
  to authenticated
  using (public.is_platform_admin());

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
    select business_id from public.cash_shifts where opened_at >= current_date or status = 'open'
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

insert into public.platform_admins (user_id, role)
select id, 'superadmin'
from auth.users
where email in ('dueño@minimercado.com', 'jnvillegas85@gmail.com')
on conflict (user_id) do nothing;
