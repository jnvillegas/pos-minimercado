-- Migration: 20261120000001_support_mode_rls.sql
-- Description: Allow platform admins to view and inspect all tenant businesses in support mode

create or replace function public.get_user_business_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select business_id from public.business_members where user_id = auth.uid()
  union
  select id from public.businesses where public.is_platform_admin();
$$;

-- Ensure RLS on businesses table allows platform admins
drop policy if exists "Users can view businesses they are member of" on public.businesses;
create policy "Users can view businesses they are member of"
  on public.businesses for select
  to authenticated
  using (id in (select public.get_user_business_ids()));

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
