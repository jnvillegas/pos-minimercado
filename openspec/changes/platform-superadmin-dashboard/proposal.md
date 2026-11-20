# Change: Platform Superadmin Dashboard

## Why
As the multi-tenant retail POS system scales, the platform owner requires centralized visibility across all businesses, total Gross Merchandise Volume (GMV), active stores, and the ability to diagnose issues and provide real-time tenant support without requesting client credentials.

## What Changes
1. **Database Schema:** Create `platform_admins` table, security definer functions `is_platform_admin()`, and aggregate reporting RPCs (`get_platform_metrics()`, `list_platform_businesses()`).
2. **Access Control & Guard:** Create server-side guard `verifyPlatformAdmin()` protecting `/admin` routes.
3. **Platform Admin Dashboard:** Provide an executive SaaS owner dashboard displaying:
   - High-level KPIs: Total Tenants, Active Today, Platform GMV, Global Sales Count.
   - Tenant Directory: Searchable table of all registered businesses with owner emails, transaction volume, last activity, and status.
   - Support / Impersonation link: One-click jump to inspect any tenant's dashboard.
