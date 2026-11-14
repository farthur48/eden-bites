import "server-only";

import { cookies } from "next/headers";

import { hasPublicEnv } from "@/lib/env";
import { hasServiceRoleKey } from "@/lib/env.server";
import { getSelectedOptions } from "@/lib/menu";
import { getMenuProductRecord, mapMenuProduct } from "@/lib/menu/catalog";
import { menuProducts } from "@/lib/menu/fixture";
import type { MenuProduct } from "@/lib/menu/types";
import type {
  CheckoutRequestItem,
  DeliveryFeeStatus,
  FulfilmentMethod,
  OrderConfirmation,
  OrderLineOption,
  PricedOrderItem,
} from "@/lib/orders/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, OrderItem } from "@/types/database";

const MAX_ITEMS = 25;
const MAX_QUANTITY = 20;
const PREVIEW_COOKIE = "eden_bites_order";

export type CreateOrderInput = {
  customerName: string;
  phone: string;
  email: string | null;
  fulfilmentMethod: FulfilmentMethod;
  address: string | null;
  area: string | null;
  directions: string | null;
  notes: string | null;
  items: CheckoutRequestItem[];
};

export type CreateOrderResult =
  | { ok: true; confirmation: OrderConfirmation }
  | { ok: false; message: string; field?: "cart" };

export function isLiveOrderingEnabled(): boolean {
  return hasPublicEnv() && hasServiceRoleKey();
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const priced = await priceOrderItems(input.items);

  if (!priced.ok) {
    return { ok: false, message: priced.message, field: "cart" };
  }

  const deliveryFeeStatus: DeliveryFeeStatus =
    input.fulfilmentMethod === "delivery" ? "pending" : "not_required";
  const reference = createReference();

  if (!isLiveOrderingEnabled()) {
    const confirmation: OrderConfirmation = {
      reference,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email,
      fulfilmentMethod: input.fulfilmentMethod,
      address: input.address,
      area: input.area,
      directions: input.directions,
      notes: input.notes,
      items: priced.items,
      subtotalPesewas: priced.subtotal,
      deliveryFeePesewas: null,
      deliveryFeeStatus,
      totalPesewas: priced.subtotal,
      status: "new",
      createdAt: new Date().toISOString(),
      mode: "preview",
    };

    await savePreviewConfirmation(confirmation);

    return { ok: true, confirmation };
  }

  try {
    return await persistOrder(input, priced, deliveryFeeStatus, reference);
  } catch {
    return {
      ok: false,
      message:
        "We could not save your order right now. Please try again, or contact the kitchen on WhatsApp.",
    };
  }
}

async function persistOrder(
  input: CreateOrderInput,
  priced: { items: PricedOrderItem[]; subtotal: number },
  deliveryFeeStatus: DeliveryFeeStatus,
  initialReference: string,
): Promise<CreateOrderResult> {
  const supabase = createAdminClient();
  let reference = initialReference;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        reference,
        customer_name: input.customerName,
        customer_phone: input.phone,
        customer_email: input.email,
        fulfilment_method: input.fulfilmentMethod,
        delivery_address: input.address,
        delivery_area: input.area,
        delivery_directions: input.directions,
        notes: input.notes,
        status: "new",
        subtotal_pesewas: priced.subtotal,
        delivery_fee_pesewas: 0,
        delivery_fee_status: deliveryFeeStatus,
        total_pesewas: priced.subtotal,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505" && attempt < 3) {
        reference = createReference();
        continue;
      }

      return {
        ok: false,
        message:
          "We could not save your order right now. Please try again, or contact the kitchen on WhatsApp.",
      };
    }

    const itemRows = priced.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      unit_price_pesewas: item.unitPricePesewas,
      quantity: item.quantity,
      line_total_pesewas: item.lineTotalPesewas,
      options: item.options as unknown as Json,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemRows);

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      return {
        ok: false,
        message:
          "We could not save your order items. Please try again or contact the kitchen.",
      };
    }

    return {
      ok: true,
      confirmation: {
        reference: order.reference,
        customerName: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email,
        fulfilmentMethod: order.fulfilment_method,
        address: order.delivery_address,
        area: order.delivery_area,
        directions: order.delivery_directions,
        notes: order.notes,
        items: priced.items,
        subtotalPesewas: order.subtotal_pesewas,
        deliveryFeePesewas:
          order.delivery_fee_status === "confirmed"
            ? order.delivery_fee_pesewas
            : null,
        deliveryFeeStatus: order.delivery_fee_status,
        totalPesewas: order.total_pesewas,
        status: order.status,
        createdAt: order.created_at,
        mode: "live",
      },
    };
  }

  return {
    ok: false,
    message: "We could not generate an order reference. Please try again.",
  };
}

