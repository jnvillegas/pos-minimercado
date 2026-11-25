-- ========================================================================
-- DELETE BUSINESS ACCOUNT & DELETE OWN USER ACCOUNT RPCs
-- Defensive against optional tables not yet migrated on remote instances.
-- ========================================================================

create or replace function public.delete_business_account(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_is_superadmin boolean := false;
  v_is_owner boolean := false;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if to_regclass('public.platform_admins') is not null then
    select exists (
      select 1 from public.platform_admins
      where user_id = v_user_id and role = 'superadmin'
    ) into v_is_superadmin;
  end if;

  select exists (
    select 1 from public.business_members
    where business_id = p_business_id and user_id = v_user_id and role = 'owner'
  ) into v_is_owner;

  if not v_is_superadmin and not v_is_owner then
    raise exception 'Only the business owner or a platform superadmin can delete this business';
  end if;

  if to_regclass('public.customer_account_movements') is not null then
    delete from public.customer_account_movements where business_id = p_business_id;
  end if;

  if to_regclass('public.sale_items') is not null and to_regclass('public.sales') is not null then
    delete from public.sale_items where sale_id in (
      select id from public.sales where business_id = p_business_id
    );
  end if;

  if to_regclass('public.sales') is not null then
    delete from public.sales where business_id = p_business_id;
  end if;

  if to_regclass('public.cash_shifts') is not null then
    delete from public.cash_shifts where business_id = p_business_id;
  end if;

  delete from public.businesses where id = p_business_id;
end;
$$;

grant execute on function public.delete_business_account(uuid) to authenticated, service_role;

create or replace function public.delete_own_user_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_biz_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  for v_biz_id in
    select bm.business_id
    from public.business_members bm
    where bm.user_id = v_user_id
      and bm.role = 'owner'
      and not exists (
        select 1 from public.business_members other
        where other.business_id = bm.business_id
          and other.role = 'owner'
          and other.user_id <> v_user_id
      )
  loop
    if to_regclass('public.customer_account_movements') is not null then
      delete from public.customer_account_movements where business_id = v_biz_id;
    end if;

    if to_regclass('public.sale_items') is not null and to_regclass('public.sales') is not null then
      delete from public.sale_items where sale_id in (
        select id from public.sales where business_id = v_biz_id
      );
    end if;

    if to_regclass('public.sales') is not null then
      delete from public.sales where business_id = v_biz_id;
    end if;

    if to_regclass('public.cash_shifts') is not null then
      delete from public.cash_shifts where business_id = v_biz_id;
    end if;

    delete from public.businesses where id = v_biz_id;
  end loop;

  delete from public.business_members where user_id = v_user_id;

  if to_regclass('public.platform_admins') is not null then
    delete from public.platform_admins where user_id = v_user_id;
  end if;

  if to_regclass('public.user_profiles') is not null then
    delete from public.user_profiles where id = v_user_id;
  end if;

  delete from auth.users where id = v_user_id;
end;
$$;

grant execute on function public.delete_own_user_account() to authenticated, service_role;

notify pgrst, 'reload schema';
