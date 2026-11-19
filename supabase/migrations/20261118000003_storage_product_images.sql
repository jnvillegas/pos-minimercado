-- Migration: 20261118000003_storage_product_images.sql
-- Description: Create product-images storage bucket with public read and authenticated write

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Policies for storage.objects
create policy "Allow authenticated uploads to product-images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');

create policy "Allow authenticated updates to product-images"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images');

create policy "Allow public read of product-images"
on storage.objects for select
to public
using (bucket_id = 'product-images');
