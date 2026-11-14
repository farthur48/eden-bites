import "server-only";

import { hasPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  Product,
  ProductOption,
  ProductOptionGroup,
} from "@/types/database";

export type AdminOptionGroup = ProductOptionGroup & {
  options: ProductOption[];
};

export type AdminMenuProduct = Product & {
  groups: AdminOptionGroup[];
};

export type MenuProductInput = {
  id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  pricePesewas: number;
  imageUrl: string;
  imageAlt: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  serves: string;
  prepMinutes: number;
  tags: string[];
  allergenNote: string;
  optionGroups: Array<{
    name: string;
    description: string;
    required: boolean;
    selection: "single" | "multiple";
    minSelections: number;
    maxSelections: number;
    options: Array<{
      name: string;
      description: string;
      pricePesewas: number;
      isAvailable: boolean;
    }>;
  }>;
};

export async function getAdminMenuProducts(): Promise<{
  status: "ready" | "setup" | "error";
  products: AdminMenuProduct[];
}> {
  if (!hasPublicEnv()) {
    return { status: "setup", products: [] };
  }

  try {
    const supabase = await createClient();
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return { status: "error", products: [] };
    }

    const rows = products ?? [];

    if (rows.length === 0) {
      return { status: "ready", products: [] };
    }

    const ids = rows.map((product) => product.id);
    const { data: groups, error: groupsError } = await supabase
      .from("product_option_groups")
      .select("*")
      .in("product_id", ids)
      .order("sort_order", { ascending: true });

    if (groupsError) {
      return { status: "error", products: [] };
    }

    const groupRows = groups ?? [];
    const groupIds = groupRows.map((group) => group.id);
    let optionRows: ProductOption[] = [];

    if (groupIds.length > 0) {
      const { data: options, error: optionsError } = await supabase
        .from("product_options")
        .select("*")
        .in("group_id", groupIds)
        .order("sort_order", { ascending: true });

      if (optionsError) {
        return { status: "error", products: [] };
      }

      optionRows = options ?? [];
    }

    return {
      status: "ready",
      products: rows.map((product) =>
        withGroups(product, groupRows, optionRows),
      ),
    };
  } catch {
    return { status: "error", products: [] };
  }
}

export async function getAdminMenuProduct(
  id: string,
): Promise<AdminMenuProduct | null> {
  if (!hasPublicEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !product) {
      return null;
    }

    const { data: groups } = await supabase
      .from("product_option_groups")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true });

    const groupRows = groups ?? [];
    const groupIds = groupRows.map((group) => group.id);
    let optionRows: ProductOption[] = [];

    if (groupIds.length > 0) {
      const { data: options } = await supabase
        .from("product_options")
        .select("*")
        .in("group_id", groupIds)
        .order("sort_order", { ascending: true });

      optionRows = options ?? [];
    }

    return withGroups(product, groupRows, optionRows);
  } catch {
    return null;
  }
}

export async function saveMenuProduct(
  input: MenuProductInput,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  if (!hasPublicEnv()) {
    return { ok: false, message: "Supabase is not configured." };
  }

  try {
    const supabase = await createClient();
    const payload = {
      name: input.name,
      slug: input.slug,
      tagline: input.tagline,
      description: input.description,
      price_pesewas: input.pricePesewas,
      image_url: input.imageUrl || null,
      image_alt: input.imageAlt || null,
      is_active: input.isActive,
      is_featured: input.isFeatured,
      sort_order: input.sortOrder,
      serves: input.serves,
      prep_minutes: input.prepMinutes,
      tags: input.tags,
      allergen_note: input.allergenNote,
    };

    let productId = input.id;

    if (productId) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", productId);

      if (error) {
        return { ok: false, message: friendlyError(error.code) };
      }

      const { error: deleteError } = await supabase
        .from("product_option_groups")
        .delete()
        .eq("product_id", productId);

      if (deleteError) {
        return { ok: false, message: "Could not update the meal options." };
      }
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();

      if (error || !data) {
        return { ok: false, message: friendlyError(error?.code) };
      }

      productId = data.id;
    }

    for (let groupIndex = 0; groupIndex < input.optionGroups.length; groupIndex += 1) {
      const group = input.optionGroups[groupIndex];
      const { data: groupRow, error: groupError } = await supabase
        .from("product_option_groups")
        .insert({
          product_id: productId,
          name: group.name,
          description: group.description || null,
          is_required: group.required,
          selection_type: group.selection,
          min_selections: group.minSelections,
          max_selections: group.maxSelections,
          sort_order: groupIndex,
        })
        .select("id")
        .single();

      if (groupError || !groupRow) {
        return { ok: false, message: "Could not save the meal options." };
      }

      if (group.options.length > 0) {
        const { error: optionsError } = await supabase
          .from("product_options")
          .insert(
            group.options.map((option, optionIndex) => ({
              group_id: groupRow.id,
              name: option.name,
              description: option.description || null,
              price_pesewas: option.pricePesewas,
              is_available: option.isAvailable,
              sort_order: optionIndex,
            })),
          );

        if (optionsError) {
          return { ok: false, message: "Could not save the option choices." };
        }
      }
    }

    return { ok: true, id: productId };
  } catch {
    return { ok: false, message: "Could not save this meal. Please try again." };
  }
}

export async function toggleProductActive(
  id: string,
  isActive: boolean,
): Promise<{ ok: boolean; message?: string }> {
  if (!hasPublicEnv()) {
    return { ok: false, message: "Supabase is not configured." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("products")
      .update({ is_active: isActive })
      .eq("id", id);

    return error
      ? { ok: false, message: "Could not update meal availability." }
      : { ok: true };
  } catch {
    return { ok: false, message: "Could not update meal availability." };
  }
}

export async function uploadMenuImage(
  file: File,
  folder: "products" | "brand",
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  if (!hasPublicEnv()) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const bucket = "product-images";
  const allowedTypes =
    folder === "brand"
      ? ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"]
      : ["image/jpeg", "image/png", "image/webp", "image/avif"];

  if (!allowedTypes.includes(file.type)) {
    return {
      ok: false,
      message:
        folder === "brand"
          ? "Use a JPG, PNG, WebP, AVIF or SVG logo."
          : "Use a JPG, PNG, WebP or AVIF image.",
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, message: "Images must be 5 MB or smaller." };
  }

  try {
    const supabase = await createClient();
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      return { ok: false, message: "Could not upload the image." };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  } catch {
    return { ok: false, message: "Could not upload the image." };
  }
}

function withGroups(
  product: Product,
  groups: ProductOptionGroup[],
  options: ProductOption[],
): AdminMenuProduct {
  return {
    ...product,
    groups: groups
      .filter((group) => group.product_id === product.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((group) => ({
        ...group,
        options: options
          .filter((option) => option.group_id === group.id)
          .sort((a, b) => a.sort_order - b.sort_order),
      })),
  };
}

function friendlyError(code: string | undefined): string {
  if (code === "23505") {
    return "That meal URL slug is already in use. Choose a different slug.";
  }

  return "Could not save this meal. Please try again.";
}
