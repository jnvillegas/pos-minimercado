# Tasks: Team Role-Based Access Control and Financial Reports

## 1. Database Migrations, RLS, Indexes & Analytical RPCs

- [x] 1.1 Create migration `supabase/migrations/20261118000005_team_rbac_and_reports.sql` defining `business_invitations` table.
- [x] 1.2 Implement strict Row Level Security (RLS) policies on `business_invitations` accessible exclusively by owners.
- [x] 1.3 Implement atomic `accept_invitation` PL/pgSQL RPC function adding accepted user to `business_members`.
- [x] 1.4 Implement analytical database RPC `get_business_financial_report` enforcing owner verification and calculating KPIs, trends, peak hours, payment methods, and top products.

## 2. RBAC Enforcement & Data Masking Utilities

- [x] 2.1 Implement server-side role check helpers (`requireRole`, `assertOwner`) in `src/lib/auth/rbac.ts`.
- [x] 2.2 Configure Next.js route protection redirecting cashiers and managers away from owner-only routes (`/dashboard/reports`, `/dashboard/settings/*`).
- [x] 2.3 Implement product data sanitization utility (`sanitizeProductForRole`) stripping `cost_price` and margins for `cashier` users.
- [x] 2.4 Update navigation shell layout to conditionally hide Reports, Movements, and Team settings from restricted roles.

## 3. Team Management View (/dashboard/settings/team)

- [x] 3.1 Create `/dashboard/settings/team` page layout gated strictly to owners.
- [x] 3.2 Build active team member table showing email, assigned role badge (`Propietario`, `Encargado`, `Cajero`), join date, and member removal action.
- [x] 3.3 Build invite staff modal allowing email input, role selection (`manager` or `cashier`), and shareable link generation.
- [x] 3.4 Implement pending invitations list with revoke action.

## 4. Invitation Acceptance Route

- [x] 4.1 Create public invitation landing route `/invite/[token]` displaying business name and inviter details.
- [x] 4.2 Handle authenticated acceptance calling `accept_invitation` RPC and redirecting to `/dashboard`.
- [x] 4.3 Handle unauthenticated visitors by preserving invite token and redirecting to register/login.

## 5. Financial Reports Screen & Period Controls

- [x] 5.1 Create `/dashboard/reports` page structure with owner role guard.
- [x] 5.2 Build period filter toolbar supporting `Hoy`, `Últimos 7 días`, `Últimos 30 días`, and `Mes específico` selector.
- [x] 5.3 Implement Server Action `fetchFinancialReport` calling `get_business_financial_report` RPC.

## 6. Executive Financial KPI Cards

- [x] 6.1 Build KPI summary grid with 5 cards: Facturación Total, Costo de Mercadería (COGS), Ganancia Bruta (with Margin %), Ticket Promedio (AOV), and Cantidad de Ventas.
- [x] 6.2 Format currency metrics in active business currency (`ARS` or `USD`).

## 7. Recharts Visualizations

- [x] 7.1 Install or configure `recharts` / shadcn chart dependencies.
- [x] 7.2 Implement interactive daily revenue line/area trend chart with tooltips.
- [x] 7.3 Implement peak shopping hours (8:00 - 23:00) bar chart displaying transaction volume.
- [x] 7.4 Implement payment methods donut/pie chart displaying nominal and percentage shares.

## 8. Top 10 Best-Selling Products Ranking

- [x] 8.1 Build Top 10 products ranking table.
- [x] 8.2 Add sorting toggle to rank products by Total Units Sold or by Total Profit Generated.
- [x] 8.3 Render unit price, unit cost, units sold, total revenue, and calculated gross profit per product.

## 9. Multi-Tab Excel/CSV Report Export

- [x] 9.1 Build report export utility leveraging `xlsx`.
- [x] 9.2 Format 3-sheet workbook: `Resumen Ejecutivo`, `Top Productos`, and `Detalle de Ventas`.
- [x] 9.3 Connect "Exportar Reporte a Excel" button with loading indicator and direct file download.

## 10. Verification and Build Integrity

- [x] 10.1 Run `npm run lint` and `npm run build` to confirm zero compilation or TypeScript errors.
- [x] 10.2 Verify scenario acceptance criteria across all OpenSpec delta specifications.
