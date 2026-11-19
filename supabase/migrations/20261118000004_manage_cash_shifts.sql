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
