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
