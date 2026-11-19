# Proposal: Manage Cash Shifts and Register Reconciliation

## Why

In retail and minimarket operations, cash flow represents a significant share of daily transactions. Without formal shift management and cash counting (arqueo de caja), operators cannot track who handled the register, whether daily cash counts reconcile with registered sales, or pinpoint when shortages or surpluses occur. This change introduces cash register shift tracking (`cash_shifts`), enforcing strict shift exclusivity, live expected cash calculations, and audited closing reconciliations with mandatory discrepancy justifications.

## What Changes

- Add database table `cash_shifts` with multi-tenant Row Level Security (RLS) linked to `businesses(id)`.
- Enforce the core business invariant that **only one cash shift can be open per business at any given time** via a PostgreSQL partial unique index.
- Add an atomic database RPC `open_cash_shift` to open a shift with an initial cash float.
- Add an atomic database RPC `close_cash_shift` to reconcile and close a shift, validating cash differences and requiring explanatory notes whenever a discrepancy exists.
- Implement the cash register interface at `/dashboard/cash-register`:
  - Empty state view to open a shift by specifying the starting cash float.
  - Active shift view presenting real-time cash balance metrics (Initial Float + Cash Sales + Digital Sales - Cash Expenses = Expected Cash).
  - Cash reconciliation modal ("Arqueo de caja") to input counted cash, calculate differences (balanced, surplus, shortage), and capture mandatory notes on variance.
  - Historical table listing all closed shifts with timestamps, responsible users, expected/actual amounts, variances, and audit notes.
- Integrate a global cash register status badge ("Caja Abierta" / "Caja Cerrada") into the Treinta-inspired navigation sidebar and mobile header.

## Capabilities

### New Capabilities
- `cash-shifts`: Opening shifts with starting cash floats, single-open-shift database constraints, real-time live balance aggregation, and global register status indicators.
- `cash-reconciliation`: Cash count reconciliation on shift close, variance calculation (surplus/shortage), mandatory discrepancy justification notes, and shift audit logs.

### Modified Capabilities
<!-- None: Expands the commercial suite on top of setup-auth-and-business -->

## Impact

- Database: New table `public.cash_shifts`, partial unique index `uq_one_open_shift_per_business`, RPCs `open_cash_shift`, `close_cash_shift`, and `get_active_cash_shift`.
- Routing & Navigation: The `/dashboard/cash-register` route becomes a fully functional module; the dashboard shell layout gains a live register status badge.
- Client State & Server Actions: New Server Actions and data fetching utilities for cash shift lifecycle and live metric aggregation.
