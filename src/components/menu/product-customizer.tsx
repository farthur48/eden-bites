"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { addToCart } from "@/lib/cart/store";
import { createCartItem, MAX_CART_QUANTITY } from "@/lib/cart/cart";
import { formatGhs } from "@/lib/format";
import { getSelectedOptions } from "@/lib/menu";
import type { MenuOptionGroup, MenuProduct } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

export function ProductCustomizer({
  product,
  isStoreOpen,
  onClose,
  onAdded,
}: {
  product: MenuProduct;
  isStoreOpen: boolean;
  onClose: () => void;
  onAdded: (productName: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selections, setSelections] = useState<Record<string, string[]>>(
    () => getInitialSelections(product),
  );
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, []);

  const selectedOptionIds = Object.values(selections).flat();
  const selectedOptions = getSelectedOptions(product, selectedOptionIds);
  const optionsTotal = selectedOptions.reduce(
    (total, option) => total + option.pricePesewas,
    0,
  );
  const total = (product.pricePesewas + optionsTotal) * quantity;
  const missingRequired = product.optionGroups.some(
    (group) =>
      group.required && (selections[group.id]?.length ?? 0) < group.minSelections,
  );

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  function handleOptionChange(
    group: MenuOptionGroup,
    optionId: string,
    checked: boolean,
  ) {
    setSelections((current) => {
      const currentGroup = current[group.id] ?? [];
      if (group.selection === "single") {
        return { ...current, [group.id]: [optionId] };
      }
      if (checked) {
        if (currentGroup.length >= group.maxSelections) return current;
        return { ...current, [group.id]: [...currentGroup, optionId] };
      }
      return {
        ...current,
        [group.id]: currentGroup.filter((id) => id !== optionId),
      };
    });
  }

  function handleAddToCart() {
    if (missingRequired || !isStoreOpen) return;
    addToCart(createCartItem(product, selectedOptions, quantity));
    onAdded(product.name);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`customizer-title-${product.id}`}
      aria-describedby={`customizer-description-${product.id}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={handleDialogClick}
      className="m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-white p-0 text-foreground sm:m-auto sm:h-auto sm:max-h-[90dvh] sm:w-[min(calc(100%-2rem),64rem)] sm:rounded-[1.5rem] sm:shadow-2xl backdrop:bg-brand-black/55 backdrop:backdrop-blur-sm"
    >
      <div className="flex h-full max-h-[100dvh] flex-col sm:max-h-[90dvh] sm:flex-row">
        <div className="relative h-56 shrink-0 bg-brand-sand sm:h-auto sm:w-[46%]">
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            sizes="(min-width: 640px) 30rem, 100vw"
            className="object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full bg-white/95 text-brand-green-deep shadow-sm sm:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-7 sm:py-6">
            <div className="min-w-0">
              <h2
                id={`customizer-title-${product.id}`}
                className="font-display text-2xl font-extrabold tracking-[-0.03em] text-brand-green-deep sm:text-[1.8rem]"
              >
                {product.name}
              </h2>
              <p
                id={`customizer-description-${product.id}`}
                className="mt-1.5 text-sm leading-6 text-muted"
              >
                {product.description}
              </p>
              <p className="mt-3 font-display text-xl font-extrabold text-brand-green-deep">
                {formatGhs(product.pricePesewas)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="hidden size-10 shrink-0 items-center justify-center rounded-full border border-border text-brand-green-deep transition-colors hover:bg-brand-cream sm:inline-flex"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            <div className="space-y-7">
              {product.optionGroups.map((group) => {
                const groupSelections = selections[group.id] ?? [];
                const atLimit =
                  group.selection === "multiple" &&
                  groupSelections.length >= group.maxSelections;
                return (
                  <fieldset key={group.id}>
                    <legend className="font-display text-lg font-bold text-brand-green-deep">
                      {group.name}
                    </legend>
                    <div className="mt-1 flex items-start justify-between gap-3">
                      {group.description ? (
                        <p className="text-xs leading-relaxed text-muted">
                          {group.description}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span className="shrink-0 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-brand-green/55">
                        {group.required ? "Required" : "Optional"}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2.5">
                      {group.options.map((option) => {
                        const checked = groupSelections.includes(option.id);
                        const disabled =
                          !checked && group.selection === "multiple" && atLimit;
                        return (
                          <label
                            key={option.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors",
                              checked
                                ? "border-brand-green bg-brand-lime/10"
                                : "border-border bg-white hover:border-brand-green/30",
                              disabled && "cursor-not-allowed opacity-50",
                            )}
                          >
                            <input
                              type={
                                group.selection === "single" ? "radio" : "checkbox"
                              }
                              name={`${product.id}-${group.id}`}
                              value={option.id}
                              checked={checked}
                              disabled={disabled}
                              onChange={(event) =>
                                handleOptionChange(group, option.id, event.target.checked)
                              }
                              className="mt-0.5 size-4 shrink-0 accent-[#174b20]"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline justify-between gap-3">
                                <span className="text-sm font-semibold text-brand-green-deep">
                                  {option.name}
                                </span>
                                <span className="shrink-0 text-xs font-semibold text-brand-green/70">
                                  {option.pricePesewas > 0
                                    ? `+ ${formatGhs(option.pricePesewas)}`
                                    : "Included"}
                                </span>
                              </span>
                              {option.description ? (
                                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                                  {option.description}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}

              <div>
                <p className="font-display text-lg font-bold text-brand-green-deep">
                  Quantity
                </p>
                <div className="mt-3 inline-flex items-center rounded-xl border border-border bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="inline-flex size-10 items-center justify-center rounded-lg text-brand-green-deep transition-colors hover:bg-brand-cream disabled:opacity-35"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="min-w-10 text-center text-sm font-bold text-brand-green-deep" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((v) => Math.min(MAX_CART_QUANTITY, v + 1))}
                    disabled={quantity >= MAX_CART_QUANTITY}
                    aria-label="Increase quantity"
                    className="inline-flex size-10 items-center justify-center rounded-lg text-brand-green-deep transition-colors hover:bg-brand-cream disabled:opacity-35"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor={`notes-${product.id}`} className="font-display text-lg font-bold text-brand-green-deep">
                  Special instructions{" "}
                  <span className="text-sm font-medium text-muted">(optional)</span>
                </label>
                <textarea
                  id={`notes-${product.id}`}
                  placeholder="Any preferences or notes for the kitchen"
                  className="mt-3 min-h-24 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/10"
                />
                <p className="mt-1.5 text-xs text-muted">
                  You can also share delivery or order notes at checkout.
                </p>
              </div>

              {product.allergenNote ? (
                <p className="rounded-xl bg-brand-cream px-4 py-3 text-xs leading-relaxed text-brand-green/75">
                  {product.allergenNote}
                </p>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t border-border/70 bg-white px-5 py-4 sm:px-7">
            {!isStoreOpen ? (
              <p className="mb-3 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900">
                The kitchen is currently closed. Ordering is paused.
              </p>
            ) : null}
            {missingRequired ? (
              <p className="mb-3 text-xs font-medium text-amber-800">
                Please select all required options before adding to cart.
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-brand-green/50">
                  Total
                </p>
                <p className="font-display text-2xl font-extrabold text-brand-green-deep" aria-live="polite">
                  {formatGhs(total)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isStoreOpen || missingRequired}
                className={buttonStyles({
                  variant: "accent",
                  size: "lg",
                  className: "min-w-[11rem] sm:min-w-[13rem]",
                })}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

function getInitialSelections(product: MenuProduct): Record<string, string[]> {
  return product.optionGroups.reduce<Record<string, string[]>>((selections, group) => {
    if (group.selection === "single") {
      const defaultOption = group.defaultOptionId ?? group.options[0]?.id;
      selections[group.id] = defaultOption ? [defaultOption] : [];
    } else {
      selections[group.id] = [];
    }
    return selections;
  }, {});
}
