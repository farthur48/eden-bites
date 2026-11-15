-- Eden Bites Phase 6/7
-- Add out_for_delivery status and extend notification channels for Hubtel SMS + Gmail email.

-- Orders: allow out_for_delivery ------------------------------------------------
alter table public.orders drop constraint if exists orders_status_check;
update public.orders set status = 'new' where status = 'pending';
update public.orders set status = 'preparing' where status in ('confirmed', 'ready');
alter table public.orders
  add constraint orders_status_check
  check (status in ('new', 'preparing', 'out_for_delivery', 'completed', 'cancelled'));

-- Notifications: support email channels ----------------------------------------
alter table public.order_notifications
  drop constraint if exists order_notifications_channel_check;

update public.order_notifications
  set channel = 'sms_business'
  where channel = 'whatsapp_business';

update public.order_notifications
  set channel = 'sms_customer'
  where channel = 'whatsapp_customer';

alter table public.order_notifications
  add constraint order_notifications_channel_check
  check (channel in ('dashboard', 'sms_business', 'sms_customer', 'email_business', 'email_customer'));
