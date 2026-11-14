-- Eden Bites Phase 4
-- Admin/extras refinements: per-extra availability and safe archival support.

alter table public.product_options add column if not exists is_available boolean not null default true;

create or replace view public.product_extras as
select
  o.id,
  g.product_id,
  o.name,
  o.price_pesewas as price,
  (p.is_available and o.is_available) as is_available
from public.product_options o
join public.product_option_groups g on g.id = o.group_id
join public.products p on p.id = g.product_id;

create index if not exists product_options_available_idx on public.product_options (group_id, is_available);
