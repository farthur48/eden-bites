import type { MenuProduct } from "@/lib/menu/types";

const spiceOptions = [
  {
    id: "spice-mild",
    name: "Mild",
    description: "Gentle heat, with the pepper served on the side.",
    pricePesewas: 0,
  },
  {
    id: "spice-medium",
    name: "Medium",
    description: "A balanced kick that lets the fish shine.",
    pricePesewas: 0,
  },
  {
    id: "spice-hot",
    name: "Hot",
    description: "Full Ghanaian heat, made for pepper lovers.",
    pricePesewas: 0,
  },
] as const;

export const menuProducts: MenuProduct[] = [
  {
    id: "banku-tilapia",
    slug: "banku-and-tilapia",
    name: "Banku & Tilapia",
    tagline: "Fermented maize, charcoal-grilled tilapia, fresh pepper.",
    description:
      "Two soft, tangy balls of banku served with a whole charcoal-grilled tilapia and a bright onion, tomato and pepper relish. A proper Ghanaian plate, cooked to order and packed hot.",
    pricePesewas: 8500,
    imageUrl: "/menu/banku-tilapia.jpg",
    imageAlt:
      "Banku and charcoal-grilled tilapia topped with onion and pepper relish",
    isFeatured: true,
    isAvailable: true,
    prepMinutes: 25,
    serves: "1–2",
    tags: ["Charcoal grilled", "Made to order", "House favourite"],
    allergenNote:
      "Contains fish. Prepared in a kitchen that also handles shellfish, peanuts and gluten.",
    optionGroups: [
      {
        id: "spice",
        name: "Choose your heat",
        description: "We keep the pepper sauce on the side where possible.",
        required: true,
        selection: "single",
        minSelections: 1,
        maxSelections: 1,
        defaultOptionId: "spice-medium",
        options: [...spiceOptions],
      },
      {
        id: "extras",
        name: "Make it bigger",
        description: "Optional extras, added to the same plate.",
        required: false,
        selection: "multiple",
        minSelections: 0,
        maxSelections: 4,
        options: [
          {
            id: "extra-banku",
            name: "Extra banku",
            description: "One more soft banku ball.",
            pricePesewas: 1000,
          },
          {
            id: "extra-tilapia",
            name: "Extra tilapia",
            description: "A second whole grilled tilapia.",
            pricePesewas: 3500,
          },
          {
            id: "extra-pepper",
            name: "Extra pepper relish",
            description: "More onion, tomato and fresh pepper.",
            pricePesewas: 500,
          },
          {
            id: "extra-shito",
            name: "Extra shito",
            description: "A small pot of savoury black pepper sauce.",
            pricePesewas: 500,
          },
        ],
      },
    ],
  },
  {
    id: "acheke-tilapia",
    slug: "acheke-and-tilapia",
    name: "Acheke & Tilapia",
    tagline: "Tangy cassava couscous with grilled tilapia and fresh relish.",
    description:
      "Fluffy, slightly tangy acheke piled beside a whole charcoal-grilled tilapia, finished with a crisp onion, tomato and pepper relish. Bright, generous and made for sharing.",
    pricePesewas: 8000,
    imageUrl: "/menu/acheke-tilapia.jpg",
    imageAlt:
      "Charcoal-grilled tilapia covered in fresh onion and tomato relish, served with acheke",
    isFeatured: false,
    isAvailable: true,
    prepMinutes: 20,
    serves: "1–2",
    tags: ["Charcoal grilled", "Tangy & bright", "Made to order"],
    allergenNote:
      "Contains fish. Prepared in a kitchen that also handles shellfish, peanuts and gluten.",
    optionGroups: [
      {
        id: "spice",
        name: "Choose your heat",
        description: "We keep the pepper sauce on the side where possible.",
        required: true,
        selection: "single",
        minSelections: 1,
        maxSelections: 1,
        defaultOptionId: "spice-medium",
        options: [...spiceOptions],
      },
      {
        id: "extras",
        name: "Make it bigger",
        description: "Optional extras, added to the same plate.",
        required: false,
        selection: "multiple",
        minSelections: 0,
        maxSelections: 4,
        options: [
          {
            id: "extra-acheke",
            name: "Extra acheke",
            description: "A generous extra portion of acheke.",
            pricePesewas: 800,
          },
          {
            id: "extra-tilapia",
            name: "Extra tilapia",
            description: "A second whole grilled tilapia.",
            pricePesewas: 3500,
          },
          {
            id: "extra-pepper",
            name: "Extra pepper relish",
            description: "More onion, tomato and fresh pepper.",
            pricePesewas: 500,
          },
          {
            id: "extra-plantain",
            name: "Add fried plantain",
            description: "Sweet, golden plantain on the side.",
            pricePesewas: 1000,
          },
        ],
      },
    ],
  },
];
