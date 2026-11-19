# Tasks: Setup Auth and Business Tenancy

## 1. Database Schema, RLS, and RPC Migrations

- [x] 1.1 Create migration file `supabase/migrations/20261118000000_setup_auth_and_business.sql` defining `businesses` and `business_members` tables.
- [x] 1.2 Implement `SECURITY DEFINER` RLS helper functions (`get_user_business_ids`, `is_business_member`, `get_business_role`) with explicit `search_path = public`.
- [x] 1.3 Configure strict Row Level Security policies on `businesses` and `business_members` preventing cross-tenant reads or writes.
- [x] 1.4 Implement atomic `create_business_with_owner` PL/pgSQL RPC function to provision business and owner membership in a single transaction.

## 2. Supabase SSR Infrastructure and Configuration

- [x] 2.1 Implement Supabase browser client in `src/lib/supabase/client.ts` using `@supabase/ssr`.
- [x] 2.2 Implement Supabase server client in `src/lib/supabase/server.ts` with cookie access.
- [x] 2.3 Add environment variable validation in `src/lib/env.ts` for Supabase URL and anonymous key.

## 3. Authentication Flow (/login and /register)

- [x] 3.1 Create Zod validation schemas for login and registration forms in `src/lib/validations/auth.ts`.
- [x] 3.2 Implement Server Actions in `src/app/(auth)/actions.ts` for sign up, sign in, and sign out using Supabase Auth.
- [x] 3.3 Build `/login` page with clean, responsive form, error handling, and redirection logic.
- [x] 3.4 Build `/register` page with clean, simple form and link back to login.

## 4. Business Onboarding Flow (/onboarding)

- [x] 4.1 Create Zod validation schema for onboarding form (business name, industry, currency in `ARS`, `USD`).
- [x] 4.2 Implement Server Action calling the `create_business_with_owner` database RPC.
- [x] 4.3 Build `/onboarding` page rendering form fields for Business Name, Industry (e.g., Minimercado, Almacén, Servicios), and Currency selector.

## 5. Next.js Middleware and Route Guards

- [x] 5.1 Implement `src/middleware.ts` to refresh Supabase Auth sessions on every request.
- [x] 5.2 Add route guards redirecting unauthenticated visitors attempting to access `/dashboard/*` or `/onboarding` to `/login`.
- [x] 5.3 Add tenancy checks redirecting authenticated users without business memberships to `/onboarding`, and users with active businesses away from auth/onboarding to `/dashboard`.

## 6. Treinta-Inspired Dashboard Shell (/dashboard)

- [x] 6.1 Create `src/app/(dashboard)/layout.tsx` providing a responsive desktop sidebar and mobile header/drawer layout.
- [x] 6.2 Implement business context banner/switcher showing the active business name, industry badge, and currency indicator.
- [x] 6.3 Implement navigation menu items: Inicio (`/dashboard`), Movimientos, Inventario, Caja, Reportes, Configuración.
- [x] 6.4 Implement logout button connected to the sign-out Server Action.
- [x] 6.5 Build `/dashboard/page.tsx` home overview welcome screen.

## 7. Verification and Build Integrity

- [x] 7.1 Verify TypeScript types for Supabase database schema and RPC returns.
- [x] 7.2 Run `npm run lint` and `npm run build` to confirm zero compilation or lint errors.
- [x] 7.3 Verify all scenario acceptance criteria defined in OpenSpec delta specs.
