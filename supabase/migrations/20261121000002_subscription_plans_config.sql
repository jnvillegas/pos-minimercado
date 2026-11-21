-- Migration: 20261121000002_subscription_plans_config.sql
-- Description: Platform subscription plans catalog and custom agreement support per business

-- 1. Create platform_subscription_plans table
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

-- Grants & RLS
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

-- 2. Seed / Upsert the 3 defined plans
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

-- 3. Add subscription_notes to businesses table if not exists
alter table public.businesses
  add column if not exists subscription_notes text default '';

-- 4. Policies on businesses for platform admins
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

-- 5. Normalize any legacy plan names
update public.businesses set subscription_plan = 'full' where subscription_plan = 'pro';
update public.businesses set subscription_plan = 'basic' where subscription_plan = 'free';
update public.businesses set subscription_plan = 'custom' where subscription_plan = 'enterprise';

-- 6. Reload postgrest
notify pgrst, 'reload schema';
