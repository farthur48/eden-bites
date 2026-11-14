"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { formatGhs } from "@/lib/format";
import { isAllowedImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

import {
  saveMenuProductAction,
  type MenuFormState,
} from "@/app/admin/(dashboard)/menu/actions";

type EditorOption = {
  id: string;
  name: string;
  description: string;
  price: string;
};

type EditorGroup = {
  id: string;
  name: string;
  description: string;
  required: boolean;
  selection: "single" | "multiple";
  maxSelections: number;
  options: EditorOption[];
};

export type MenuEditorProduct = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  price_pesewas: number;
  image_url: string | null;
  image_alt: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  serves: string;
  prep_minutes: number;
  tags: string[];
  allergen_note: string | null;
  groups: Array<{
    id: string;
    name: string;
    description: string | null;
    is_required: boolean;
    selection_type: "single" | "multiple";
    max_selections: number;
    options: Array<{
      id: string;
      name: string;
      description: string | null;
      price_pesewas: number;
    }>;
  }>;
};

const initialState: MenuFormState = { status: "idle" };

export function MenuForm({ product }: { product?: MenuEditorProduct }) {
  const [state, formAction, isPending] = useActionState(
    saveMenuProductAction,
    initialState,
  );
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [groups, setGroups] = useState<EditorGroup[]>(() =>
    product && product.groups.length > 0
      ? product.groups.map((group) => ({
          id: group.id,
          name: group.name,
          description: group.description ?? "",
          required: group.is_required,
          selection: group.selection_type,
          maxSelections: group.max_selections,
          options: group.options.map((option) => ({
            id: option.id,
            name: option.name,
            description: option.description ?? "",
            price: (option.price_pesewas / 100).toFixed(2),
          })),
        }))
      : [emptyGroup("draft-group", [emptyOption("draft-option")])],
  );

  const priceValue = product ? (product.price_pesewas / 100).toFixed(2) : "";

  function updateGroup(id: string, patch: Partial<EditorGroup>) {
    setGroups((current) =>
      current.map((group) => (group.id === id ? { ...group, ...patch } : group)),
    );
  }

  function updateOption(
    groupId: string,
    optionId: string,
    patch: Partial<EditorOption>,
  ) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId ? { ...option, ...patch } : option,
              ),
            }
          : group,
      ),
    );
  }

  function addGroup() {
    setGroups((current) => [...current, emptyGroup()]);
  }

  function removeGroup(id: string) {
    setGroups((current) => current.filter((group) => group.id !== id));
  }

  function addOption(groupId: string) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, options: [...group.options, emptyOption()] }
          : group,
      ),
    );
  }

  function removeOption(groupId: string, optionId: string) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.filter((option) => option.id !== optionId),
            }
          : group,
      ),
    );
  }

  const serializedGroups = JSON.stringify(
    groups.map((group) => ({
      name: group.name,
      description: group.description,
      required: group.required,
      selection: group.selection,
      maxSelections: group.maxSelections,
      options: group.options.map((option) => ({
        name: option.name,
        description: option.description,
        price: option.price,
      })),
    })),
  );

  return (
    <form action={formAction} className="space-y-6">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="optionGroups" value={serializedGroups} />

      {state.status === "error" ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-5">
          <section className="rounded-brand border border-brand-green/10 bg-brand-white p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-brand-green">
              Meal details
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Meal name" name="name" defaultValue={product?.name} required />
              <Field
                label="URL slug (optional)"
                name="slug"
                defaultValue={product?.slug}
                placeholder="banku-and-tilapia"
              />
              <Field
                label="Tagline"
                name="tagline"
                defaultValue={product?.tagline ?? ""}
                className="sm:col-span-2"
                placeholder="A short line shown on the meal card"
              />
              <Field
                label="Description"
                name="description"
                defaultValue={product?.description ?? ""}
                textarea
                className="sm:col-span-2"
                required
              />
              <Field
                label="Base price (GHS)"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={priceValue}
                placeholder="85.00"
                required
              />
              <Field
                label="Preparation minutes"
                name="prepMinutes"
                type="number"
                min="1"
                max="240"
                defaultValue={product?.prep_minutes ?? 25}
              />
              <Field
                label="Serves"
                name="serves"
                defaultValue={product?.serves ?? "1–2"}
                placeholder="1–2"
              />
              <Field
                label="Sort order"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={product?.sort_order ?? 0}
              />
              <Field
                label="Tags (comma separated)"
                name="tags"
                defaultValue={product?.tags?.join(", ") ?? ""}
                className="sm:col-span-2"
                placeholder="Charcoal grilled, Made to order"
              />
              <Field
                label="Allergen note"
                name="allergenNote"
                defaultValue={product?.allergen_note ?? ""}
                textarea
                className="sm:col-span-2"
                placeholder="Contains fish. Prepared in a kitchen that also handles..."
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-5">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={product?.is_active ?? true}
                  className="size-4 accent-[#174b20]"
                />
                Active on the menu
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green">
                <input
                  type="checkbox"
                  name="isFeatured"
                  defaultChecked={product?.is_featured ?? false}
                  className="size-4 accent-[#174b20]"
                />
                Feature on homepage
              </label>
            </div>
          </section>

          <section className="rounded-brand border border-brand-green/10 bg-brand-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-brand-green">
                  Customization options
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Customers choose from these groups when adding the meal.
                </p>
              </div>
              <button
                type="button"
                onClick={addGroup}
                className={buttonStyles({ variant: "outline", size: "sm" })}
              >
                Add group
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {groups.map((group, groupIndex) => (
                <div
                  key={group.id}
                  className="rounded-2xl border border-brand-green/10 bg-brand-cream/50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-green/55">
                      Group {groupIndex + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeGroup(group.id)}
                      className="text-xs font-semibold text-red-700 underline decoration-red-200 underline-offset-4"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Group name"
                      value={group.name}
                      onChange={(value) => updateGroup(group.id, { name: value })}
                      placeholder="Choose your heat"
                    />
                    <Input
                      label="Description"
                      value={group.description}
                      onChange={(value) =>
                        updateGroup(group.id, { description: value })
                      }
                      placeholder="Optional guidance"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-brand-green">
                      <input
                        type="checkbox"
                        checked={group.required}
                        onChange={(event) =>
                          updateGroup(group.id, {
                            required: event.target.checked,
                          })
                        }
                        className="size-4 accent-[#174b20]"
                      />
                      Required
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-brand-green">
                      <input
                        type="radio"
                        checked={group.selection === "single"}
                        onChange={() =>
                          updateGroup(group.id, {
                            selection: "single",
                            maxSelections: 1,
                          })
                        }
                        className="size-4 accent-[#174b20]"
                      />
                      Pick one
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-brand-green">
                      <input
                        type="radio"
                        checked={group.selection === "multiple"}
                        onChange={() =>
                          updateGroup(group.id, { selection: "multiple" })
                        }
                        className="size-4 accent-[#174b20]"
                      />
                      Pick multiple
                    </label>
                    {group.selection === "multiple" ? (
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-brand-green">
                        Max
                        <input
                          type="number"
                          min="1"
                          max={Math.max(1, group.options.length)}
                          value={group.maxSelections}
                          onChange={(event) =>
                            updateGroup(group.id, {
                              maxSelections: Math.max(
                                1,
                                Number(event.target.value) || 1,
                              ),
                            })
                          }
                          className="h-8 w-16 rounded-lg border border-brand-green/15 bg-brand-white px-2 text-xs"
                        />
                      </label>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-2">
                    {group.options.map((option) => (
                      <div
                        key={option.id}
                        className="grid gap-2 rounded-xl bg-brand-white p-3 sm:grid-cols-[1fr_1fr_7rem_auto] sm:items-end"
                      >
                        <Input
                          label="Choice"
                          value={option.name}
                          onChange={(value) =>
                            updateOption(group.id, option.id, { name: value })
                          }
                          placeholder="Extra tilapia"
                        />
                        <Input
                          label="Description"
                          value={option.description}
                          onChange={(value) =>
                            updateOption(group.id, option.id, {
                              description: value,
                            })
                          }
                          placeholder="Optional"
                        />
                        <Input
                          label="Price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={option.price}
                          onChange={(value) =>
                            updateOption(group.id, option.id, { price: value })
                          }
                          placeholder="0.00"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(group.id, option.id)}
                          className="mb-0.5 text-xs font-semibold text-red-700 underline decoration-red-200 underline-offset-4"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addOption(group.id)}
                    className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-brand-green underline decoration-brand-lime decoration-2 underline-offset-4"
                  >
                    Add choice
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-brand border border-brand-green/10 bg-brand-white p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-brand-green">
              Meal image
            </h2>
            <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-brand-sand">
              {isAllowedImageUrl(imageUrl) ? (
                <Image
                  src={imageUrl}
                  alt={product?.image_alt || "Meal image preview"}
                  fill
                  sizes="(min-width: 1024px) 30vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center px-4 text-center text-xs text-brand-green/50">
                  {imageUrl
                    ? "Use a Supabase storage URL or upload an image."
                    : "No image selected"}
                </div>
              )}
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-green/60">
                Upload image
              </span>
              <input
                type="file"
                name="image"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setSelectedFileName(file ? file.name : null);
                }}
                className="mt-2 block w-full text-xs text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-green file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-white"
              />
            </label>
            {selectedFileName ? (
              <p className="mt-2 text-xs font-semibold text-brand-green/70">
                {selectedFileName} selected — the preview updates after saving.
              </p>
            ) : null}

            <div className="mt-4">
              <Input
                label="Or use an image URL"
                value={imageUrl}
                onChange={setImageUrl}
                placeholder="/menu/meal.jpg or Supabase storage URL"
              />
              <p className="mt-1 text-[0.65rem] leading-relaxed text-muted">
                Remote images must come from Supabase Storage. Uploading is
                recommended.
              </p>
              <input type="hidden" name="imageUrl" value={imageUrl} />
            </div>

            <div className="mt-4">
              <Input
                label="Image alt text"
                name="imageAlt"
                defaultValue={product?.image_alt ?? ""}
                placeholder="Describe the meal for screen readers"
              />
            </div>
          </section>

          <div className="rounded-brand bg-brand-green p-5 text-brand-cream">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-lime">
              Pricing
            </p>
            <p className="mt-2 text-sm leading-relaxed text-brand-cream/70">
              Base price is shown on the menu. Option prices are added when the
              customer selects them.
            </p>
            <p className="mt-3 text-lg font-bold text-brand-lime">
              {formatGhs(parseGhs(priceValue))} base
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={isPending}
              className={buttonStyles({ size: "lg", className: "w-full" })}
            >
              {isPending
                ? "Saving..."
                : product
                  ? "Save meal"
                  : "Add meal"}
            </button>
            <Link
              href="/admin/menu"
              className={buttonStyles({ variant: "outline", className: "w-full" })}
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  textarea = false,
  required = false,
  className,
  step,
  min,
  max,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  required?: boolean;
  className?: string;
  step?: string;
  min?: string;
  max?: string;
}) {
  const shared = cn(
    "mt-1.5 w-full rounded-xl border border-brand-green/15 bg-brand-white px-3 text-sm text-brand-green placeholder:text-brand-green/30 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/15",
    textarea ? "min-h-24 py-2.5" : "h-11",
  );

  return (
    <label className={cn("block", className)}>
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-green/60">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          className={shared}
        />
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          step={step}
          min={min}
          max={max}
          className={shared}
        />
      )}
    </label>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  name,
  defaultValue,
  type = "text",
  step,
  min,
}: {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  name?: string;
  defaultValue?: string;
  type?: string;
  step?: string;
  min?: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-brand-green/55">
        {label}
      </span>
      {onChange ? (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          step={step}
          min={min}
          className="mt-1 h-10 w-full rounded-xl border border-brand-green/15 bg-brand-white px-3 text-sm text-brand-green placeholder:text-brand-green/30 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/15"
        />
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          step={step}
          min={min}
          className="mt-1 h-10 w-full rounded-xl border border-brand-green/15 bg-brand-white px-3 text-sm text-brand-green placeholder:text-brand-green/30 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/15"
        />
      )}
    </label>
  );
}

function emptyGroup(
  id: string = crypto.randomUUID(),
  options?: EditorOption[],
): EditorGroup {
  return {
    id,
    name: "",
    description: "",
    required: true,
    selection: "single",
    maxSelections: 1,
    options: options ?? [emptyOption()],
  };
}

function emptyOption(id: string = crypto.randomUUID()): EditorOption {
  return {
    id,
    name: "",
    description: "",
    price: "0.00",
  };
}

function parseGhs(value: string): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
}
