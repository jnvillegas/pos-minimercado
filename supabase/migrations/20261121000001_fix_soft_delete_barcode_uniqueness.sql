-- Migration: 20261121000001_fix_soft_delete_barcode_uniqueness.sql
-- Description: Replace full unique barcode index with partial unique index for active products only,
-- and clean up soft-deleted test products that have zero sales.

-- 1. Drop existing unique index
drop index if exists public.uq_product_barcode_per_business;

-- 2. Clean up any inactive products without sales to release test barcodes
delete from public.products
where is_active = false
  and id not in (select distinct product_id from public.sale_items where product_id is not null);

-- 3. Create partial unique index only for active products
create unique index if not exists uq_product_barcode_per_business
  on public.products(business_id, barcode)
  where is_active = true and barcode is not null and barcode <> '';
