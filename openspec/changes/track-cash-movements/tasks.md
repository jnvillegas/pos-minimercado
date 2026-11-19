# Tasks: Track Cash Movements and Unified Daily Ledger

## 1. Database Migrations, RLS, Indexes & RPCs

- [x] 1.1 Create migration `supabase/migrations/20261118000004_track_cash_movements.sql` defining `cash_movements` table.
- [x] 1.2 Implement multi-tenant Row Level Security (RLS) policies on `cash_movements`.
- [x] 1.3 Add performance indexes on `cash_movements(business_id, created_at desc)`, `shift_id`, and `type`.
- [x] 1.4 Implement database function `get_shift_cash_balance` aggregating cash sales, manual cash incomes, and cash expenses for an active shift.
- [x] 1.5 Implement unified query RPC `get_unified_movements` combining `sales` and `cash_movements`.

## 2. Server Actions & Validation Schemas

- [x] 2.1 Define Zod schemas for manual cash movements (category, concept, amount, payment method) in `src/lib/validations/movement.ts`.
- [x] 2.2 Implement Server Actions for creating cash movements in `src/app/(dashboard)/movements/actions.ts`.
- [x] 2.3 Implement Server Actions for querying movements with date range, type, and payment method filters.

## 3. Cash Register Shift Integration

- [x] 3.1 Update `close_cash_shift` execution flow to retrieve expected cash calculated by `get_shift_cash_balance`.
- [x] 3.2 Verify that cash expenses logged during an open shift automatically deduct from the shift's expected cash.

## 4. Movements Dashboard Layout & Header

- [x] 4.1 Create `/dashboard/movements` page structure with responsive container and layout.
- [x] 4.2 Build header with title "Movimientos", "+ Nueva venta" action button (linking to `/dashboard/pos`), and "+ Nuevo gasto" button.

## 5. Financial KPI Summary Cards

- [x] 5.1 Implement KPI grid with 3 cards: Balance (Net Cash Flow), Total Incomes, and Total Expenses.
- [x] 5.2 Add color-coding logic (green for positive net balance, red for negative balance).
- [x] 5.3 Format figures using the active business currency (`ARS` or `USD`).

## 6. Filter Toolbar & Date Presets

- [x] 6.1 Build tab switcher: `Resumen`, `Ingresos`, and `Gastos`.
- [x] 6.2 Implement date range preset buttons: `Hoy`, `Esta semana`, `Este mes`, and `Personalizado` (popover date picker).
- [x] 6.3 Implement debounced text search input for concept and payment method dropdown filter.

## 7. Quick Expense Modal Form

- [x] 7.1 Build modal dialog for rapid expense registration with React Hook Form and Zod validation.
- [x] 7.2 Add form fields: Concept, Amount, Category dropdown, and Payment method selector.
- [x] 7.3 Add "Afectar caja actual" checkbox automatically checked when payment method is Cash and a shift is active.
- [x] 7.4 Connect modal to `createCashMovement` Server Action with toast feedback and automatic table revalidation.

## 8. Unified Chronological Activity Table & Detail View

- [x] 8.1 Build unified activity table listing both POS sales and manual cash movements sorted by date descending.
- [x] 8.2 Render color-coded amounts (`+$X.XX` green, `-$X.XX` red), payment method badges, and categories.
- [x] 8.3 Implement transaction detail slide-over/dialog showing line items for sales or category/notes for expenses.

## 9. Verification and Build Integrity

- [x] 9.1 Run `npm run lint` and `npm run build` to confirm zero compilation or TypeScript errors.
- [x] 9.2 Verify scenario acceptance criteria defined in OpenSpec delta specs.
