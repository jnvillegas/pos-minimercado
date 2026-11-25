-- ========================================================================
-- POS SAAS: MIGRACIÓN DEFINITIVA PARA SUPABASE CLOUD (SQL EDITOR)
-- Copiá todo este contenido y pegalo en Supabase Cloud -> SQL Editor -> Run
-- ========================================================================

-- 1. Tabla de perfiles de usuario
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  dni_cuil text not null default '',
  alias text not null default '',
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant all on public.user_profiles to postgres, authenticated, service_role;
alter table public.user_profiles enable row level security;

drop policy if exists "Users can view and manage their own profile" on public.user_profiles;
create policy "Users can view and manage their own profile"
  on public.user_profiles for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. Índice parcial para permitir reutilizar códigos de barras de productos borrados
drop index if exists idx_products_barcode_unique;
drop index if exists idx_products_barcode_active_unique;
create unique index if not exists idx_products_barcode_active_unique
  on public.products (business_id, barcode)
  where is_active = true and barcode is not null and barcode <> '';

-- 3. Tabla del Catálogo de Planes de Suscripción de la Plataforma
create table if not exists public.platform_subscription_plans (
  id text primary key check (id in ('basic', 'full', 'custom')),
  name text not null,
  subtitle text not null,
  price numeric(12, 2) not null default 0,
  period_label text not null default '/ mes por sucursal',
  badge text not null default 'Estándar',
  highlight boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant all on public.platform_subscription_plans to postgres, authenticated, service_role;
grant select on public.platform_subscription_plans to anon;

alter table public.platform_subscription_plans enable row level security;

drop policy if exists "Anyone authenticated can view plans" on public.platform_subscription_plans;
create policy "Anyone authenticated can view plans"
  on public.platform_subscription_plans for select
  to authenticated
  using (true);

drop policy if exists "Platform admins can manage plans" on public.platform_subscription_plans;
create policy "Platform admins can manage plans"
  on public.platform_subscription_plans for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- 4. Carga inicial / Upsert de los 3 planes
insert into public.platform_subscription_plans (id, name, subtitle, price, period_label, badge, highlight, features)
values
  (
    'basic',
    'Plan Básico',
    'Para pequeños comercios familiares o de barrio',
    12000,
    '/ mes por sucursal',
    'Entrada',
    false,
    '[
      "Hasta 500 productos en catálogo",
      "1 Caja registradora activa",
      "Punto de venta táctil rápido",
      "Control de stock básico",
      "Ticket digital por WhatsApp"
    ]'::jsonb
  ),
  (
    'full',
    'Plan Full',
    'El estándar completo para minimercados y autoservicios activos',
    25000,
    '/ mes por sucursal',
    'Más Popular',
    true,
    '[
      "Catálogo y productos ilimitados",
      "Cajeros y encargados ilimitados",
      "Cierre de turnos ciego con arqueo de caja",
      "Reportes financieros y márgenes en tiempo real",
      "Importación / exportación masiva en Excel",
      "Soporte prioritario por WhatsApp"
    ]'::jsonb
  ),
  (
    'custom',
    'Plan Customizado',
    'Tarifa adaptada según volumen, sucursales y desarrollos especiales',
    0,
    'Precio a convenir',
    'A Medida',
    false,
    '[
      "Todo lo incluido en el Plan Full",
      "Desarrollos y funciones exclusivas a medida",
      "Múltiples sucursales y franquicias consolidadas",
      "Integración con balanzas y periféricos dedicados",
      "Auditoría de aperturas de caja personalizada",
      "Gerente de cuenta y soporte directo dedicado"
    ]'::jsonb
  )
on conflict (id) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  period_label = excluded.period_label,
  badge = excluded.badge,
  highlight = excluded.highlight,
  features = excluded.features;

-- 5. Columna de notas de suscripción en comercios
alter table public.businesses
  add column if not exists subscription_notes text default '';

-- 6. Políticas de acceso a comercios para Superadmin
drop policy if exists "Platform admins can view all businesses" on public.businesses;
create policy "Platform admins can view all businesses"
  on public.businesses for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists "Platform admins can update businesses" on public.businesses;
create policy "Platform admins can update businesses"
  on public.businesses for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- 7. Normalización de nombres viejos de planes
update public.businesses set subscription_plan = 'full' where subscription_plan = 'pro';
update public.businesses set subscription_plan = 'basic' where subscription_plan = 'free';
update public.businesses set subscription_plan = 'custom' where subscription_plan = 'enterprise';

-- 8. Actualización de función is_platform_admin con autorregistro y bypass
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

-- 9. RPC para actualizar parámetros de planes (Security Definer)
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

-- 10. RPC para asignar suscripción a un comercio (Security Definer)
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

-- 11. Recargar caché de PostgREST
notify pgrst, 'reload schema';
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
as $
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
$;

grant execute on function public.create_sale(uuid, jsonb, text, numeric, text, numeric, uuid) to authenticated, service_role;

-- 5. Delivery status for food & takeaway verticals ('pending' / 'delivered')
alter table public.sales
  add column if not exists delivery_status text not null default 'delivered'
  check (delivery_status in ('pending', 'delivered'));

create index if not exists idx_sales_delivery_status
  on public.sales (business_id, delivery_status, created_at desc);

-- 6. Reload PostgREST schema cache
notify pgrst, 'reload schema';
