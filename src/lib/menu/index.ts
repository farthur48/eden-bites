import { menuProducts } from "@/lib/menu/fixture";
import type {
  MenuOption,
  MenuOptionGroup,
  MenuProduct,
  SelectedMenuOption,
} from "@/lib/menu/types";

export function getAvailableMenuProducts(): MenuProduct[] {
  return menuProducts.filter(
    (product) => product.isAvailable && product.optionGroups.length > 0,
  );
}

export function getMenuProductById(id: string): MenuProduct | undefined {
  return menuProducts.find((product) => product.id === id);
}

export function findMenuOption(
  group: MenuOptionGroup,
  optionId: string,
): MenuOption | undefined {
  return group.options.find((option) => option.id === optionId);
}

export function getSelectedOptions(
  product: MenuProduct,
  selectedOptionIds: string[],
): SelectedMenuOption[] {
  const selected = new Set(selectedOptionIds);

  return product.optionGroups.flatMap((group) =>
    group.options
      .filter((option) => selected.has(option.id))
      .map((option) => ({
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        pricePesewas: option.pricePesewas,
      })),
  );
}

export function getSelectedOptionIdsForGroup(
  product: MenuProduct,
  selectedOptionIds: string[],
  groupId: string,
): string[] {
  const group = product.optionGroups.find((item) => item.id === groupId);

  if (!group) {
    return [];
  }

  const selected = new Set(selectedOptionIds);
  return group.options
    .filter((option) => selected.has(option.id))
    .map((option) => option.id);
}

export function getProductOptionSummary(
  product: MenuProduct,
  selectedOptionIds: string[],
): string {
  return getSelectedOptions(product, selectedOptionIds)
    .map((option) => option.optionName)
    .join(" · ");
}
