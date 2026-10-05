create table if not exists public.inventory_products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  sku text not null unique constraint inventory_products_sku_not_blank_check
    check (char_length(trim(sku)) between 1 and 64),
  barcode text unique check (barcode is null or char_length(barcode) between 1 and 128),
  unit text not null default 'stuk' check (char_length(unit) between 1 and 20),
  location text check (location is null or char_length(location) <= 100),
  stock_quantity numeric(12, 3) not null default 0 check (stock_quantity >= 0),
  minimum_quantity numeric(12, 3) not null default 0 check (minimum_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.inventory_products(id),
  movement_type text not null check (movement_type in ('in', 'out')),
  quantity numeric(12, 3) not null check (quantity > 0),
  stock_after numeric(12, 3) not null check (stock_after >= 0),
  note text check (note is null or char_length(note) <= 250),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists inventory_products_name_idx
  on public.inventory_products (name);

create index if not exists inventory_movements_created_at_idx
  on public.inventory_movements (created_at desc);

create index if not exists inventory_movements_product_id_idx
  on public.inventory_movements (product_id, created_at desc);

create or replace function public.set_inventory_product_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists inventory_products_updated_at on public.inventory_products;
create trigger inventory_products_updated_at
  before update on public.inventory_products
  for each row execute function public.set_inventory_product_updated_at();

alter table public.inventory_products enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.inventory_members enable row level security;

create or replace function public.is_inventory_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.inventory_members as member
     where member.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_inventory_member() from public, anon;
grant execute on function public.is_inventory_member() to authenticated;

grant select on public.inventory_products to authenticated;
grant insert (name, sku, barcode, unit, location, minimum_quantity)
  on public.inventory_products to authenticated;
grant update (name, sku, barcode, unit, location, minimum_quantity, is_active)
  on public.inventory_products to authenticated;
grant select on public.inventory_movements to authenticated;

drop policy if exists "Authenticated users can read inventory products"
  on public.inventory_products;
create policy "Authenticated users can read inventory products"
  on public.inventory_products for select to authenticated
  using ((select public.is_inventory_member()));

drop policy if exists "Authenticated users can create inventory products"
  on public.inventory_products;
create policy "Authenticated users can create inventory products"
  on public.inventory_products for insert to authenticated
  with check (
    (select public.is_inventory_member())
    and stock_quantity = 0
    and is_active = true
  );

drop policy if exists "Authenticated users can update inventory product details"
  on public.inventory_products;
create policy "Authenticated users can update inventory product details"
  on public.inventory_products for update to authenticated
  using ((select public.is_inventory_member()))
  with check ((select public.is_inventory_member()));

drop policy if exists "Authenticated users can read inventory movements"
  on public.inventory_movements;
create policy "Authenticated users can read inventory movements"
  on public.inventory_movements for select to authenticated
  using ((select public.is_inventory_member()));

create or replace function public.record_inventory_movement(
  p_product_id uuid,
  p_movement_type text,
  p_quantity numeric,
  p_note text default null
)
returns table (
  id uuid,
  product_id uuid,
  movement_type text,
  quantity numeric,
  stock_after numeric,
  note text,
  created_by uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.inventory_products%rowtype;
  v_stock_after numeric(12, 3);
begin
  if not coalesce(public.is_inventory_member(), false) then
    raise exception using errcode = '42501', message = 'Geen toegang tot het voorraadbeheer.';
  end if;

  if p_movement_type not in ('in', 'out') then
    raise exception using errcode = '22023', message = 'Ongeldig type voorraadmutatie.';
  end if;

  if p_quantity is null or p_quantity <= 0 or p_quantity > 1000000 then
    raise exception using errcode = '22023', message = 'Aantal moet groter zijn dan nul.';
  end if;

  if p_note is not null and char_length(p_note) > 250 then
    raise exception using errcode = '22023', message = 'De opmerking mag maximaal 250 tekens bevatten.';
  end if;

  select *
    into v_product
    from public.inventory_products
   where inventory_products.id = p_product_id
     and inventory_products.is_active = true
   for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Artikel niet gevonden.';
  end if;

  if p_movement_type = 'out' and v_product.stock_quantity < p_quantity then
    raise exception using errcode = 'P0001', message = 'Onvoldoende voorraad voor deze afboeking.';
  end if;

  if p_movement_type = 'in' then
    v_stock_after := v_product.stock_quantity + p_quantity;
  else
    v_stock_after := v_product.stock_quantity - p_quantity;
  end if;

  update public.inventory_products
     set stock_quantity = v_stock_after
   where inventory_products.id = p_product_id;

  return query
  insert into public.inventory_movements as movement (
    product_id,
    movement_type,
    quantity,
    stock_after,
    note,
    created_by
  )
  values (
    p_product_id,
    p_movement_type,
    p_quantity,
    v_stock_after,
    nullif(trim(p_note), ''),
    (select auth.uid())
  )
  returning
    movement.id,
    movement.product_id,
    movement.movement_type,
    movement.quantity,
    movement.stock_after,
    movement.note,
    movement.created_by,
    movement.created_at;
end;
$$;

revoke all on function public.record_inventory_movement(uuid, text, numeric, text)
  from public, anon;
grant execute on function public.record_inventory_movement(uuid, text, numeric, text)
  to authenticated;

do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'inventory_products'
  ) then
    alter publication supabase_realtime add table public.inventory_products;
  end if;

  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'inventory_movements'
  ) then
    alter publication supabase_realtime add table public.inventory_movements;
  end if;
end;
$$;
