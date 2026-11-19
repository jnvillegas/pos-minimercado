-- Migration: 20261118000002_inventory_operations.sql
-- Description: Stock adjustment and batch import RPCs for inventory management

-- 1. Partial index for low stock items
create index if not exists idx_products_business_low_stock
  on public.products(business_id)
  where stock <= min_stock;

-- 2. Atomic Stock Adjustment RPC
create or replace function public.adjust_product_stock(
  p_product_id uuid,
  p_delta numeric,
  p_reason text default 'manual_adjustment'
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
  v_new_stock numeric;
begin
  select * into v_product
  from public.products
  where id = p_product_id;

  if not found then
    raise exception 'Product not found';
  end if;

  if not public.is_business_member(v_product.business_id) then
    raise exception 'Unauthorized to modify products for this business';
  end if;

  v_new_stock := v_product.stock + p_delta;
  if v_new_stock < 0 then
    raise exception 'Stock cannot be negative (current: %, adjustment: %)', v_product.stock, p_delta;
  end if;

  update public.products
  set stock = v_new_stock,
      updated_at = now()
  where id = p_product_id
  returning * into v_product;

  return v_product;
end;
$$;

-- 3. Batch Import Products RPC
create or replace function public.batch_import_products(
  p_business_id uuid,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
  v_cat_name text;
  v_cat_id uuid;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_cat_created integer := 0;
  v_barcode text;
  v_name text;
  v_cost numeric;
  v_sale numeric;
  v_stock numeric;
  v_min_stock numeric;
  v_existing_id uuid;
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Unauthorized to import products';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_name := trim(coalesce(v_row->>'name', ''));
    if v_name = '' then
      continue;
    end if;

    v_cat_name := trim(coalesce(v_row->>'category', ''));
    v_cat_id := null;

    -- Resolve or insert category
    if v_cat_name <> '' then
      select id into v_cat_id
      from public.categories
      where business_id = p_business_id and lower(name) = lower(v_cat_name)
      limit 1;

      if v_cat_id is null then
        insert into public.categories (business_id, name)
        values (p_business_id, v_cat_name)
        on conflict (business_id, name) do update set name = excluded.name
        returning id into v_cat_id;
        v_cat_created := v_cat_created + 1;
      end if;
    end if;

    v_barcode := nullif(trim(coalesce(v_row->>'barcode', '')), '');
    v_cost := greatest(0, coalesce((v_row->>'cost_price')::numeric, 0.00));
    v_sale := greatest(0, coalesce((v_row->>'sale_price')::numeric, 0.00));
    v_stock := greatest(0, coalesce((v_row->>'stock')::numeric, 0.00));
    v_min_stock := greatest(0, coalesce((v_row->>'min_stock')::numeric, 5.00));

    -- Check if product exists by barcode or name
    v_existing_id := null;
    if v_barcode is not null then
      select id into v_existing_id
      from public.products
      where business_id = p_business_id and barcode = v_barcode
      limit 1;
    end if;

    if v_existing_id is null then
      select id into v_existing_id
      from public.products
      where business_id = p_business_id and lower(name) = lower(v_name)
      limit 1;
    end if;

    if v_existing_id is not null then
      update public.products
      set category_id = coalesce(v_cat_id, category_id),
          barcode = coalesce(v_barcode, barcode),
          name = v_name,
          cost_price = v_cost,
          sale_price = v_sale,
          stock = v_stock,
          min_stock = v_min_stock,
          updated_at = now()
      where id = v_existing_id;
      v_updated := v_updated + 1;
    else
      insert into public.products (
        business_id, category_id, barcode, name,
        cost_price, sale_price, stock, min_stock
      ) values (
        p_business_id, v_cat_id, v_barcode, v_name,
        v_cost, v_sale, v_stock, v_min_stock
      );
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'inserted', v_inserted,
    'updated', v_updated,
    'categories_created', v_cat_created
  );
end;
$$;
