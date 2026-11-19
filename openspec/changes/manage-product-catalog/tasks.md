# Tasks: Manage Product Catalog and Inventory

## 1. Database Migrations, RLS, Storage & RPCs

- [x] 1.1 Create migration `supabase/migrations/20261118000001_manage_product_catalog.sql` with `categories` and `products` tables and indexes.
- [x] 1.2 Implement strict multi-tenant Row Level Security (RLS) policies on `categories` and `products`.
- [x] 1.3 Create Supabase Storage bucket `product-images` and configure tenant-isolated RLS policies.
- [x] 1.4 Implement atomic stock adjustment RPC `adjust_product_stock` with non-negative validation.
- [x] 1.5 Implement batch product import RPC `batch_import_products` with automatic category resolution.

## 2. Data Validation & Server Actions

- [x] 2.1 Define Zod schemas for category creation, product mutations, and spreadsheet row validation in `src/lib/validations/product.ts`.
- [x] 2.2 Implement Server Actions for product CRUD, category CRUD, and image storage signing in `src/app/(dashboard)/inventory/actions.ts`.
- [x] 2.3 Implement Server Action calling `adjust_product_stock` and `batch_import_products` RPCs.

## 3. Inventory Overview Page & KPI Summary Cards

- [x] 3.1 Create `/dashboard/inventory` route and fetch server-side initial product and category datasets.
- [x] 3.2 Build KPI summary cards displaying Total Active Products, Total Valuation at Cost, and Low Stock count.
- [x] 3.3 Style KPI cards with responsive grid and alert badges for items below minimum threshold.

## 4. Product Table, Search & Filter Toolbar

- [x] 4.1 Implement search input with debouncing to filter products by name or barcode.
- [x] 4.2 Implement category filter dropdown and "Solo stock bajo" quick filter toggle.
- [x] 4.3 Build responsive data table with columns: Image, Product Name & Barcode, Category badge, Cost Price, Sale Price, Margin %, Stock badge, and Actions.

## 5. Product Creation & Edit Drawer with Photo Upload & Margin Calculator

- [x] 5.1 Build Product Form modal/drawer using React Hook Form and Zod resolver.
- [x] 5.2 Implement image dropzone with Supabase Storage upload and thumbnail preview.
- [x] 5.3 Implement real-time gross profit margin (%) and markup calculation based on cost and sale prices.
- [x] 5.4 Implement inline category creation popover within the category selector field.

## 6. Quick Stock Adjustment Flow

- [x] 6.1 Create lightweight quick adjustment popover/dialog on each product table row.
- [x] 6.2 Implement quick increment/decrement buttons (+1, +5, +10, -1, -5) and custom input for stock intake or shrinkage.
- [x] 6.3 Wire adjustment action with optimistic UI updates and toast notifications.

## 7. Excel/CSV Bulk Import & Template Generator

- [x] 7.1 Install or configure dynamic import of `xlsx` library.
- [x] 7.2 Implement "Descargar plantilla" feature generating an Excel spreadsheet with standard sample headers and guidance.
- [x] 7.3 Build Import Modal with drag-and-drop file upload for `.xlsx` and `.csv`.
- [x] 7.4 Implement client-side spreadsheet parser and pre-import validation table with row error highlighting.
- [x] 7.5 Connect validated rows to batch import RPC with progress indicator and completion summary report.

## 8. Verification and Build Integrity

- [x] 8.1 Run `npm run lint` and `npm run build` to confirm zero compilation or TypeScript errors.
- [x] 8.2 Verify scenario acceptance criteria across all three OpenSpec delta specifications.
