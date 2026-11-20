# Technical Design: Platform Superadmin Dashboard

## Database Architecture
1. `platform_admins` table:
   - `id uuid primary key default gen_random_uuid()`
   - `user_id uuid not null unique references auth.users(id) on delete cascade`
   - `created_at timestamptz not null default now()`
2. Helper functions:
   - `public.is_platform_admin()` (security definer)
3. RPC functions:
   - `public.get_platform_metrics()` returns JSON with `total_businesses`, `active_today`, `total_gmv`, `total_sales`.
   - `public.list_platform_businesses()` returns table with business info, owner email, total sales, and last sale date.

## Application Architecture
- Route Group: `src/app/(admin)/admin`
- Guard: `src/lib/auth/platform-admin.ts` with `requirePlatformAdmin()`
- View: `src/app/(admin)/admin/platform-view.tsx`
