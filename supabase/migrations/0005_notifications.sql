-- Eden Bites Phase 5
-- Notification delivery tracking for dashboard and WhatsApp channels.

create table if not exists public.order_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  channel text not null check (channel in ('dashboard', 'whatsapp_business', 'whatsapp_customer')),
  event text not null default 'order_created',
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'skipped')),
  recipient text,
  provider text,
  provider_message_id text,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts >= 1),
  next_attempt_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, channel, event)
);

create index if not exists order_notifications_status_next_idx
  on public.order_notifications (status, next_attempt_at, created_at);
create index if not exists order_notifications_order_idx
  on public.order_notifications (order_id, created_at desc);

drop trigger if exists order_notifications_set_updated_at on public.order_notifications;
create trigger order_notifications_set_updated_at
  before update on public.order_notifications
  for each row execute function public.set_updated_at();

alter table public.order_notifications enable row level security;

drop policy if exists "Admins can view order notifications" on public.order_notifications;
create policy "Admins can view order notifications"
  on public.order_notifications for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update order notifications" on public.order_notifications;
create policy "Admins can update order notifications"
  on public.order_notifications for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No public insert/update policies; server-side service role manages delivery.

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_notifications;
