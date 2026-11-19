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