export async function getOrderConfirmation(
  reference: string,
): Promise<OrderConfirmation | null> {
  if (!isLiveOrderingEnabled()) {
    return getPreviewConfirmation(reference);
  }

  try {
    const supabase = createAdminClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();

    if (error || !order) {
      return getPreviewConfirmation(reference);
    }

    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    return {
      reference: order.reference,
      customerName: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email,
      fulfilmentMethod: order.fulfilment_method,
      address: order.delivery_address,
      area: order.delivery_area,
      directions: order.delivery_directions,
      notes: order.notes,
      items: (items ?? []).map(mapStoredOrderItem),
      subtotalPesewas: order.subtotal_pesewas,
      deliveryFeePesewas:
        order.delivery_fee_status === "confirmed"
          ? order.delivery_fee_pesewas
          : null,
      deliveryFeeStatus: order.delivery_fee_status,
      totalPesewas: order.total_pesewas,
      status: order.status,
      createdAt: order.created_at,
      mode: "live",
    };
  } catch {
    return getPreviewConfirmation(reference);
  }
}

export async function priceOrderItems(
  items: CheckoutRequestItem[],
): Promise<
  | { ok: true; items: PricedOrderItem[]; subtotal: number }
  | { ok: false; message: string }
> {
  if (items.length === 0 || items.length > MAX_ITEMS) {
    return { ok: false, message: "Your cart is empty or too large." };
  }

  const pricedItems: PricedOrderItem[] = [];
  let subtotal = 0;

  for (const item of items) {
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_QUANTITY
    ) {
      return { ok: false, message: "A cart quantity is not valid." };
    }

    const product = await getProductForOrdering(item.productId);

    if (!product || !product.isAvailable) {
      return {
        ok: false,
        message:
          "One of your plates is no longer available. Please refresh the menu and add it again.",
      };
    }

    const validation = validateOptions(product, item.optionIds);

    if (!validation.ok) {
      return {
        ok: false,
        message: `Please reselect the options for ${product.name}.`,
      };
    }

    const selectedOptions = getSelectedOptions(product, validation.optionIds);
    const unitPrice =
      product.pricePesewas +
      selectedOptions.reduce((total, option) => total + option.pricePesewas, 0);
    const lineTotal = unitPrice * item.quantity;

    subtotal += lineTotal;
    pricedItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPricePesewas: unitPrice,
      lineTotalPesewas: lineTotal,
      options: selectedOptions.map((option) => ({
        groupId: option.groupId,
        groupName: option.groupName,
        optionId: option.optionId,
        optionName: option.optionName,
        pricePesewas: option.pricePesewas,
      })),
      specialInstructions: item.specialInstructions ?? null,
    });
  }

  return { ok: true, items: pricedItems, subtotal };
}

async function getProductForOrdering(
  productId: string,
): Promise<MenuProduct | null> {
  if (!hasPublicEnv()) {
    return menuProducts.find((product) => product.id === productId) ?? null;
  }

  const record = await getMenuProductRecord(productId);

  if (!record) {
    return null;
  }

  return mapMenuProduct(record.product, record.groups, record.options);
}

function validateOptions(
  product: MenuProduct,
  optionIds: string[],
): { ok: true; optionIds: string[] } | { ok: false } {
  const uniqueOptionIds = [...new Set(optionIds)];
  const knownOptionIds = new Set(
    product.optionGroups.flatMap((group) =>
      group.options.map((option) => option.id),
    ),
  );

  if (uniqueOptionIds.some((id) => !knownOptionIds.has(id))) {
    return { ok: false };
  }

  for (const group of product.optionGroups) {
    const selected = uniqueOptionIds.filter((id) =>
      group.options.some((option) => option.id === id),
    );

    if (
      selected.length < group.minSelections ||
      selected.length > group.maxSelections ||
      (group.selection === "single" && selected.length > 1)
    ) {
      return { ok: false };
    }
  }

  return { ok: true, optionIds: uniqueOptionIds };
}

function mapStoredOrderItem(item: OrderItem): PricedOrderItem {
  const options = Array.isArray(item.options)
    ? item.options
        .map(parseStoredOption)
        .filter((option): option is OrderLineOption => option !== null)
    : [];

  return {
    productId: item.product_id ?? "",
    productName: item.product_name,
    quantity: item.quantity,
    unitPricePesewas: item.unit_price_pesewas,
    lineTotalPesewas: item.line_total_pesewas,
    options,
    specialInstructions: item.special_instructions ?? null,
  };
}

function parseStoredOption(value: unknown): OrderLineOption | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.groupId !== "string" ||
    typeof record.groupName !== "string" ||
    typeof record.optionId !== "string" ||
    typeof record.optionName !== "string" ||
    typeof record.pricePesewas !== "number"
  ) {
    return null;
  }

  return {
    groupId: record.groupId,
    groupName: record.groupName,
    optionId: record.optionId,
    optionName: record.optionName,
    pricePesewas: record.pricePesewas,
  };
}

async function savePreviewConfirmation(confirmation: OrderConfirmation) {
  try {
    const cookieStore = await cookies();
    const payload = JSON.stringify(confirmation);

    if (payload.length > 3800) {
      return;
    }

    cookieStore.set(PREVIEW_COOKIE, payload, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2,
      path: "/",
    });
  } catch {
    return;
  }
}

async function getPreviewConfirmation(
  reference: string,
): Promise<OrderConfirmation | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(PREVIEW_COOKIE)?.value;

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as OrderConfirmation;

    if (parsed.reference !== reference) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function createReference(): string {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/-/g, "");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  return `EB-${date}-${suffix}`;
}
