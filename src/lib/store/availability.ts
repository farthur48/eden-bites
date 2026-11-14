import "server-only";

import { getStoreSettings } from "@/lib/data/store";

export type StoreAvailability = {
  isOpen: boolean;
  label: string;
  message: string;
};

function parseOpenState(value: string | undefined): boolean {
  if (!value) {
    return true;
  }

  return !["false", "0", "no", "closed"].includes(value.trim().toLowerCase());
}

export async function getStoreAvailability(): Promise<StoreAvailability> {
  const settings = await getStoreSettings();

  if (settings.status === "ready" && settings.store) {
    const isOpen = settings.store.is_open;

    return {
      isOpen,
      label: isOpen ? "Open now" : "Currently closed",
      message: isOpen
        ? settings.store.opening_note?.trim() ||
          "Taking orders for delivery and pickup. Pay when your meal arrives."
        : settings.store.opening_note?.trim() ||
          "We are not taking orders at the moment. Please check back soon.",
    };
  }

  const isOpen = parseOpenState(process.env.NEXT_PUBLIC_STORE_OPEN);
  const note = process.env.NEXT_PUBLIC_STORE_NOTE?.trim();

  return {
    isOpen,
    label: isOpen ? "Open now" : "Currently closed",
    message: isOpen
      ? "Taking orders for delivery and pickup. Pay when your meal arrives."
      : note ||
        "We are not taking orders at the moment. Please check back soon.",
  };
}
