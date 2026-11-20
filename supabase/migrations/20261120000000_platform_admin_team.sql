-- Migration: 20261120000000_platform_admin_team.sql
-- Description: Platform admin invitations, member listing, and access management

-- 1. Create platform_admin_invitations table
create table if not exists public.platform_admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'support' check (role in ('superadmin', 'support')),
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

alter table public.platform_admin_invitations enable row level security;

create policy "Platform admins can manage invitations"
  on public.platform_admin_invitations
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- 2. Function to list all platform admins with their email
create or replace function public.list_platform_admins()
returns table (
  id uuid,
  user_id uuid,
  email text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Access denied: caller is not a platform admin';
  end if;

  return query
  select
    pa.id,
    pa.user_id,
    coalesce(u.email::text, 'Sin email') as email,
    pa.role,
    pa.created_at
  from public.platform_admins pa
  left join auth.users u on u.id = pa.user_id
  order by pa.created_at asc;
end;
$$;

-- 3. Function to add or invite a platform admin
create or replace function public.add_platform_admin(
  p_email text,
  p_role text default 'support'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_user_id uuid;
  v_role text := coalesce(p_role, 'support');
begin
  if not public.is_platform_admin() then
    raise exception 'Access denied: caller is not a platform admin';
  end if;

  -- Validate role
  if v_role not in ('superadmin', 'support') then
    v_role := 'support';
  end if;

  select id into v_target_user_id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_target_user_id is null then
    insert into public.platform_admin_invitations (email, role, invited_by)
    values (lower(trim(p_email)), v_role, auth.uid())
    on conflict (email) do update
      set role = excluded.role,
          expires_at = now() + interval '7 days';

    return jsonb_build_object(
      'status', 'invited',
      'message', 'Invitación generada para ' || p_email || '. El usuario tendrá acceso al registrarse.'
    );
  else
    insert into public.platform_admins (user_id, role)
    values (v_target_user_id, v_role)
    on conflict (user_id) do update
      set role = excluded.role;

    return jsonb_build_object(
      'status', 'added',
      'message', 'El usuario ' || p_email || ' fue asignado exitosamente como ' || v_role
    );
  end if;
end;
$$;

-- 4. Function to remove a platform admin
create or replace function public.remove_platform_admin(
  p_admin_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_user_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Access denied: caller is not a platform admin';
  end if;

  select user_id into v_target_user_id
  from public.platform_admins
  where id = p_admin_id;

  if v_target_user_id is null then
    raise exception 'Administrador no encontrado';
  end if;

  if v_target_user_id = auth.uid() then
    raise exception 'No puedes revocar tu propio acceso de superadmin';
  end if;

  delete from public.platform_admins where id = p_admin_id;

  return jsonb_build_object('success', true);
end;
$$;
