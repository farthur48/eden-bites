export type MenuOption = {
  id: string;
  name: string;
  description?: string;
  pricePesewas: number;
};

export type MenuOptionGroup = {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  selection: "single" | "multiple";
  minSelections: number;
  maxSelections: number;
  defaultOptionId?: string;
  options: MenuOption[];
};

export type MenuProduct = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  pricePesewas: number;
  imageUrl: string;
  imageAlt: string;
  isFeatured: boolean;
  isAvailable: boolean;
  prepMinutes: number;
  serves: string;
  tags: string[];
  allergenNote: string;
  optionGroups: MenuOptionGroup[];
};

export type SelectedMenuOption = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  pricePesewas: number;
};
