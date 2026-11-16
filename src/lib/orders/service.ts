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
  PaymentMethod,
  PaymentStatus,
  PricedOrderItem,
} from "@/lib/orders/types";
import { getStoreAvailability } from "@/lib/store/availability";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchPendingNotifications, enqueueOrderPlacedNotifications } from "@/lib/notifications/service";
import type { Json, OrderItem } from "@/types/database";

const MAX_ITEMS = 25;
const MAX_QUANTITY = 20;
const PREVIEW_COOKIE = "eden_bites_order";
const DUPLICATE_WINDOW_MS = 90_000;

export type CreateOrderInput = {
  customerName: string;
  phone: string;
  email: string | null;
  fulfilmentMethod: FulfilmentMethod;
  paymentMethod: PaymentMethod;
  address: string | null;
  area: string | null;
  directions: string | null;
  notes: string | null;
  idempotencyKey?: string | null;
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

  if (!isPaymentMethodValid(input.fulfilmentMethod, input.paymentMethod)) {
    return {
      ok: false,
      message: "Choose a valid payment arrangement for this order.",
    };
  }

  const store = await getStoreAvailability();
  if (!store.isOpen) {
    return {
      ok: false,
      message: store.message || "We are not taking orders at the moment.",
      field: "cart",
    };
  }

  const deliveryFeeStatus: DeliveryFeeStatus =
    input.fulfilmentMethod === "delivery" ? "pending" : "not_required";
  const reference = createReference();
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);

  if (!isLiveOrderingEnabled()) {
    const confirmation: OrderConfirmation = {
      reference,
      orderNumber: reference,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email,
      fulfilmentMethod: input.fulfilmentMethod,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
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
    const duplicate = await findRecentDuplicateOrder(input, priced.subtotal);
    if (duplicate) {
      return { ok: true, confirmation: duplicate };
    }

    return await persistOrder(input, priced, deliveryFeeStatus, reference, idempotencyKey);
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
  idempotencyKey: string | null,
): Promise<CreateOrderResult> {
  const supabase = createAdminClient();
  let reference = initialReference;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const payload = {
      reference,
      customer_name: input.customerName,
      customer_phone: input.phone,
      customer_email: input.email,
      fulfilment_method: input.fulfilmentMethod,
      delivery_address: input.address,
      delivery_area: input.area,
      delivery_directions: input.directions,
      notes: input.notes,
      status: "new" as const,
      payment_method: input.paymentMethod,
      payment_status: "pending" as const,
      subtotal_pesewas: priced.subtotal,
      delivery_fee_pesewas: 0,
      delivery_fee_status: deliveryFeeStatus,
      total_pesewas: priced.subtotal,
      idempotency_key: idempotencyKey,
      items: priced.items.map((item) => ({
        product_id: item.productId,
        product_name: item.productName,
        unit_price_pesewas: item.unitPricePesewas,
        quantity: item.quantity,
        line_total_pesewas: item.lineTotalPesewas,
        options: item.options,
        special_instructions: item.specialInstructions,
      })),
    };

    const { data, error } = await supabase.rpc("create_order_atomic", { payload });

    if (!error && data) {
      const rpc = data as { ok?: boolean; duplicate?: boolean; order?: Record<string, unknown> };
      if (rpc.ok && rpc.order) {
        const confirmation = await getOrderConfirmation(String(rpc.order.reference));
        if (confirmation) {
          await triggerOrderNotifications(String(rpc.order.id ?? ""), confirmation, rpc.duplicate === true);
          return { ok: true, confirmation };
        }
      }
    }

    if (error) {
      const message = String(error.message || "");
      if (message.includes("STORE_CLOSED")) {
        return {
          ok: false,
          message: "We are not taking orders at the moment. Please check back soon.",
          field: "cart",
        };
      }
      if (error.code === "23505" && idempotencyKey) {
        const existing = await getOrderConfirmationByIdempotencyKey(idempotencyKey);
        if (existing) return { ok: true, confirmation: existing };
      }
      if (error.code === "23505" && attempt < 3) {
        reference = createReference();
        continue;
      }
      if (error.code === "42883" || message.includes("create_order_atomic")) {
        return await persistOrderLegacy(input, priced, deliveryFeeStatus, reference);
      }
      return {
        ok: false,
        message:
          "We could not save your order right now. Please try again, or contact the kitchen on WhatsApp.",
      };
    }
  }

  return {
    ok: false,
    message: "We could not generate an order reference. Please try again.",
  };
}

async function persistOrderLegacy(
  input: CreateOrderInput,
  priced: { items: PricedOrderItem[]; subtotal: number },
  deliveryFeeStatus: DeliveryFeeStatus,
  reference: string,
): Promise<CreateOrderResult> {
  const supabase = createAdminClient();
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
    } as never)
    .select("*")
    .single();

  if (error || !order) {
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

  const { error: itemsError } = await supabase.from("order_items").insert(itemRows);
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return {
      ok: false,
      message: "We could not save your order items. Please try again or contact the kitchen.",
    };
  }

  const confirmation = await getOrderConfirmation(order.reference);
  if (!confirmation) {
    return { ok: false, message: "We could not confirm your order. Please contact the kitchen." };
  }
  await triggerOrderNotifications(order.id, confirmation, false);
  return { ok: true, confirmation };
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

    return toConfirmation(order as Record<string, unknown>, (items ?? []) as OrderItem[], "live");
  } catch {
    return getPreviewConfirmation(reference);
  }
}

