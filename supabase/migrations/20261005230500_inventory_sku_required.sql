do $$
declare
  product_row record;
  base_code text;
  generated_code text;
  suffix integer;
begin
  for product_row in
    select id
      from public.inventory_products
     where sku is null or char_length(trim(sku)) = 0
  loop
    base_code := 'AUTO-' || upper(replace(product_row.id::text, '-', ''));
    generated_code := base_code;
    suffix := 1;  

    while exists (
      select 1
        from public.inventory_products
       where sku = generated_code
         and id <> product_row.id
    ) loop
      generated_code := base_code || '-' || suffix::text;
      suffix := suffix + 1;
    end loop;

    update public.inventory_products
       set sku = generated_code
     where id = product_row.id;
  end loop;
end;
$$;

alter table public.inventory_products
  alter column sku set not null;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'inventory_products_sku_not_blank_check'
       and conrelid = 'public.inventory_products'::regclass
  ) then
    alter table public.inventory_products
      add constraint inventory_products_sku_not_blank_check
      check (char_length(trim(sku)) between 1 and 64);
  end if;
end;
$$;
