-- Migration: 20261123000000_customers_and_credit.sql
-- Description: Customers directory, customer account movements (Fiado / Cuenta Corriente), and POS integration

-- 1. Create customers table
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text not null default '',
  email text not null default '',
  dni_cuil text not null default '',
  address text not null default '',
  current_debt numeric(12, 2) not null default 0.00,
  credit_limit numeric(12, 2) not null default 0.00,
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_business_active on public.customers(business_id, is_active);
create index if not exists idx_customers_business_name on public.customers(business_id, name);
create index if not exists idx_customers_business_debt on public.customers(business_id) where current_debt > 0;

-- Grants & RLS for customers
grant all on public.customers to postgres, authenticated, service_role;
alter table public.customers enable row level security;

drop policy if exists "Staff can view customers for their business" on public.customers;
create policy "Staff can view customers for their business"
  on public.customers for select
  to authenticated
  using (
    business_id in (select public.get_user_business_ids())
    or public.is_platform_admin()
  );

drop policy if exists "Staff can manage customers for their business" on public.customers;
create policy "Staff can manage customers for their business"
  on public.customers for all
  to authenticated
  using (
    business_id in (select public.get_user_business_ids())
    or public.is_platform_admin()
  )
  with check (
    business_id in (select public.get_user_business_ids())
    or public.is_platform_admin()
  );

-- 2. Create customer_account_movements table (Historial de Cuenta Corriente)
create table if not exists public.customer_account_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  shift_id uuid references public.cash_shifts(id) on delete set null,
  sale_id uuid references public.sales(id) on delete set null,
  type text not null check (type in ('charge', 'payment', 'adjustment')),
  amount numeric(12, 2) not null,
  balance_after numeric(12, 2) not null default 0.00,
  payment_method text check (payment_method is null or payment_method in ('cash', 'transfer', 'debit_card', 'other')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_cam_customer_created on public.customer_account_movements(customer_id, created_at desc);
create index if not exists idx_cam_business_created on public.customer_account_movements(business_id, created_at desc);

-- Grants & RLS for customer_account_movements
grant all on public.customer_account_movements to postgres, authenticated, service_role;
alter table public.customer_account_movements enable row level security;

drop policy if exists "Staff can view customer movements for their business" on public.customer_account_movements;
create policy "Staff can view customer movements for their business"
  on public.customer_account_movements for select
  to authenticated
  using (
    business_id in (select public.get_user_business_ids())
    or public.is_platform_admin()
  );

drop policy if exists "Staff can insert customer movements for their business" on public.customer_account_movements;
create policy "Staff can insert customer movements for their business"
  on public.customer_account_movements for insert
  to authenticated
  with check (
    business_id in (select public.get_user_business_ids())
    or public.is_platform_admin()
  );

-- 3. Modify sales table to link to customer and allow 'credit' (fiado) payment method
alter table public.sales
  add column if not exists customer_id uuid references public.customers(id) on delete set null;

create index if not exists idx_sales_customer_id on public.sales(customer_id);

-- Update sales payment_method check constraint to allow 'credit'
alter table public.sales drop constraint if exists sales_payment_method_check;
alter table public.sales add constraint sales_payment_method_check
  check (payment_method in ('cash', 'transfer', 'debit_card', 'credit_card', 'credit'));

-- 4. Overload and update create_sale RPC to support 'credit' payment method and link to customer
drop function if exists public.create_sale(uuid, jsonb, text, numeric, text, numeric);

create or replace function public.create_sale(
  p_business_id uuid,
  p_items jsonb,
  p_payment_method text,
  p_discount_amount numeric default 0.00,
  p_discount_type text default null,
  p_amount_tendered numeric default null,
  p_customer_id uuid default null
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
  v_item_subtotal numeric;
  v_new_balance numeric := 0.00;
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

  if v_shift_id is null then
    insert into public.cash_shifts (business_id, opened_by, initial_cash, status)
    values (p_business_id, v_user_id, 0.00, 'open')
    returning id into v_shift_id;
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Sale must contain at least one item';
  end if;

  if p_payment_method not in ('cash', 'transfer', 'debit_card', 'credit_card', 'credit') then
    raise exception 'Invalid payment method: %', p_payment_method;
  end if;

  if p_payment_method = 'credit' and p_customer_id is null then
    raise exception 'Debe seleccionar un cliente para registrar una venta a crédito / fiado';
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
    business_id, shift_id, user_id, customer_id, subtotal,
    discount_amount, discount_type, total_amount,
    payment_method, amount_tendered, change_due, status
  ) values (
    p_business_id, v_shift_id, v_user_id, p_customer_id, v_subtotal,
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

  -- 6. If credit / fiado, update customer balance and record account movement
  if p_payment_method = 'credit' and p_customer_id is not null then
    update public.customers
    set current_debt = current_debt + v_total,
        updated_at = now()
    where id = p_customer_id and business_id = p_business_id
    returning current_debt into v_new_balance;

    insert into public.customer_account_movements (
      business_id, customer_id, user_id, shift_id, sale_id,
      type, amount, balance_after, payment_method, notes
    ) values (
      p_business_id, p_customer_id, v_user_id, v_shift_id, v_sale_id,
      'charge', v_total, v_new_balance, null, 'Compra a cuenta corriente / Fiado'
    );
  end if;

  return jsonb_build_object(
    'sale_id', v_sale_id,
    'total_amount', v_total,
    'change_due', v_change_due,
    'status', 'completed',
    'customer_id', p_customer_id,
    'new_debt', v_new_balance
  );
end;
$$;

grant execute on function public.create_sale(uuid, jsonb, text, numeric, text, numeric, uuid) to authenticated, service_role;

-- 5. Reload PostgREST schema cache
notify pgrst, 'reload schema';
