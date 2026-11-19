# Proposal: Setup Auth and Business Tenancy

## Why

Every multi-tenant retail and minimarket POS application requires a rock-solid foundation for tenant isolation, secure user authentication, and workspace onboarding. Without strong multi-tenant Row Level Security (RLS) and automated onboarding, data leaks between businesses are inevitable and user activation fails. This change introduces the foundational Supabase authentication flows, tenant management schemas with strict RLS, onboarding redirection logic, and the core responsive navigation shell inspired by Treinta.

## What Changes

- Add Supabase Auth email and password authentication flows (`/login`, `/register`).
- Add multi-tenant PostgreSQL schema in Supabase with `businesses` and `business_members` tables.
- Add strict Row Level Security (RLS) policies ensuring tenant data isolation across businesses.
- Add a secure PostgreSQL function / RPC (`create_business_with_owner`) to atomically provision a business and assign the creator as `owner`.
- Add an onboarding flow (`/onboarding`) with business name, category/industry, and default currency (ARS/USD).
- Add Next.js middleware and route guards to enforce authentication and redirect users lacking an active business to `/onboarding`.
- Add responsive Treinta-inspired dashboard layout (`/dashboard`) with desktop sidebar, mobile drawer, active business switcher, navigation links (Inicio, Movimientos, Inventario, Caja, Reportes, Configuración), and sign-out action.

## Capabilities

### New Capabilities
- `user-auth`: User authentication lifecycle using Supabase Auth (email/password signup, login, session refresh, and logout).
- `business-tenancy`: Multi-tenant business provisioning, member roles (`owner`, `manager`, `cashier`), atomic onboarding RPC, and Row Level Security isolation.
- `dashboard-shell`: Treinta-inspired responsive dashboard layout featuring a desktop sidebar, mobile navigation drawer, business indicator, and section routing.

### Modified Capabilities
<!-- None: Initial foundation change -->

## Impact

- Database: New tables `public.businesses` and `public.business_members`, helper functions for non-recursive RLS checks, and the `create_business_with_owner` RPC.
- Migrations: Initial migration file under `supabase/migrations/`.
- Routing & Middleware: Next.js middleware protecting `/dashboard/*` and `/onboarding`, with automatic redirection based on authentication and business membership state.
- UI: New route groups and pages for `(auth)/login`, `(auth)/register`, `(onboarding)/onboarding`, and `(dashboard)/dashboard`.
- Dependencies: Integrates `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`, `zod`, and `react-hook-form`.
