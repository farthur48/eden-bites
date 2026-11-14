"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import {
  saveMenuProduct,
  toggleProductActive,
  uploadMenuImage,
  type MenuProductInput,
} from "@/lib/data/menu-admin";
import { isAllowedImageUrl } from "@/lib/images";

export type MenuFormState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function saveMenuProductAction(
  _previousState: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  await requireAdmin();

  const id = readText(formData.get("id"), 80) || undefined;
  const name = readText(formData.get("name"), 120);
  const description = readText(formData.get("description"), 2000);
  const price = parseGhs(formData.get("price"));
  const prepMinutes = Number(formData.get("prepMinutes"));
  const sortOrder = Number(formData.get("sortOrder"));

  if (name.length < 2) {
    return { status: "error", message: "Enter the meal name." };
  }

  if (description.length < 10) {
    return { status: "error", message: "Add a short meal description." };
  }

  if (price === null) {
    return { status: "error", message: "Enter a valid price in Ghana cedis." };
  }

  const optionGroups = parseOptionGroups(formData.get("optionGroups"));

  if (!optionGroups.ok) {
    return { status: "error", message: optionGroups.message };
  }

  if (optionGroups.groups.length === 0) {
    return {
      status: "error",
      message: "Add at least one customization group so customers can order.",
    };
  }

  let imageUrl = readText(formData.get("imageUrl"), 1000);

  if (imageUrl && !isAllowedImageUrl(imageUrl)) {
    return {
      status: "error",
      message:
        "Use a local image path or a Supabase Storage URL, or upload an image.",
    };
  }

  const image = formData.get("image");

  if (image instanceof File && image.size > 0) {
    const upload = await uploadMenuImage(image, "products");

    if (!upload.ok) {
      return { status: "error", message: upload.message };
    }

    imageUrl = upload.url;
  }

  const nameForSlug = readText(formData.get("slug"), 120) || name;
  const input: MenuProductInput = {
    id,
    name,
    slug: slugify(nameForSlug),
    tagline: readText(formData.get("tagline"), 200),
    description,
    pricePesewas: price,
    imageUrl: imageUrl || "/menu/placeholder.svg",
    imageAlt: readText(formData.get("imageAlt"), 200) || `${name} from Eden Bites`,
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    sortOrder: Number.isFinite(sortOrder) ? Math.max(0, Math.round(sortOrder)) : 0,
    serves: readText(formData.get("serves"), 40) || "1–2",
    prepMinutes: Number.isFinite(prepMinutes)
      ? Math.min(240, Math.max(1, Math.round(prepMinutes)))
      : 25,
    tags: readText(formData.get("tags"), 500)
      .split(",")
      .map((tag) => tag.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 8),
    allergenNote: readText(formData.get("allergenNote"), 500),
    optionGroups: optionGroups.groups,
  };

  const saved = await saveMenuProduct(input);

  if (!saved.ok) {
    return { status: "error", message: saved.message };
  }

  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/admin");
  revalidatePath("/admin/menu");
  revalidatePath(`/admin/menu/${saved.id}`);

  redirect(`/admin/menu?saved=${id ? "updated" : "created"}`);
}

export async function toggleMenuProductAction(formData: FormData) {
  await requireAdmin();

  const id = readText(formData.get("id"), 80);
  const active = formData.get("isActive") === "true";

  if (!id) {
    redirect("/admin/menu?error=missing");
  }

  const result = await toggleProductActive(id, active);

  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/admin/menu");

  redirect(`/admin/menu?saved=${result.ok ? "availability" : "error"}`);
}

function parseOptionGroups(
  raw: FormDataEntryValue | null,
):
  | { ok: true; groups: MenuProductInput["optionGroups"] }
  | { ok: false; message: string } {
  if (typeof raw !== "string" || !raw) {
    return { ok: true, groups: [] };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "The customization options are not valid." };
  }

  if (!Array.isArray(parsed) || parsed.length > 10) {
    return { ok: false, message: "Use up to 10 customization groups." };
  }

  const groups: MenuProductInput["optionGroups"] = [];

  for (const value of parsed) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return { ok: false, message: "A customization group is not valid." };
    }

    const record = value as Record<string, unknown>;
    const name = readText(record.name, 120);
    const selection = record.selection === "multiple" ? "multiple" : "single";
    const optionsRaw = Array.isArray(record.options) ? record.options : [];

    if (name.length < 2) {
      return {
        ok: false,
        message: "Every customization group needs a name.",
      };
    }

    if (optionsRaw.length === 0 || optionsRaw.length > 20) {
      return {
        ok: false,
        message: `Add between 1 and 20 choices to "${name}".`,
      };
    }

    const options: MenuProductInput["optionGroups"][number]["options"] = [];

    for (const optionValue of optionsRaw) {
      if (
        typeof optionValue !== "object" ||
        optionValue === null ||
        Array.isArray(optionValue)
      ) {
        return { ok: false, message: "A customization choice is not valid." };
      }

      const optionRecord = optionValue as Record<string, unknown>;
      const optionName = readText(optionRecord.name, 120);
      const pricePesewas = parseGhs(optionRecord.price);

      if (optionName.length < 1 || pricePesewas === null) {
        return {
          ok: false,
          message: `Check the name and price for a choice in "${name}".`,
        };
      }

      options.push({
        name: optionName,
        description: readText(optionRecord.description, 300),
        pricePesewas,
        isAvailable: optionRecord.isAvailable !== false,
      });
    }

    const required = record.required === true;
    const minSelections = required ? 1 : 0;
    const maxSelections =
      selection === "single"
        ? 1
        : Math.max(
            1,
            Math.min(
              options.length,
              Number(record.maxSelections) || options.length,
            ),
          );

    groups.push({
      name,
      description: readText(record.description, 300),
      required,
      selection,
      minSelections,
      maxSelections,
      options,
    });
  }

  return { ok: true, groups };
}

function readText(value: unknown, maxLength: number): string {
  const text =
    typeof value === "string"
      ? value
      : typeof value === "number"
        ? String(value)
        : "";

  return text.trim().slice(0, maxLength);
}

function parseGhs(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const numeric =
    typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));

  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100000) {
    return null;
  }

  return Math.round(numeric * 100);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "eden-bites-meal"
  );
}
