export type ContactDetails = {
  phone: string | null;
  sms: string | null;
  email: string | null;
  address: string | null;
  instagram: string | null;
  hasAny: boolean;
};

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const phone = clean(process.env.NEXT_PUBLIC_CONTACT_PHONE);
const sms = clean(process.env.NEXT_PUBLIC_CONTACT_SMS) ?? clean(process.env.NEXT_PUBLIC_CONTACT_WHATSAPP) ?? phone;
const email = clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL);
const address = clean(process.env.NEXT_PUBLIC_CONTACT_ADDRESS);
const instagram = clean(process.env.NEXT_PUBLIC_CONTACT_INSTAGRAM);

export const contactDetails: ContactDetails = {
  phone,
  sms,
  email,
  address,
  instagram,
  hasAny: Boolean(phone || sms || email || address || instagram),
};

export function phoneHref(value: string): string {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}

export function smsHref(value: string, body?: string): string {
  const digits = value.replace(/[^\d+]/g, "");
  const base = `sms:${digits}`;
  if (!body) return base;
  return `${base}?&body=${encodeURIComponent(body)}`;
}

export function whatsappHref(value: string): string {
  return smsHref(value);
}

export function instagramHref(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://instagram.com/${value.replace(/^@/, "")}`;
}

export function mapsHref(value: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    value,
  )}`;
}
