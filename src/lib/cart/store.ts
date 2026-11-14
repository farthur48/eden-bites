"use client";

import { useSyncExternalStore } from "react";

import {
  CART_STORAGE_KEY,
  CART_UPDATED_EVENT,
  EMPTY_CART_SNAPSHOT,
  SERVER_CART_SNAPSHOT,
  addCartItem,
  parseCartItems,
  removeCartItem,
  serializeCartItems,
  setCartItemQuantity,
  type CartItem,
  type CartSnapshot,
} from "@/lib/cart/cart";

let cachedRaw: string | null | undefined;
let cachedSnapshot: CartSnapshot = EMPTY_CART_SNAPSHOT;
let memoryRaw: string | null = null;

function readRaw(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(CART_STORAGE_KEY) ?? memoryRaw;
  } catch {
    return memoryRaw;
  }
}

function writeRaw(raw: string) {
  memoryRaw = raw;

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, raw);
  } catch {
    return;
  }
}

function writeItems(items: CartItem[]) {
  writeRaw(serializeCartItems(items));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

function getSnapshot(): CartSnapshot {
  if (typeof window === "undefined") {
    return SERVER_CART_SNAPSHOT;
  }

  const raw = readRaw();

  if (raw === cachedRaw) {
    return cachedSnapshot;
  }

  cachedRaw = raw;
  cachedSnapshot = {
    items: parseCartItems(raw),
    ready: true,
  };

  return cachedSnapshot;
}

function getServerSnapshot(): CartSnapshot {
  return SERVER_CART_SNAPSHOT;
}

function subscribe(onStoreChange: () => void): () => void {
  function handleStorage(event: StorageEvent) {
    if (event.key === CART_STORAGE_KEY || event.key === null) {
      onStoreChange();
    }
  }

  function handleLocalUpdate() {
    onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CART_UPDATED_EVENT, handleLocalUpdate);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CART_UPDATED_EVENT, handleLocalUpdate);
  };
}

function mutateItems(updater: (items: CartItem[]) => CartItem[]) {
  const currentItems = parseCartItems(readRaw());
  writeItems(updater(currentItems));
}

export function addToCart(item: CartItem) {
  mutateItems((items) => addCartItem(items, item));
}

export function updateCartQuantity(key: string, quantity: number) {
  mutateItems((items) => setCartItemQuantity(items, key, quantity));
}

export function removeFromCart(key: string) {
  mutateItems((items) => removeCartItem(items, key));
}

export function clearCart() {
  writeItems([]);
}

export function useCart(): CartSnapshot {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}
