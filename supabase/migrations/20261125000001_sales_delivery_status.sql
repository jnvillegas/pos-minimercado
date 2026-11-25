-- ========================================================================
-- SALES DELIVERY STATUS FOR FOOD & TAKEAWAY VERTICALS
-- Allows tracking orders as 'pending' (no entregado) or 'delivered' (entregado)
-- ========================================================================

alter table public.sales
  add column if not exists delivery_status text not null default 'delivered'
  check (delivery_status in ('pending', 'delivered'));

create index if not exists idx_sales_delivery_status
  on public.sales (business_id, delivery_status, created_at desc);

-- Notify schema reload
notify pgrst, 'reload schema';
