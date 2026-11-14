import type {
  MenuProduct,
  SelectedMenuOption,
} from "@/lib/menu/types";

export const CART_STORAGE_KEY = "eden-bites-cart:v1";
export const CART_UPDATED_EVENT = "eden-bites-cart-updated";
export const MAX_CART_QUANTITY = 20;
export const MAX_DISTINCT_CART_ITEMS = 25;
export const MAX_SPECIAL_INSTRUCTIONS = 300;

export type CartItemOption = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  pricePesewas: number;
};

export type CartItem = {
  key: string;
  productId: string;
  productName: string;
  imageUrl: string;
  imageAlt: string;
  basePricePesewas: number;
  options: CartItemOption[];
  quantity: number;
  specialInstructions: string | null;
};

export type CartSnapshot = {
  items: CartItem[];
  ready: boolean;
};

export const EMPTY_CART_SNAPSHOT: CartSnapshot = {
  items: [],
  ready: true,
};

export const SERVER_CART_SNAPSHOT: CartSnapshot = {
  items: [],
  ready: false,
};

export function makeCartItemKey(
  productId: string,
  optionIds: string[],
  specialInstructions: string | null = null,
): string {
  const sortedOptions = [...new Set(optionIds)].sort();
  const base = `${productId}::${sortedOptions.length > 0 ? sortedOptions.join("|") : "standard"}`;
  const note = normalizeSpecialInstructions(specialInstructions);

  return note ? `${base}::note:${note}` : base;
}

export function createCartItem(
  product: MenuProduct,
  selectedOptions: SelectedMenuOption[],
  quantity: number,
  specialInstructions: string | null = null,
): CartItem {
  const normalizedQuantity = clampQuantity(quantity);
  const options = selectedOptions.map((option) => ({
    groupId: option.groupId,
    groupName: option.groupName,
    optionId: option.optionId,
    optionName: option.optionName,
    pricePesewas: Math.max(0, Math.round(option.pricePesewas)),
  }));
  const note = normalizeSpecialInstructions(specialInstructions);

  return {
    key: makeCartItemKey(
      product.id,
      options.map((option) => option.optionId),
      note,
    ),
    productId: product.id,
    productName: product.name,
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
    basePricePesewas: product.pricePesewas,
    options,
    quantity: normalizedQuantity,
    specialInstructions: note,
  };
}

export function getCartItemUnitPrice(item: CartItem): number {
  return (
    item.basePricePesewas +
    item.options.reduce((total, option) => total + option.pricePesewas, 0)
  );
}

export function getCartLineTotal(item: CartItem): number {
  return getCartItemUnitPrice(item) * item.quantity;
}

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + getCartLineTotal(item), 0);
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function addCartItem(items: CartItem[], item: CartItem): CartItem[] {
  const normalizedQuantity = clampQuantity(item.quantity);
  const existingIndex = items.findIndex(
    (existing) => existing.key === item.key,
  );

  if (existingIndex >= 0) {
    return items.map((existing, index) =>
      index === existingIndex
        ? {
            ...existing,
            quantity: clampQuantity(existing.quantity + normalizedQuantity),
          }
        : existing,
    );
  }

  if (items.length >= MAX_DISTINCT_CART_ITEMS) {
    return items;
  }

  return [...items, { ...item, quantity: normalizedQuantity }];
}

export function setCartItemQuantity(
  items: CartItem[],
  key: string,
  quantity: number,
): CartItem[] {
  if (quantity <= 0) {
    return removeCartItem(items, key);
  }

  const normalizedQuantity = clampQuantity(quantity);

  return items.map((item) =>
    item.key === key ? { ...item, quantity: normalizedQuantity } : item,
  );
}

export function removeCartItem(items: CartItem[], key: string): CartItem[] {
  return items.filter((item) => item.key !== key);
}

export function parseCartItems(raw: string | null): CartItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const items = parsed
      .map(parseCartItem)
      .filter((item): item is CartItem => item !== null)
      .slice(0, MAX_DISTINCT_CART_ITEMS);

    return items.reduce(addCartItem, []);
  } catch {
    return [];
  }
}

export function serializeCartItems(items: CartItem[]): string {
  return JSON.stringify(items);
}

function parseCartItem(value: unknown): CartItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const productId = readText(value.productId, 80);
  const productName = readText(value.productName, 120);
  const imageUrl = readText(value.imageUrl, 500);
  const imageAlt = readText(value.imageAlt, 200);
  const basePricePesewas = readNonNegativeInteger(value.basePricePesewas);
  const quantity = readNonNegativeInteger(value.quantity);
  const specialInstructions =
    typeof value.specialInstructions === "string"
      ? normalizeSpecialInstructions(value.specialInstructions)
      : null;

  if (
    !productId ||
    !productName ||
    !imageUrl ||
    !imageAlt ||
    basePricePesewas === null ||
    quantity === null ||
    quantity < 1
  ) {
    return null;
  }

  if (!Array.isArray(value.options)) {
    return null;
  }

  const options = value.options
    .map(parseCartItemOption)
    .filter((option): option is CartItemOption => option !== null);

  return {
    key: makeCartItemKey(
      productId,
      options.map((option) => option.optionId),
      specialInstructions,
    ),
    productId,
    productName,
    imageUrl,
    imageAlt,
    basePricePesewas,
    options,
    quantity: clampQuantity(quantity),
    specialInstructions,
  };
}

function parseCartItemOption(value: unknown): CartItemOption | null {
  if (!isRecord(value)) {
    return null;
  }

  const groupId = readText(value.groupId, 80);
  const groupName = readText(value.groupName, 120);
  const optionId = readText(value.optionId, 80);
  const optionName = readText(value.optionName, 120);
  const pricePesewas = readNonNegativeInteger(value.pricePesewas);

  if (
    !groupId ||
    !groupName ||
    !optionId ||
    !optionName ||
    pricePesewas === null
  ) {
    return null;
  }

  return {
    groupId,
    groupName,
    optionId,
    optionName,
    pricePesewas,
  };
}

function clampQuantity(quantity: number): number {
  const rounded = Math.round(quantity);
  return Math.min(MAX_CART_QUANTITY, Math.max(1, rounded));
}

function normalizeSpecialInstructions(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().replace(/\s+/g, " ").slice(
    0,
    MAX_SPECIAL_INSTRUCTIONS,
  );

  return trimmed || null;
}

function readText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function readNonNegativeInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
