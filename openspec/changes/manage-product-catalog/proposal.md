# Proposal: Manage Product Catalog and Inventory

## Why

A core capability of any retail POS and inventory management system is maintaining an accurate, accessible product catalog and real-time inventory tracking. Small merchants and minimarkets frequently suffer from stockouts, inaccurate inventory valuation, and cumbersome manual data entry when onboarding hundreds of stock-keeping units (SKUs). This change introduces the inventory domain, encompassing category and product administration, stock threshold alerts, image assets storage, quick stock adjustments, and bulk spreadsheet onboarding via Excel and CSV.

## What Changes

- Add database tables `categories` and `products` scoped by `business_id` with strict multi-tenant Row Level Security (RLS) policies.
- Configure a Supabase Storage bucket (`product-images`) with tenant-isolated upload and delete policies.
- Build the inventory management interface at `/dashboard/inventory` inspired by Treinta:
  - Metric summary cards: Total Products, Total Inventory Valuation (at cost), and Low Stock Items.
  - Searchable, filterable product table with debounced text search (by name or barcode), category filter, and "Low stock only" quick toggle.
  - Product creation and editing drawer/modal with photo upload, cost and sale price inputs, and real-time profit margin percentage calculation.
  - Quick stock adjustment dialog for rapid stock intake or loss/shrinkage recording without full product editing.
- Implement client-side spreadsheet import using the `xlsx` library:
  - Downloadable Excel/CSV template with standardized columns.
  - Interactive file parsing and data preview dialog highlighting validation errors before database submission.
  - Batch upsert logic that automatically resolves and creates non-existent categories within the active business.

## Capabilities

### New Capabilities
- `product-catalog`: Product and category data definitions, pricing, margin calculation, image uploads, and multi-tenant CRUD operations.
- `inventory-tracking`: Real-time stock balance monitoring, low-stock threshold detection (`stock <= min_stock`), inventory valuation metrics, and atomic stock adjustments.
- `catalog-bulk-import`: Spreadsheet ingestion (Excel/CSV via `xlsx`), pre-import validation, error highlighting, and batch category and product upserting.

### Modified Capabilities
<!-- None: Builds upon the multi-tenant business foundation established in setup-auth-and-business -->

## Impact

- Database: New tables `public.categories`, `public.products`, indexes for barcode and category lookups, RLS policies, and atomic stock adjustment RPC `adjust_product_stock`.
- Storage: New bucket `product-images` in Supabase Storage with tenant-scoped policies.
- Client Dependencies: Addition of `xlsx` for spreadsheet parsing and template generation.
- Routing & Navigation: The `/dashboard/inventory` route becomes an active, functional module linked from the Treinta-inspired sidebar and mobile drawer.
- APIs & Server Actions: New Server Actions and data fetching utilities for product queries, mutations, image uploads, and batch import.
