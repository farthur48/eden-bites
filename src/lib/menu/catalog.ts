import "server-only";

import { hasPublicEnv } from "@/lib/env";
import { MENU_IMAGE_PLACEHOLDER, resolveImageUrl } from "@/lib/images";
import { menuProducts } from "@/lib/menu/fixture";
import type { MenuProduct } from "@/lib/menu/types";
import { createClient } from "@/lib/supabase/server";
import type {
  Product,
  ProductOption,
  ProductOptionGroup,
} from "@/types/database";

export { MENU_IMAGE_PLACEHOLDER };

export type MenuCatalogResult = {
  status: "ready" | "setup" | "error";
  products: MenuProduct[];
};

export type MenuProductRecord = {
  product: Product;
  groups: ProductOptionGroup[];
  options: ProductOption[];
};

export async function getMenuProducts(
  options: { includeInactive?: boolean } = {},
): Promise<MenuCatalogResult> {
  if (!hasPublicEnv()) {
    const products = menuProducts.filter(
      (product) => options.includeInactive || product.isAvailable,
    );

    return { status: "setup", products };
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!options.includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data: products, error } = await query;

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
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

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
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (optionsError) {
        return { status: "error", products: [] };
      }

      optionRows = options ?? [];
    }

    return {
      status: "ready",
      products: rows.map((product) =>
        mapMenuProduct(product, groupRows, optionRows),
      ),
    };
  } catch {
    return { status: "error", products: [] };
  }
}

export async function getMenuProductRecord(
  productId: string,
): Promise<MenuProductRecord | null> {
  if (!hasPublicEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (error || !product) {
      return null;
    }

    const { data: groups, error: groupsError } = await supabase
      .from("product_option_groups")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true });

    if (groupsError) {
      return null;
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
        return null;
      }

      optionRows = options ?? [];
    }

    return { product, groups: groupRows, options: optionRows };
  } catch {
    return null;
  }
}

export function mapMenuProduct(
  product: Product,
  groups: ProductOptionGroup[],
  options: ProductOption[],
): MenuProduct {
  const productGroups = groups
    .filter((group) => group.product_id === product.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline:
      product.tagline ??
      product.description?.slice(0, 96) ??
      "Freshly prepared at Eden Bites.",
    description:
      product.description ??
      "Freshly prepared by the Eden Bites kitchen.",
    pricePesewas: product.price_pesewas,
    imageUrl: resolveImageUrl(product.image_url),
    imageAlt: product.image_alt || `${product.name} from Eden Bites`,
    isFeatured: product.is_featured,
    isAvailable: product.is_active,
    prepMinutes: product.prep_minutes,
    serves: product.serves,
    tags: product.tags ?? [],
    allergenNote:
      product.allergen_note ??
      "Please contact the kitchen if you have a food allergy.",
    optionGroups: productGroups.map((group) => {
      const groupOptions = options
        .filter((option) => option.group_id === group.id && option.is_available !== false)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option) => ({
          id: option.id,
          name: option.name,
          description: option.description ?? undefined,
          pricePesewas: option.price_pesewas,
        }));

      return {
        id: group.id,
        name: group.name,
        description: group.description ?? undefined,
        required: group.is_required,
        selection: group.selection_type,
        minSelections: group.is_required
          ? Math.max(1, group.min_selections)
          : group.min_selections,
        maxSelections:
          group.selection_type === "single"
            ? 1
            : Math.max(1, group.max_selections),
        defaultOptionId: groupOptions[0]?.id,
        options: groupOptions,
      };
    }),
  };
}