async function getOrderConfirmationByIdempotencyKey(
  idempotencyKey: string,
): Promise<OrderConfirmation | null> {
  try {
    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (!order) return null;
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });
    const confirmation = toConfirmation(order as Record<string, unknown>, (items ?? []) as OrderItem[], "live");
    await triggerOrderNotifications(order.id, confirmation, true);
    return confirmation;
  } catch {
    return null;
  }
}

async function findRecentDuplicateOrder(
  input: CreateOrderInput,
  subtotalPesewas: number,
): Promise<OrderConfirmation | null> {
  if (!isLiveOrderingEnabled()) return null;
  try {
    const supabase = createAdminClient();
    const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_phone", input.phone)
      .eq("fulfilment_method", input.fulfilmentMethod)
      .eq("subtotal_pesewas", subtotalPesewas)
      .eq("status", "new")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!order) return null;
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });
    const confirmation = toConfirmation(order as Record<string, unknown>, (items ?? []) as OrderItem[], "live");
    await triggerOrderNotifications(order.id, confirmation, true);
    return confirmation;
  } catch {
    return null;
  }
}

async function triggerOrderNotifications(
  orderId: string,
  confirmation: OrderConfirmation,
  isDuplicate: boolean,
): Promise<void> {
  if (!isLiveOrderingEnabled() || confirmation.mode !== "live" || !orderId) return;
  try {
    await enqueueOrderPlacedNotifications({ orderId, confirmation });
    // Attempt delivery once on create path (or for duplicate lookups to catch pending retries)
    // without blocking the order result; failures remain tracked for retry endpoint/cron.
    void dispatchPendingNotifications({ orderId, limit: 10 }).catch((error) => {
      console.error("[notifications] dispatch_after_order_failed", { orderId, isDuplicate, error: String(error) });
    });
  } catch (error) {
    console.error("[notifications] trigger_failed", { orderId, isDuplicate, error: String(error) });
  }
}

function toConfirmation(
  order: Record<string, unknown>,
  items: OrderItem[],
  mode: "live" | "preview",
): OrderConfirmation {
  const fulfilmentMethod = (order.fulfilment_method as FulfilmentMethod) ?? "delivery";
  const deliveryFeeStatus = (order.delivery_fee_status as DeliveryFeeStatus) ??
    (fulfilmentMethod === "pickup" ? "not_required" : "pending");
  return {
    reference: String(order.reference ?? ""),
    orderNumber: (order.order_number as string | null) ?? null,
    customerName: String(order.customer_name ?? ""),
    phone: String(order.customer_phone ?? ""),
    email: (order.customer_email as string | null) ?? null,
    fulfilmentMethod,
    paymentMethod: ((order.payment_method as PaymentMethod) ??
      (fulfilmentMethod === "pickup" ? "cash_on_pickup" : "cash_on_delivery")),
    paymentStatus: ((order.payment_status as PaymentStatus) ?? "pending"),
    address: (order.delivery_address as string | null) ?? null,
    area: (order.delivery_area as string | null) ?? null,
    directions: (order.delivery_directions as string | null) ?? null,
    notes: (order.notes as string | null) ?? null,
    items: items.map(mapStoredOrderItem),
    subtotalPesewas: Number(order.subtotal_pesewas ?? 0),
    deliveryFeePesewas:
      deliveryFeeStatus === "confirmed" ? Number(order.delivery_fee_pesewas ?? 0) : null,
    deliveryFeeStatus,
    totalPesewas: Number(order.total_pesewas ?? 0),
    status: (order.status as OrderConfirmation["status"]) ?? "new",
    createdAt: String(order.created_at ?? new Date().toISOString()),
    mode,
  };
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

    const parsed = JSON.parse(raw) as Partial<OrderConfirmation>;

    if (parsed.reference !== reference) {
      return null;
    }

    return {
      ...parsed,
      paymentMethod:
        (parsed.paymentMethod as PaymentMethod | undefined) ??
        (parsed.fulfilmentMethod === "pickup" ? "cash_on_pickup" : "cash_on_delivery"),
      paymentStatus: (parsed.paymentStatus as PaymentStatus | undefined) ?? "pending",
    } as OrderConfirmation;
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
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();

  return `EB-${date}-${suffix}`;
}

function normalizeIdempotencyKey(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return /^[a-zA-Z0-9._:-]{8,120}$/.test(trimmed) ? trimmed : null;
}

function isPaymentMethodValid(
  fulfilment: FulfilmentMethod,
  payment: PaymentMethod,
): boolean {
  return fulfilment === "delivery"
    ? payment === "cash_on_delivery" || payment === "momo_on_delivery"
    : payment === "cash_on_pickup" || payment === "momo_on_pickup";
}
