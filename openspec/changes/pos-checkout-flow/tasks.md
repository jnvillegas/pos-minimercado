# Tasks: Fast Point of Sale (POS) Checkout Flow

## 1. Database Migrations, RLS, Indexes & RPCs

- [x] 1.1 Create migration `supabase/migrations/20261118000001_pos_and_catalog.sql` defining `sales` and `sale_items` tables.
- [x] 1.2 Implement strict multi-tenant Row Level Security (RLS) policies on `sales` and `sale_items`.
- [x] 1.3 Add performance indexes for `sales(business_id, created_at desc)`, `sales(shift_id)`, and `sale_items(sale_id)`.
- [x] 1.4 Implement atomic `create_sale` PL/pgSQL RPC function with open shift validation, item snapshotting, and stock deduction.

## 2. Server Actions & Validation Schemas

- [x] 2.1 Define data interfaces for POS cart items, discount formats, and checkout submission in `src/app/(dashboard)/dashboard/pos/actions.ts`.
- [x] 2.2 Implement Server Action `processSaleAction` invoking the `create_sale` RPC.
- [x] 2.3 Implement client data fetchers for product catalog and category lookups.

## 3. Cash Register Guard & POS Screen Scaffold

- [x] 3.1 Create `/dashboard/pos` route layout with dual desktop sidebar cart and mobile drawer layout.
- [x] 3.2 Implement shift status check ensuring sales connect to active cash shift.

## 4. Barcode Input & Scanner Integration

- [x] 4.1 Implement top barcode input with persistent autofocus and Enter key capture for USB scanner guns.
- [x] 4.2 Configure barcode match resolution adding items directly to the cart or incrementing quantity on existing lines.
- [x] 4.3 Implement barcode search and error notifications.

## 5. Instant Product Search & Catalog Grid

- [x] 5.1 Implement instant client-side search input filtering cached catalog items by name, barcode, or category.
- [x] 5.2 Build product tile grid with category pills, image thumbnails, price tags, and one-tap addition to cart.

## 6. Interactive Cart & Global Discounts

- [x] 6.1 Build reactive cart list showing item title, barcode, unit price, quantity stepper (+/-), and line delete.
- [x] 6.2 Implement global discount popover supporting both percentage (% discount) and fixed amount ($ discount).
- [x] 6.3 Display real-time order breakdown (Subtotal, Discount, Net Total Amount).

## 7. Fast Checkout Modal & Cash Calculations

- [x] 7.1 Build checkout modal ("Cobrar") with payment method selection (`Efectivo`, `Transferencia / QR`, `Tarjeta Débito`, `Tarjeta Crédito`).
- [x] 7.2 Implement cash payment controls: numeric input, bill shortcut chips, and bold real-time change due calculation.
- [x] 7.3 Connect checkout confirmation to `processSaleAction` action with loading state and error handling.

## 8. Receipt Modal & Rapid New Sale Reset

- [x] 8.1 Implement post-sale receipt summary modal displaying ticket details, payment method, and change due.
- [x] 8.2 Add thermal receipt printable layout via `window.print()`.
- [x] 8.3 Implement "Nueva Venta" action resetting cart state and refocusing the barcode input automatically.

## 9. Verification and Build Integrity

- [x] 9.1 Run `npm run lint` and `npm run build` to confirm zero compilation or TypeScript errors.
- [x] 9.2 Verify all scenario acceptance criteria defined in OpenSpec delta specs.
