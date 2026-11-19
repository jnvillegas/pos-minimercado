# Proposal: Team Role-Based Access Control and Financial Reports

## Why

As a retail minimarket grows, the business owner must delegate daily register and restocking duties to employees without exposing sensitive financial numbers, business margins, or overall profitability. Cashiers only need to operate the checkout counter, manage their shift drawer, and view stock levels—exposing wholesale cost prices or net profit margins creates commercial risk. Furthermore, store owners need comprehensive, actionable visibility into profitability, peak shopping hours, product margins, and exportable financial reports to make informed restocking and pricing decisions.

This change delivers granular Role-Based Access Control (RBAC) with employee invitation management, strict UI and server-side capability restrictions, and an owner-exclusive financial analytics suite with visual charts and Excel/CSV report exports.

## What Changes

- Add employee invitation schema (`business_invitations`) allowing owners to invite staff as `manager` or `cashier`.
- Enforce strict role-based access restrictions across Next.js middleware, Server Actions, UI components, and PostgreSQL RLS:
  - `cashier`: Granted access strictly to `/dashboard/pos`, `/dashboard/cash-register`, and stock viewing on `/dashboard/inventory`. Strips and masks `cost_price` and profit margin percentages; blocks access to `/dashboard/reports`, `/dashboard/movements` history, and team/business settings.
  - `manager`: Full operational access to inventory (with cost pricing), cash shifts, and movements; restricted from owner-only team management, business deletion, and global financial profitability reports.
  - `owner`: Full unrestricted access to all modules, team management, and financial analytics.
- Build the Team Management view at `/dashboard/settings/team` (owner-only):
  - Employee invitation modal with role selection (`manager` or `cashier`).
  - Active team member roster with role badges, revocation controls, and member removal.
  - Pending invitations list with copyable invite link.
- Build the Financial Reports module at `/dashboard/reports` (owner-only):
  - Period filter selector (Hoy, Últimos 7 días, Últimos 30 días, Mes específico).
  - Headline business KPIs: Gross Revenue, Cost of Goods Sold (COGS), Estimated Gross Profit, Gross Margin (%), Average Order Value (AOV / Ticket promedio), and Total Sales Count.
  - Visual charts (powered by Recharts): Daily sales trend line/area chart, peak shopping hours distribution, and payment methods donut breakdown.
  - Top 10 best-selling products ranking table (sortable by units sold and by generated profit).
  - Client-side export to Excel/CSV (via `xlsx`) generating a multi-tab workbook with executive summaries, top products, and itemized transaction logs.

## Capabilities

### New Capabilities
- `team-rbac`: Staff invitation workflows, role assignment (`owner`, `manager`, `cashier`), route guards, and sensitive field masking (hiding `cost_price` and profit margins from cashiers).
- `business-analytics-reports`: Comprehensive profitability metrics (Revenue, COGS, Profit, Margin %, AOV), Recharts visual diagrams, top-selling product rankings, and multi-sheet spreadsheet report exports.

### Modified Capabilities
<!-- None: Composes with setup-auth-and-business, manage-product-catalog, and pos-checkout-flow -->

## Impact

- Database: New table `public.business_invitations`, RPC `accept_invitation`, and analytical reporting RPC `get_business_financial_report`.
- Dependencies: Integrates `recharts` for data visualization and leverages `xlsx` for spreadsheet report generation.
- Middleware & Route Guards: Restricts `/dashboard/reports` and `/dashboard/settings/team` strictly to authenticated users with the `owner` role.
- UI Layout Shell: Conditionally hides navigation links (Reports and Settings/Team) from non-owner users.
