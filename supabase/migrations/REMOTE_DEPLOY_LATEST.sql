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
