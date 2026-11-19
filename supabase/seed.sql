-- Seed data for Super Nikic
do $$
declare
  b_id uuid := '74fce57d-0496-4929-b323-deeaed5c88a1';
  u_id uuid := 'b4a1ebd9-2b21-4820-a77c-f0be522c3304';
  c_limp uuid;
  c_alm uuid;
  c_beb uuid;
begin
  -- Categories
  insert into public.categories (business_id, name)
  values (b_id, 'Lavandería y Limpieza')
  on conflict (business_id, name) do update set name = excluded.name
  returning id into c_limp;

  insert into public.categories (business_id, name)
  values (b_id, 'Almacén y Galletitas')
  on conflict (business_id, name) do update set name = excluded.name
  returning id into c_alm;

  insert into public.categories (business_id, name)
  values (b_id, 'Bebidas')
  on conflict (business_id, name) do update set name = excluded.name
  returning id into c_beb;

  -- Products (Cleaning / Laundry & Groceries)
  insert into public.products (business_id, category_id, barcode, name, cost_price, sale_price, stock, min_stock)
  values
    (b_id, c_limp, '7791290001015', 'Detergente Magistral Limón 500ml', 1200.00, 1850.00, 40, 10),
    (b_id, c_limp, '7791290001022', 'Jabón Líquido para Ropa Ariel 3L', 4500.00, 6800.00, 25, 5),
    (b_id, c_limp, '7791290001039', 'Suavizante para Ropa Vivere 1L', 1800.00, 2650.00, 30, 8),
    (b_id, c_limp, '7791290001046', 'Lavandina Ayudín Clásica 1L', 850.00, 1300.00, 50, 15),
    (b_id, c_limp, '7791290001053', 'Jabón en Pan Blanco Seiseme 200g', 600.00, 950.00, 45, 10),
    (b_id, c_alm, '7791290002012', 'Galletitas Chocolinas 250g', 1100.00, 1650.00, 35, 10),
    (b_id, c_alm, '7791290002029', 'Galletitas Oreo 118g', 950.00, 1400.00, 28, 8),
    (b_id, c_beb, '7791290003019', 'Gaseosa Coca-Cola Original 2.25L', 2200.00, 3200.00, 45, 12),
    (b_id, c_beb, '7791290003026', 'Agua Mineral Kin con gas 1.5L', 700.00, 1100.00, 30, 10);

  -- Open cash shift
  if not exists (select 1 from public.cash_shifts where business_id = b_id and status = 'open') then
    insert into public.cash_shifts (business_id, opened_by, initial_cash, status)
    values (b_id, u_id, 10000.00, 'open');
  end if;
end;
$$;
