-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Create settings table
create table if not exists settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null unique,
  vat_rate numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for settings
alter table settings enable row level security;

create policy "Users can view their own settings"
  on settings for select
  using (auth.uid() = user_id);

create policy "Users can update their own settings"
  on settings for update
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on settings for insert
  with check (auth.uid() = user_id);

-- 2. Update sales table
-- Add new columns if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'sales' and column_name = 'total_brut') then
    alter table sales add column total_brut numeric default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'sales' and column_name = 'vat_rate_snapshot') then
    alter table sales add column vat_rate_snapshot numeric default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'sales' and column_name = 'tva_total') then
    alter table sales add column tva_total numeric default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'sales' and column_name = 'remise') then
    alter table sales add column remise numeric default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'sales' and column_name = 'total_final') then
    alter table sales add column total_final numeric default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'sales' and column_name = 'montant_donne') then
    alter table sales add column montant_donne numeric default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'sales' and column_name = 'reste') then
    alter table sales add column reste numeric default 0;
  end if;
end $$;

-- 3. Update sale_items table
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'sale_items' and column_name = 'product_name_snapshot') then
    alter table sale_items add column product_name_snapshot text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'sale_items' and column_name = 'price_snapshot') then
    alter table sale_items add column price_snapshot numeric default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'sale_items' and column_name = 'tva_snapshot') then
    alter table sale_items add column tva_snapshot numeric default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'sale_items' and column_name = 'subtotal') then
    alter table sale_items add column subtotal numeric default 0;
  end if;
end $$;

-- Enable RLS for Sales
alter table sales enable row level security;

create policy "Users can view their own sales"
  on sales for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sales"
  on sales for insert
  with check (auth.uid() = user_id);

-- Enable RLS for Sale Items
alter table sale_items enable row level security;

-- Sale items are viewed via join usually, or if direct access needed:
-- We can join sales table to check ownership, or denormalize user_id to sale_items (not done here).
-- Or rely on the fact that they are associated with a sale that the user owns.
-- Supabase policies allow subqueries.
create policy "Users can view their own sale items"
  on sale_items for select
  using (
    exists (
      select 1 from sales
      where sales.id = sale_items.sale_id
      and sales.user_id = auth.uid()
    )
  );

create policy "Users can insert their own sale items"
  on sale_items for insert
  with check (
    exists (
      select 1 from sales
      where sales.id = sale_id
      and sales.user_id = auth.uid()
    )
  );

-- 4. Create RPC function for transactional sale creation
create or replace function create_sale(
  p_items jsonb,
  p_total_brut numeric,
  p_vat_rate numeric,
  p_tva_total numeric,
  p_remise numeric,
  p_total_final numeric,
  p_montant_donne numeric,
  p_reste numeric,
  p_payment_method text,
  p_user_id uuid
) returns jsonb as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity numeric;
  v_price numeric;
  v_name text;
begin
  -- 1. Insert Sale
  insert into sales (
    user_id,
    total_brut,
    vat_rate_snapshot,
    tva_total,
    remise,
    total_final,
    montant_donne,
    reste,
    payment_method,
    total -- keeping existing column for backward compatibility, mapped to total_final
  ) values (
    p_user_id,
    p_total_brut,
    p_vat_rate,
    p_tva_total,
    p_remise,
    p_total_final,
    p_montant_donne,
    p_reste,
    p_payment_method,
    p_total_final
  ) returning id into v_sale_id;

  -- 2. Insert Sale Items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;
    v_price := (v_item->>'price')::numeric;
    v_name := (v_item->>'name')::text;

    insert into sale_items (
      sale_id,
      product_id,
      product_name_snapshot,
      price_snapshot,
      quantity,
      tva_snapshot,
      subtotal,
      product_name, -- legacy
      product_price, -- legacy
      product_cost -- legacy, fetching 0 for now or fetch from DB if strict
    ) values (
      v_sale_id,
      v_product_id,
      v_name,
      v_price,
      v_quantity,
      p_vat_rate, -- Simplified: assuming global VAT applies to all items
      (v_price * v_quantity),
      v_name,
      v_price,
      0 -- default cost 0, ideal would be to lookup
    );
    
    -- 3. Update Stock (Optional: trigger stock movement or do it here)
    -- For now we rely on the client or separate calls/triggers for stock movement to keep this focused on sale creation. 
    -- Ideally, stock deduction should happen here too for strict consistency.
    -- Let's add basic stock deduction:
    update products 
    set quantity = quantity - v_quantity,
        updated_at = now()
    where id = v_product_id;

    -- Add stock movement record (to maintain existing logic)
    insert into stock_movements (
        user_id,
        product_id,
        product_name,
        type,
        quantity,
        note
    ) values (
        p_user_id,
        v_product_id,
        v_name,
        'sale',
        v_quantity,
        'Vente #' || substring(v_sale_id::text, 1, 8)
    );

  end loop;

  return jsonb_build_object('id', v_sale_id);
exception
  when others then
    raise exception 'Transaction failed: %', sqlerrm;
end;
$$ language plpgsql security definer;
