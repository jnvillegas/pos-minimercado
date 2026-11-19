# Proposal: Fast Point of Sale (POS) Checkout Flow

## Why

The core revenue driver of retail stores and minimarkets is checkout speed at the counter. Cashiers cannot afford slow page loads, tedious multi-step forms, or separate manual inventory adjustments when ringing up customers during peak rush hours. Furthermore, retail businesses frequently experience pricing adjustments; if historical sales records reference mutable product tables directly, past revenue, tax, and profit margin analytics become corrupt. This change introduces the dedicated POS checkout engine, supporting instant barcode scanning (USB gun and mobile camera), live cart discounting, atomic stock decrementing, and pricing snapshotting locked to an active cash shift.

## What Changes

- Add database tables `sales` and `sale_items` with multi-tenant Row Level Security (RLS) linked to `businesses(id)`.
- Enforce immutable historical pricing snapshots by storing `product_name`, `unit_cost`, and `unit_price` directly in `sale_items` at transaction time.
- Implement an atomic PostgreSQL RPC function `create_sale`:
  - Enforces that an active, open cash register shift (`cash_shifts` with `status = 'open'`) exists before completing any sale.
  - Inserts transaction header (`sales`) and line items (`sale_items`).
  - Atomically decrements product inventory balances (`products.stock`) in the same database transaction.
  - Computes tender amounts and change due for cash transactions.
- Build the high-throughput Point of Sale interface at `/dashboard/pos`:
  - Autofocused barcode input optimized for USB barcode scanner guns (adding items or incrementing quantities on `Enter`).
  - Camera barcode scanning button for mobile devices utilizing `html5-qrcode`.
  - Fast product search catalog with category filters and instant item selection.
  - Interactive Cart panel (sidebar in desktop, expandable drawer in mobile) with quantity adjustments, line removal, and global discount application ($ fixed or % percentage).
  - Quick checkout dialog supporting multiple payment methods (`Efectivo`, `Transferencia`, `Tarjeta Débito`, `Tarjeta Crédito`), cash bills shortcuts, and automatic change due calculation.
  - Post-sale receipt summary with thermal print styling and rapid "Nueva Venta" reset.

## Capabilities

### New Capabilities
- `pos-terminal`: Interactive POS user interface, USB scanner autofocus listener, mobile camera barcode scanner, live product catalog search, and cart manipulation with global discounting.
- `sale-transaction-processing`: Transactional sale persistence (`create_sale` RPC), active cash shift enforcement, immutable price snapshotting, atomic stock deduction, cash change reconciliation, and post-sale receipt generation.

### Modified Capabilities
<!-- None: Expands commercial operations building upon manage-product-catalog and manage-cash-shifts -->

## Impact

- Database: New tables `public.sales` and `public.sale_items`, relational foreign keys to `businesses`, `cash_shifts`, and `auth.users`, and atomic RPC `create_sale`.
- Client Dependencies: Addition of `html5-qrcode` for mobile camera barcode decoding.
- Routing & Navigation: The `/dashboard/pos` route becomes an operational checkout terminal accessible from the main navigation shell.
- Cash Register Coupling: Sales automatically associate with the current `shift_id`, enabling real-time aggregation of sales totals within the open register shift.
