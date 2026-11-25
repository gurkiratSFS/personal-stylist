export const WARDROBE_CATEGORIES = [
  { value: "tops", label: "Tops" },
  { value: "shirts", label: "Shirts" },
  { value: "t_shirts", label: "T-shirts" },
  { value: "trousers", label: "Trousers" },
  { value: "jeans", label: "Jeans" },
  { value: "dresses", label: "Dresses" },
  { value: "jackets", label: "Jackets" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
  { value: "other", label: "Other" },
] as const;

export const WARDROBE_CATEGORY_VALUES = WARDROBE_CATEGORIES.map((c) => c.value);

export const WARDROBE_OCCASIONS = [
  { value: "casual", label: "Casual" },
  { value: "smart_casual", label: "Smart casual" },
  { value: "business", label: "Business" },
  { value: "formal", label: "Formal" },
  { value: "date", label: "Date" },
  { value: "party", label: "Party" },
  { value: "athletic", label: "Athletic" },
  { value: "travel", label: "Travel" },
  { value: "other", label: "Other" },
] as const;

export const MIN_ITEMS_FOR_GENERATE = 3;
export const MAX_GENERATE_COUNT = 5;
export const MAX_CATALOG_ITEMS = 80;
export const MAX_BATCH_UPLOAD = 10;

/** Exclusive outfit slots — one piece per slot (accessories allow several). */
export const WARDROBE_SLOT_BY_CATEGORY: Record<string, string> = {
  tops: "upper",
  shirts: "upper",
  t_shirts: "upper",
  trousers: "lower",
  jeans: "lower",
  dresses: "dress",
  jackets: "outer",
  shoes: "footwear",
  accessories: "accessory",
  other: "other",
};

export const WARDROBE_SLOTS_ALLOW_MULTIPLE = new Set(["accessory"]);

export function slotForCategory(category: string | null | undefined) {
  if (!category) return "unknown";
  return WARDROBE_SLOT_BY_CATEGORY[category] ?? "unknown";
}

/** Dress occupies the body and conflicts with separate upper/lower pieces. */
export function slotsConflict(slotA: string, slotB: string) {
  if (slotA === slotB && !WARDROBE_SLOTS_ALLOW_MULTIPLE.has(slotA)) {
    return true;
  }
  if (slotA === "dress" && (slotB === "upper" || slotB === "lower")) return true;
  if (slotB === "dress" && (slotA === "upper" || slotA === "lower")) return true;
  return false;
}

export function optionValues<T extends readonly { value: string }[]>(
  options: T,
): T[number]["value"][] {
  return options.map((option) => option.value);
}

export function labelFor(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined,
) {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? value;
}
