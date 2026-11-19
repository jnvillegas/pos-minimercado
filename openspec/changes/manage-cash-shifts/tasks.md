# Tasks: Manage Cash Shifts and Register Reconciliation

## 1. Database Migrations, RLS, Indexes & RPCs

- [x] 1.1 Create migration `supabase/migrations/20261118000002_manage_cash_shifts.sql` defining `cash_shifts` table.
- [x] 1.2 Implement partial unique index `uq_one_open_shift_per_business` ensuring only one open shift per business.
- [x] 1.3 Configure strict Row Level Security (RLS) policies on `cash_shifts` scoped by `business_id`.
- [x] 1.4 Implement atomic RPC `open_cash_shift` with initial cash float validation.
- [x] 1.5 Implement atomic RPC `close_cash_shift` with row locking (`FOR UPDATE`), variance computation, and mandatory note check.

## 2. Data Access & Server Actions

- [x] 2.1 Define Zod schemas for opening cash shifts and reconciliation form in `src/lib/validations/cash-shift.ts`.
- [x] 2.2 Implement Server Actions in `src/app/(dashboard)/cash-register/actions.ts` calling `open_cash_shift` and `close_cash_shift`.
- [x] 2.3 Implement server-side data fetchers retrieving the active shift and closed shift history for the active business.

## 3. Cash Register View: Closed State (Abrir Caja)

- [x] 3.1 Create `/dashboard/cash-register` page layout handling toggle between Open and Closed states.
- [x] 3.2 Build the "Abrir Caja" card with input for initial cash float and quick amount shortcut buttons.
- [x] 3.3 Connect form submission to `open_cash_shift` Server Action with feedback toast and optimistic state switch.

## 4. Cash Register View: Active Shift Live Summary

- [x] 4.1 Build active shift summary banner showing opening timestamp, opened by user, and elapsed time.
- [x] 4.2 Build real-time metric cards for Initial Float, Cash Sales, Digital Sales, Cash Expenses, and Expected Cash in drawer.
- [x] 4.3 Add prominent "Cerrar Caja" action button triggering the reconciliation modal.

## 5. Cash Reconciliation Modal (Arqueo de Caja)

- [x] 5.1 Implement reconciliation modal dialog displaying the calculated expected cash balance.
- [x] 5.2 Add numeric input for actual counted cash with real-time difference calculation.
- [x] 5.3 Render conditional discrepancy badges: Balanced (`0.00`), Surplus (`> 0.00`), or Shortage (`< 0.00`).
- [x] 5.4 Implement mandatory justification `<textarea>` enforced by Zod and UI whenever difference is non-zero.
- [x] 5.5 Connect modal submission to `close_cash_shift` Server Action.

## 6. Shift Audit History Table

- [x] 6.1 Build responsive history table listing previously closed shifts.
- [x] 6.2 Format columns: Date & Time, Opened By, Closed By, Initial Cash, Expected, Actual, Variance (color-coded badge), and Notes.
- [x] 6.3 Implement pagination or limit for large shift logs.

## 7. Navigation Shell Status Indicator

- [x] 7.1 Create a reusable `CashRegisterStatusBadge` component.
- [x] 7.2 Mount the badge in the desktop sidebar and mobile drawer layout linking to `/dashboard/cash-register`.
- [x] 7.3 Dynamically display "Caja Abierta" (green dot) or "Caja Cerrada" (gray/amber dot) based on active shift presence.

## 8. Verification and Build Integrity

- [x] 8.1 Run `npm run lint` and `npm run build` to confirm zero compilation or TypeScript errors.
- [x] 8.2 Verify acceptance criteria for all scenarios defined in OpenSpec delta specs.
