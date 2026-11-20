# Specification: Platform Superadmin Dashboard

## Capabilities

### CAP-1: Superadmin Authorization
- The system must verify whether the authenticated user exists in `platform_admins`.
- If an unauthorized user navigates to `/admin`, they must be redirected to `/dashboard` with an access denied message.

### CAP-2: Global Platform Analytics
- The platform dashboard must display:
  - Total registered businesses.
  - Active businesses today (sales or shift activity).
  - Total GMV (accumulated revenue processed across all stores).
  - Global products catalog count.

### CAP-3: Business Directory & Tenant Management
- A list of all tenants showing:
  - Business ID, Name, Industry, Currency.
  - Primary Owner email.
  - Total sales volume and transaction count.
  - Last activity timestamp and active/dormant status badge.

### CAP-4: Support Mode / Tenant Inspection
- Provide an action allowing the platform admin to seamlessly navigate into any business dashboard to inspect inventory, shifts, or sales for technical support.
