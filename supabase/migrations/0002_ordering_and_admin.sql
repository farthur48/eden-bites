-- Eden Bites Phase 2
-- Ordering, menu customisation, business settings and the agreed order
-- lifecycle (new -> preparing -> completed / cancelled).

-- Menu presentation fields ---------------------------------------------------
alter table public.products add column if not exists tagline text;
alter table public.products add column if not exists serves text not null default '1–2';
alter table public.products add column if not exists prep_minutes integer not null default 25;
alter table public.products add column if not exists tags text[] not null default '{}'::text[];
alter table public.products add column if not exists allergen_note text;
alter table public.products add column if not exists image_alt text;

alter table public.products drop constraint if exists products_prep_minutes_check;
alter table public.products
  add constraint products_prep_minutes_check check (prep_minutes between 1 and 240);

-- Meal customisation ---------------------------------------------------------
create table if not exists public.product_option_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  description text,
  is_required boolean not null default false,
  selection_type text not null default 'single'
    check (selection_type in ('single', 'multiple')),
  min_selections integer not null default 0 check (min_selections >= 0),
  max_selections integer not null default 1 check (max_selections >= 1),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.product_option_groups (id) on delete cascade,
  name text not null,
  description text,
  price_pesewas integer not null default 0 check (price_pesewas >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_option_groups_product_idx
  on public.product_option_groups (product_id, sort_order);

create index if not exists product_options_group_idx
  on public.product_options (group_id, sort_order);

drop trigger if exists product_option_groups_set_updated_at on public.product_option_groups;
create trigger product_option_groups_set_updated_at
  before update on public.product_option_groups
  for each row execute function public.set_updated_at();

drop trigger if exists product_options_set_updated_at on public.product_options;
create trigger product_options_set_updated_at
  before update on public.product_options
  for each row execute function public.set_updated_at();

alter table public.product_option_groups enable row level security;
alter table public.product_options enable row level security;

drop policy if exists "Anyone can view options for active products" on public.product_option_groups;
create policy "Anyone can view options for active products"
  on public.product_option_groups for select to anon, authenticated
  using (
    exists (
      select 1 from public.products
      where products.id = product_option_groups.product_id
        and products.is_active = true
    )
  );

drop policy if exists "Admins can view all option groups" on public.product_option_groups;
create policy "Admins can view all option groups"
  on public.product_option_groups for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins can insert option groups" on public.product_option_groups;
create policy "Admins can insert option groups"
  on public.product_option_groups for insert to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update option groups" on public.product_option_groups;
create policy "Admins can update option groups"
  on public.product_option_groups for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete option groups" on public.product_option_groups;
create policy "Admins can delete option groups"
  on public.product_option_groups for delete to authenticated
  using (public.is_admin());

drop policy if exists "Anyone can view options for active products" on public.product_options;
create policy "Anyone can view options for active products"
  on public.product_options for select to anon, authenticated
  using (
    exists (
      select 1
      from public.product_option_groups
      join public.products on products.id = product_option_groups.product_id
      where product_option_groups.id = product_options.group_id
        and products.is_active = true
    )
  );

drop policy if exists "Admins can view all options" on public.product_options;
create policy "Admins can view all options"
  on public.product_options for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins can insert options" on public.product_options;
create policy "Admins can insert options"
  on public.product_options for insert to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update options" on public.product_options;
create policy "Admins can update options"
  on public.product_options for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete options" on public.product_options;
create policy "Admins can delete options"
  on public.product_options for delete to authenticated
  using (public.is_admin());

-- Orders ---------------------------------------------------------------------
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists delivery_area text;
alter table public.orders add column if not exists delivery_directions text;
alter table public.orders add column if not exists delivery_fee_status text not null default 'not_required';

update public.orders
set delivery_fee_status = case
  when fulfilment_method = 'pickup' then 'not_required'
  when delivery_fee_pesewas > 0 then 'confirmed'
  else 'pending'
end;

alter table public.orders drop constraint if exists orders_delivery_fee_status_check;
alter table public.orders
  add constraint orders_delivery_fee_status_check
  check (delivery_fee_status in ('pending', 'confirmed', 'not_required'));

alter table public.orders drop constraint if exists orders_status_check;
update public.orders set status = 'new' where status = 'pending';
update public.orders set status = 'preparing' where status in ('confirmed', 'ready');
alter table public.orders alter column status set default 'new';
alter table public.orders
  add constraint orders_status_check
  check (status in ('new', 'preparing', 'completed', 'cancelled'));

alter table public.order_items add column if not exists options jsonb not null default '[]'::jsonb;
alter table public.order_items add column if not exists special_instructions text;

-- Business settings ----------------------------------------------------------
alter table public.store_settings add column if not exists logo_url text;
alter table public.store_settings add column if not exists whatsapp_number text;
alter table public.store_settings add column if not exists contact_phone text;
alter table public.store_settings add column if not exists contact_email text;
alter table public.store_settings add column if not exists contact_address text;
alter table public.store_settings add column if not exists instagram_url text;
alter table public.store_settings add column if not exists pickup_instructions text;
alter table public.store_settings add column if not exists notify_dashboard boolean not null default true;
alter table public.store_settings add column if not exists notify_whatsapp boolean not null default false;

-- Seed the two supplied meals only when the menu is completely empty.
do $$
declare
  banku_id uuid;
  acheke_id uuid;
  banku_spice uuid;
  banku_extras uuid;
  acheke_spice uuid;
  acheke_extras uuid;
begin
  if exists (select 1 from public.products) then
    return;
  end if;

  insert into public.products (
    name, slug, tagline, description, price_pesewas, image_url, image_alt,
    is_active, is_featured, sort_order, serves, prep_minutes, tags, allergen_note
  ) values (
    'Banku & Tilapia',
    'banku-and-tilapia',
    'Fermented maize, charcoal-grilled tilapia, fresh pepper.',
    'Two soft, tangy balls of banku served with a whole charcoal-grilled tilapia and a bright onion, tomato and pepper relish. A proper Ghanaian plate, cooked to order and packed hot.',
    8500,
    '/menu/banku-tilapia.jpg',
    'Banku and charcoal-grilled tilapia topped with onion and pepper relish',
    true,
    true,
    1,
    '1–2',
    25,
    array['Charcoal grilled', 'Made to order', 'House favourite'],
    'Contains fish. Prepared in a kitchen that also handles shellfish, peanuts and gluten.'
  ) returning id into banku_id;

  insert into public.products (
    name, slug, tagline, description, price_pesewas, image_url, image_alt,
    is_active, is_featured, sort_order, serves, prep_minutes, tags, allergen_note
  ) values (
    'Acheke & Tilapia',
    'acheke-and-tilapia',
    'Tangy cassava couscous with grilled tilapia and fresh relish.',
    'Fluffy, slightly tangy acheke piled beside a whole charcoal-grilled tilapia, finished with a crisp onion, tomato and pepper relish. Bright, generous and made for sharing.',
    8000,
    '/menu/acheke-tilapia.jpg',
    'Charcoal-grilled tilapia covered in fresh onion and tomato relish, served with acheke',
    true,
    false,
    2,
    '1–2',
    20,
    array['Charcoal grilled', 'Tangy & bright', 'Made to order'],
    'Contains fish. Prepared in a kitchen that also handles shellfish, peanuts and gluten.'
  ) returning id into acheke_id;

  insert into public.product_option_groups (
    product_id, name, description, is_required, selection_type, min_selections, max_selections, sort_order
  ) values (
    banku_id, 'Choose your heat', 'We keep the pepper sauce on the side where possible.',
    true, 'single', 1, 1, 0
  ) returning id into banku_spice;

  insert into public.product_options (group_id, name, description, price_pesewas, sort_order) values
    (banku_spice, 'Mild', 'Gentle heat, with the pepper served on the side.', 0, 0),
    (banku_spice, 'Medium', 'A balanced kick that lets the fish shine.', 0, 1),
    (banku_spice, 'Hot', 'Full Ghanaian heat, made for pepper lovers.', 0, 2);

  insert into public.product_option_groups (
    product_id, name, description, is_required, selection_type, min_selections, max_selections, sort_order
  ) values (
    banku_id, 'Make it bigger', 'Optional extras, added to the same plate.',
    false, 'multiple', 0, 4, 1
  ) returning id into banku_extras;

  insert into public.product_options (group_id, name, description, price_pesewas, sort_order) values
    (banku_extras, 'Extra banku', 'One more soft banku ball.', 1000, 0),
    (banku_extras, 'Extra tilapia', 'A second whole grilled tilapia.', 3500, 1),
    (banku_extras, 'Extra pepper relish', 'More onion, tomato and fresh pepper.', 500, 2),
    (banku_extras, 'Extra shito', 'A small pot of savoury black pepper sauce.', 500, 3);

  insert into public.product_option_groups (
    product_id, name, description, is_required, selection_type, min_selections, max_selections, sort_order
  ) values (
    acheke_id, 'Choose your heat', 'We keep the pepper sauce on the side where possible.',
    true, 'single', 1, 1, 0
  ) returning id into acheke_spice;

  insert into public.product_options (group_id, name, description, price_pesewas, sort_order) values
    (acheke_spice, 'Mild', 'Gentle heat, with the pepper served on the side.', 0, 0),
    (acheke_spice, 'Medium', 'A balanced kick that lets the fish shine.', 0, 1),
    (acheke_spice, 'Hot', 'Full Ghanaian heat, made for pepper lovers.', 0, 2);

  insert into public.product_option_groups (
    product_id, name, description, is_required, selection_type, min_selections, max_selections, sort_order
  ) values (
    acheke_id, 'Make it bigger', 'Optional extras, added to the same plate.',
    false, 'multiple', 0, 4, 1
  ) returning id into acheke_extras;

  insert into public.product_options (group_id, name, description, price_pesewas, sort_order) values
    (acheke_extras, 'Extra acheke', 'A generous extra portion of acheke.', 800, 0),
    (acheke_extras, 'Extra tilapia', 'A second whole grilled tilapia.', 3500, 1),
    (acheke_extras, 'Extra pepper relish', 'More onion, tomato and fresh pepper.', 500, 2),
    (acheke_extras, 'Add fried plantain', 'Sweet, golden plantain on the side.', 1000, 3);
end;
$$;
