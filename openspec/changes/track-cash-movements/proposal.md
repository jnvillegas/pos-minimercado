# Proposal: Track Cash Movements and Unified Daily Ledger

## Why

In minimarkets and local retail stores, cash flow does not consist solely of customer sales. Store owners continuously pay suppliers at the door, withdraw cash for personal needs, pay utility bills, or record external non-POS revenues. Without a centralized cash movement register, these disbursements cause untracked register shortages during shift closing and distort business profitability. Inspired directly by Treinta's core ledger view, this change unifies automated POS sales and manual cash movements into a single, real-time daily ledger with period filtering and cash shift reconciliation.

## What Changes

- Add database table `cash_movements` with multi-tenant Row Level Security (RLS) linked to `businesses(id)` and optionally to `cash_shifts(id)`.
- Update the cash shift reconciliation logic so that cash expenses (`type = 'expense'` and `payment_method = 'cash'`) recorded during an open shift automatically deduct from the register's expected cash.
- Build the Movements module at `/dashboard/movements`:
  - Header featuring quick navigation actions: `+ Nueva venta` (redirecting to POS) and `+ Nuevo gasto` (opening a rapid expense creation modal).
  - Navigation tabs: `Resumen` (Overview / All), `Ingresos` (Income only), and `Gastos` (Expenses only).
  - Filter bar supporting date presets (Hoy, Esta semana, Este mes, Personalizado), concept text search, and payment method filter.
  - Three financial KPI summary cards: **Balance** (Net Profit / Cash Flow), **Ingresos totales** (Total Inflow), and **Gastos totales** (Total Outflow).
  - Chronological activity table uniting POS sales and manual movements with color-coded amounts (green for inflow, red for outflow) and itemized detail inspection.

## Capabilities

### New Capabilities
- `cash-movements`: Manual income and expense registration, expense categorization (suppliers, services, withdrawals), cash shift linkage, and cash shift expected balance reconciliation.
- `unified-movements-ledger`: Centralized daily ledger combining POS sales and manual cash movements, financial KPI metrics (Balance, Inflows, Outflows), date and payment filtering, and detail drawers.

### Modified Capabilities
<!-- None: Integrates seamlessly with manage-cash-shifts and pos-checkout-flow -->

## Impact

- Database: New table `public.cash_movements`, helper function `get_shift_cash_balance`, updated `close_cash_shift` RPC, and unified query view/RPC `get_unified_movements`.
- Routing & Navigation: The `/dashboard/movements` route becomes the central financial cockpit of the application.
- State & Server Actions: New Server Actions and data access hooks for manual movements and aggregated financial metrics.
