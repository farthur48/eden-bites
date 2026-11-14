"use server";

import { createOrder } from "@/lib/orders/service";
import type {
  CheckoutFieldErrors,
  CheckoutRequestItem,
  CheckoutState,
  FulfilmentMethod,
} from "@/lib/orders/types";
import { getStoreAvailability } from "@/lib/store/availability";

const MAX_ITEMS = 25;
const MAX_QUANTITY = 20;

export async function placeOrderAction(
  _previousState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const store = await getStoreAvailability();

  if (!store.isOpen) {
    return {
      status: "error",
      message: store.message,
      fieldErrors: { form: store.message },
    };
  }

  const fieldErrors: CheckoutFieldErrors = {};
  const customerName = readField(formData, "name", 80);
  const phone = readField(formData, "phone", 30);
  const email = readField(formData, "email", 160);
  const fulfilmentValue = readField(formData, "fulfilment", 20);
  const address = readField(formData, "address", 200);
  const area = readField(formData, "area", 120);
  const directions = readField(formData, "directions", 200);
  const notes = readField(formData, "notes", 600);

  if (customerName.length < 2) {
    fieldErrors.name = "Please enter your full name.";
  }

  const phoneDigits = phone.replace(/\D/g, "");

  if (
    phoneDigits.length < 7 ||
    phoneDigits.length > 15 ||
    /[^\d+()\s-]/.test(phone)
  ) {
    fieldErrors.phone = "Enter a phone number the kitchen can reach you on.";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email address, or leave this blank.";
  }

  if (fulfilmentValue !== "delivery" && fulfilmentValue !== "pickup") {
    fieldErrors.form = "Choose delivery or pickup.";
  }

  const fulfilmentMethod: FulfilmentMethod =
    fulfilmentValue === "pickup" ? "pickup" : "delivery";

  if (fulfilmentMethod === "delivery" && address.length < 5) {
    fieldErrors.address =
      "Add a delivery location so the kitchen knows where to bring your food.";
  }

  if (fulfilmentMethod === "delivery" && area.length < 2) {
    fieldErrors.area = "Add the area or neighbourhood for delivery.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please check the highlighted details.",
      fieldErrors,
    };
  }

  const cartResult = parseRequestItems(formData.get("cart"));

  if (!cartResult.ok) {
    return {
      status: "error",
      message: "Your cart could not be read. Please refresh and try again.",
      fieldErrors: { cart: cartResult.message },
    };
  }

  if (cartResult.items.length === 0) {
    return {
      status: "error",
      message: "Your cart is empty.",
      fieldErrors: { cart: "Add at least one plate before checking out." },
    };
  }

  const result = await createOrder({
    customerName,
    phone,
    email: email || null,
    fulfilmentMethod,
    address: fulfilmentMethod === "delivery" ? address : null,
    area: fulfilmentMethod === "delivery" ? area : null,
    directions: directions || null,
    notes: notes || null,
    items: cartResult.items,
  });

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.field ? { [result.field]: result.message } : undefined,
    };
  }

  return { status: "success", confirmation: result.confirmation };
}

function parseRequestItems(
  raw: FormDataEntryValue | null,
):
  | { ok: true; items: CheckoutRequestItem[] }
  | { ok: false; message: string } {
  if (typeof raw !== "string" || !raw) {
    return { ok: false, message: "No cart details were received." };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "The cart details are not valid." };
  }

  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_ITEMS) {
    return { ok: false, message: "The cart has an invalid number of items." };
  }

  const items: CheckoutRequestItem[] = [];

  for (const value of parsed) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return { ok: false, message: "A cart item is not valid." };
    }

    const record = value as Record<string, unknown>;
    const productId = record.productId;
    const optionIds = record.optionIds;
    const quantity = record.quantity;

    if (
      typeof productId !== "string" ||
      !Array.isArray(optionIds) ||
      optionIds.length > 20 ||
      !optionIds.every((id) => typeof id === "string") ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      return { ok: false, message: "A cart item is not valid." };
    }

    items.push({
      productId,
      optionIds: optionIds.map((id) => id.slice(0, 80)),
      quantity,
      specialInstructions: null,
    });
  }

  return { ok: true, items };
}

function readField(formData: FormData, key: string, maxLength: number): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
