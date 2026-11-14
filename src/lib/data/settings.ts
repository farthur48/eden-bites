import "server-only";

import { hasPublicEnv } from "@/lib/env";
import {
  contactDetails,
  type ContactDetails,
} from "@/lib/site-config";
import { createClient } from "@/lib/supabase/server";
import type { StoreSettings } from "@/types/database";

export async function getBusinessSettings(): Promise<StoreSettings | null> {
  if (!hasPublicEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", "main")
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function contactDetailsFromSettings(
  settings: StoreSettings | null,
): ContactDetails {
  const phone = clean(settings?.contact_phone) ?? contactDetails.phone;
  const sms = clean(settings?.whatsapp_number) ?? contactDetails.sms ?? phone;
  const email = clean(settings?.contact_email) ?? contactDetails.email;
  const address = clean(settings?.contact_address) ?? contactDetails.address;
  const instagram =
    clean(settings?.instagram_url) ?? contactDetails.instagram;

  return {
    phone,
    sms,
    email,
    address,
    instagram,
    hasAny: Boolean(phone || sms || email || address || instagram),
  };
}

export async function getPublicBusinessProfile(): Promise<{
  settings: StoreSettings | null;
  contact: ContactDetails;
  pickupInstructions: string | null;
  whatsappNumber: string | null;
  smsNumber: string | null;
}> {
  const settings = await getBusinessSettings();
  const contact = contactDetailsFromSettings(settings);

  return {
    settings,
    contact,
    pickupInstructions: clean(settings?.pickup_instructions),
    whatsappNumber: contact.sms,
    smsNumber: contact.sms,
  };
}

export function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
