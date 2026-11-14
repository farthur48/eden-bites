-- Eden Bites Phase 6
-- Replace automated WhatsApp channels with SMS (Termii) in notification tracking.

alter table public.order_notifications
  drop constraint if exists order_notifications_channel_check;

update public.order_notifications
  set channel = 'sms_business',
      provider = coalesce(nullif(provider, ''), 'termii'),
      error_message = coalesce(error_message, 'Migrated from WhatsApp to SMS channel.')
  where channel = 'whatsapp_business';

update public.order_notifications
  set channel = 'sms_customer',
      provider = coalesce(nullif(provider, ''), 'termii'),
      status = case when status = 'pending' then 'skipped' else status end,
      error_message = coalesce(error_message, 'Automated customer SMS is not enabled.')
  where channel = 'whatsapp_customer';

alter table public.order_notifications
  add constraint order_notifications_channel_check
  check (channel in ('dashboard', 'sms_business', 'sms_customer'));
