export const OUTFIT_FEEDBACK_DEPTHS = [
  { value: "casual", label: "Casual", description: "A short, friendly read on the look." },
  { value: "detailed", label: "Detailed", description: "Category-by-category styling notes." },
  { value: "improvement", label: "Improvement", description: "Focus on what to change next." },
] as const;

export const OUTFIT_OCCASIONS = [
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

export const OUTFIT_CATEGORIES = [
  { value: "overall_styling", label: "Overall styling" },
  { value: "color_harmony", label: "Color harmony" },
  { value: "fit", label: "Fit" },
  { value: "occasion_appropriateness", label: "Occasion" },
  { value: "footwear", label: "Footwear" },
  { value: "accessories", label: "Accessories" },
  { value: "styling_balance", label: "Styling balance" },
] as const;

export const OUTFIT_CATEGORY_VALUES = OUTFIT_CATEGORIES.map((c) => c.value);

export const OUTFIT_CONFIDENCE = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

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
