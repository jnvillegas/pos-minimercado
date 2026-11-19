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
