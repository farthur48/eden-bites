-- Eden Bites Phase 3
-- Backend and ordering engine hardening: payments, idempotency, atomic order
-- creation, schema compatibility, constraints, indexes and RLS adjustments.

-- Compatibility naming/views requested by spec -------------------------------
create table if not exists public.admins (
  id uuid primary key references public.profiles (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

insert into public.admins (id)
select id from public.profiles where is_admin = true
on conflict (id) do nothing;

create or replace view public.business_settings as
select * from public.store_settings;

-- Products: spec naming compatibility ----------------------------------------
alter table public.products add column if not exists is_available boolean;
update public.products set is_available = coalesce(is_available, is_active);
alter table public.products alter column is_available set default true;
alter table public.products alter column is_available set not null;

create or replace function public.sync_product_availability()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.is_available is null then new.is_available := new.is_active; end if;
    if new.is_active is distinct from new.is_available then new.is_active := new.is_available; end if;
  else
    if new.is_available is distinct from old.is_available and new.is_active is not distinct from old.is_active then
      new.is_active := new.is_available;
    elsif new.is_active is distinct from old.is_active and new.is_available is not distinct from old.is_available then
      new.is_available := new.is_active;
    else
      new.is_available := coalesce(new.is_available, new.is_active);
      new.is_active := coalesce(new.is_active, new.is_available);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_sync_availability on public.products;
create trigger products_sync_availability
  before insert or update on public.products
  for each row execute function public.sync_product_availability();

-- Extras compatibility (current model uses option groups/options) -------------
create or replace view public.product_extras as
select
  o.id,
  g.product_id,
  o.name,
  o.price_pesewas as price,
  p.is_available
from public.product_options o
join public.product_option_groups g on g.id = o.group_id
join public.products p on p.id = g.product_id;

-- Orders: payment, idempotency, integrity ------------------------------------
alter table public.orders add column if not exists order_number text;
update public.orders set order_number = reference where order_number is null;
alter table public.orders alter column order_number set not null;
create unique index if not exists orders_order_number_unique_idx on public.orders (order_number);

alter table public.orders add column if not exists payment_method text not null default 'cash_on_delivery'
  check (payment_method in ('cash_on_delivery', 'cash_on_pickup', 'momo_on_delivery', 'momo_on_pickup'));
alter table public.orders add column if not exists payment_status text not null default 'pending'
  check (payment_status in ('pending', 'paid', 'failed', 'cancelled'));
alter table public.orders add column if not exists idempotency_key text;
create unique index if not exists orders_idempotency_key_unique_idx on public.orders (idempotency_key) where idempotency_key is not null;

update public.orders
set payment_method = case when fulfilment_method = 'pickup' then 'cash_on_pickup' else 'cash_on_delivery' end
where payment_method is null or payment_method = 'cash_on_delivery';

alter table public.orders drop constraint if exists orders_fulfilment_payment_check;
alter table public.orders add constraint orders_fulfilment_payment_check check (
  (fulfilment_method = 'delivery' and payment_method in ('cash_on_delivery','momo_on_delivery')) or
  (fulfilment_method = 'pickup' and payment_method in ('cash_on_pickup','momo_on_pickup'))
);

alter table public.orders drop constraint if exists orders_delivery_fee_consistency_check;
alter table public.orders add constraint orders_delivery_fee_consistency_check check (
  (fulfilment_method = 'pickup' and delivery_fee_status = 'not_required' and delivery_fee_pesewas = 0) or
  (fulfilment_method = 'delivery' and delivery_fee_status in ('pending','confirmed'))
);

alter table public.orders drop constraint if exists orders_total_consistency_check;
alter table public.orders add constraint orders_total_consistency_check check (
  (delivery_fee_status = 'pending' and total_pesewas = subtotal_pesewas) or
  (delivery_fee_status <> 'pending' and total_pesewas = subtotal_pesewas + delivery_fee_pesewas)
);

create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists orders_fulfilment_idx on public.orders (fulfilment_method);

-- Order items/extras snapshots ----------------------------------------------
create table if not exists public.order_item_extras (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  extra_id uuid,
  extra_name text not null,
  unit_price_pesewas integer not null check (unit_price_pesewas >= 0),
  quantity integer not null default 1 check (quantity > 0),
  line_total_pesewas integer not null check (line_total_pesewas >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_item_extras_order_item_idx on public.order_item_extras (order_item_id);

-- Backfill extras from json options where possible
insert into public.order_item_extras (order_item_id, extra_id, extra_name, unit_price_pesewas, quantity, line_total_pesewas)
select
  oi.id,
  nullif(opt->>'optionId','')::uuid,
  coalesce(opt->>'optionName','Extra'),
  greatest(0, coalesce((opt->>'pricePesewas')::int, 0)),
  1,
  greatest(0, coalesce((opt->>'pricePesewas')::int, 0))
from public.order_items oi,
lateral jsonb_array_elements(case when jsonb_typeof(oi.options) = 'array' then oi.options else '[]'::jsonb end) as opt
where not exists (select 1 from public.order_item_extras e where e.order_item_id = oi.id);

alter table public.order_item_extras enable row level security;

drop policy if exists "Customers can view their own order item extras" on public.order_item_extras;
create policy "Customers can view their own order item extras"
  on public.order_item_extras for select to authenticated
  using (
    exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_extras.order_item_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Admins can manage order item extras" on public.order_item_extras;
create policy "Admins can manage order item extras"
  on public.order_item_extras for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Atomic order creation RPC --------------------------------------------------
create or replace function public.create_order_atomic(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_open boolean;
  v_idempotency text := nullif(trim(payload->>'idempotency_key'), '');
  v_existing jsonb;
  v_order_id uuid;
  v_reference text := payload->>'reference';
  v_fulfilment text := payload->>'fulfilment_method';
  v_payment_method text := payload->>'payment_method';
  v_subtotal int := (payload->>'subtotal_pesewas')::int;
  v_delivery_fee_status text := payload->>'delivery_fee_status';
  v_delivery_fee int := coalesce((payload->>'delivery_fee_pesewas')::int, 0);
  v_total int := (payload->>'total_pesewas')::int;
  v_item jsonb;
  v_item_id uuid;
  v_opt jsonb;
begin
  if v_idempotency is not null then
    select to_jsonb(o) into v_existing from public.orders o where o.idempotency_key = v_idempotency;
    if v_existing is not null then
      return jsonb_build_object('ok', true, 'duplicate', true, 'order', v_existing);
    end if;
  end if;

  select coalesce(is_open, false) into v_store_open from public.store_settings where id = 'main' for update;
  if not coalesce(v_store_open, false) then
    raise exception 'STORE_CLOSED';
  end if;

  insert into public.orders (
    reference, order_number, customer_name, customer_phone, customer_email,
    fulfilment_method, delivery_address, delivery_area, delivery_directions, notes,
    status, payment_method, payment_status, subtotal_pesewas, delivery_fee_pesewas,
    delivery_fee_status, total_pesewas, idempotency_key
  ) values (
    v_reference, v_reference, payload->>'customer_name', payload->>'customer_phone', nullif(payload->>'customer_email',''),
    v_fulfilment, nullif(payload->>'delivery_address',''), nullif(payload->>'delivery_area',''), nullif(payload->>'delivery_directions',''), nullif(payload->>'notes',''),
    'new', v_payment_method, 'pending', v_subtotal, v_delivery_fee, v_delivery_fee_status, v_total, v_idempotency
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(payload->'items')
  loop
    insert into public.order_items (
      order_id, product_id, product_name, unit_price_pesewas, quantity, line_total_pesewas, options, special_instructions
    ) values (
      v_order_id,
      nullif(v_item->>'product_id','')::uuid,
      v_item->>'product_name',
      (v_item->>'unit_price_pesewas')::int,
      (v_item->>'quantity')::int,
      (v_item->>'line_total_pesewas')::int,
      coalesce(v_item->'options', '[]'::jsonb),
      nullif(v_item->>'special_instructions','')
    ) returning id into v_item_id;

    for v_opt in select * from jsonb_array_elements(coalesce(v_item->'options','[]'::jsonb))
    loop
      insert into public.order_item_extras (
        order_item_id, extra_id, extra_name, unit_price_pesewas, quantity, line_total_pesewas
      ) values (
        v_item_id,
        nullif(v_opt->>'optionId','')::uuid,
        coalesce(v_opt->>'optionName','Extra'),
        greatest(0, coalesce((v_opt->>'pricePesewas')::int,0)),
        1,
        greatest(0, coalesce((v_opt->>'pricePesewas')::int,0))
      );
    end loop;
  end loop;

  return jsonb_build_object('ok', true, 'duplicate', false, 'order', (select to_jsonb(o) from public.orders o where o.id = v_order_id));
exception
  when unique_violation then
    if v_idempotency is not null then
      select to_jsonb(o) into v_existing from public.orders o where o.idempotency_key = v_idempotency;
      if v_existing is not null then
        return jsonb_build_object('ok', true, 'duplicate', true, 'order', v_existing);
      end if;
    end if;
    raise;
end;
$$;

revoke all on function public.create_order_atomic(jsonb) from public;
grant execute on function public.create_order_atomic(jsonb) to service_role;

-- RLS tightening ------------------------------------------------------------
alter table public.admins enable row level security;
drop policy if exists "Admins can view admins" on public.admins;
create policy "Admins can view admins" on public.admins for select to authenticated using (public.is_admin());
drop policy if exists "Admins can manage admins" on public.admins;
create policy "Admins can manage admins" on public.admins for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Ensure customers cannot write orders/order_items/extras (no insert policies for anon/auth except admin paths where present)
