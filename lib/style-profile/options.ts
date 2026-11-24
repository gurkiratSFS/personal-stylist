export const FASHION_CATEGORIES = [
  { value: "menswear", label: "Menswear" },
  { value: "womenswear", label: "Womenswear" },
  { value: "unisex", label: "Unisex" },
  { value: "streetwear", label: "Streetwear" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "ethnic_traditional", label: "Ethnic / traditional" },
  { value: "athletic", label: "Athletic" },
] as const;

export const PREFERRED_STYLES = [
  { value: "classic", label: "Classic" },
  { value: "minimal", label: "Minimal" },
  { value: "smart_casual", label: "Smart casual" },
  { value: "street", label: "Street" },
  { value: "boho", label: "Boho" },
  { value: "preppy", label: "Preppy" },
  { value: "avant_garde", label: "Avant-garde" },
  { value: "workwear", label: "Workwear" },
  { value: "romantic", label: "Romantic" },
  { value: "utilitarian", label: "Utilitarian" },
] as const;

export const BUDGET_BANDS = [
  { value: "value", label: "Value", description: "Smart finds and lasting basics" },
  { value: "mid", label: "Mid-range", description: "Balanced quality and price" },
  { value: "premium", label: "Premium", description: "Elevated materials and cuts" },
  { value: "luxury", label: "Luxury", description: "Investment pieces" },
  { value: "flexible", label: "Flexible", description: "Depends on the occasion" },
] as const;

export const CLIMATES = [
  { value: "tropical", label: "Tropical / humid" },
  { value: "hot_dry", label: "Hot and dry" },
  { value: "temperate", label: "Temperate" },
  { value: "cold", label: "Cold / winter-heavy" },
  { value: "variable", label: "Highly variable" },
] as const;

export const LIFESTYLES = [
  { value: "office", label: "Office / professional" },
  { value: "campus", label: "Campus / student" },
  { value: "creative", label: "Creative field" },
  { value: "remote", label: "Remote / hybrid" },
  { value: "social", label: "Social / events" },
  { value: "active", label: "Active / outdoor" },
  { value: "home", label: "Home-centered" },
] as const;

export const COLOR_OPTIONS = [
  { value: "black", label: "Black", swatch: "#111111" },
  { value: "white", label: "White", swatch: "#f5f5f5" },
  { value: "navy", label: "Navy", swatch: "#1e3a5f" },
  { value: "beige", label: "Beige", swatch: "#d8c3a5" },
  { value: "olive", label: "Olive", swatch: "#6b705c" },
  { value: "burgundy", label: "Burgundy", swatch: "#6b2d3c" },
  { value: "camel", label: "Camel", swatch: "#c19a6b" },
  { value: "grey", label: "Grey", swatch: "#8a8a8a" },
  { value: "denim", label: "Denim blue", swatch: "#4a6fa5" },
  { value: "pastel", label: "Pastels", swatch: "#c9b8d9" },
  { value: "bright", label: "Bright accents", swatch: "#e85d4c" },
  { value: "earth", label: "Earth tones", swatch: "#8d6e4c" },
] as const;

export const FIT_PREFERENCES = [
  { value: "slim", label: "Slim" },
  { value: "tailored", label: "Tailored" },
  { value: "relaxed", label: "Relaxed" },
  { value: "oversized", label: "Oversized" },
  { value: "structured", label: "Structured" },
  { value: "soft", label: "Soft / fluid" },
] as const;

export const AGE_RANGES = [
  { value: "under_18", label: "Under 18" },
  { value: "18_24", label: "18–24" },
  { value: "25_34", label: "25–34" },
  { value: "35_44", label: "35–44" },
  { value: "45_54", label: "45–54" },
  { value: "55_plus", label: "55+" },
  { value: "prefer_not", label: "Prefer not to say" },
] as const;

export const GENDER_PRESENTATIONS = [
  { value: "masculine", label: "Masculine-leaning" },
  { value: "feminine", label: "Feminine-leaning" },
  { value: "androgynous", label: "Androgynous" },
  { value: "fluid", label: "Fluid / mixed" },
  { value: "prefer_not", label: "Prefer not to say" },
] as const;

export const HAIR_TYPES = [
  { value: "straight", label: "Straight" },
  { value: "wavy", label: "Wavy" },
  { value: "curly", label: "Curly" },
  { value: "coily", label: "Coily" },
  { value: "shaved", label: "Shaved / buzzed" },
  { value: "other", label: "Other / varies" },
] as const;

export const HAIRSTYLE_PREFERENCES = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
  { value: "layered", label: "Layered" },
  { value: "fade", label: "Fade / taper" },
  { value: "low_maintenance", label: "Low maintenance" },
] as const;

export const GROOMING_PREFERENCES = [
  { value: "clean_shave", label: "Clean shave" },
  { value: "stubble", label: "Stubble" },
  { value: "beard", label: "Beard" },
  { value: "brows", label: "Brow care" },
  { value: "skincare_light", label: "Light skincare" },
  { value: "skincare_detailed", label: "Detailed skincare" },
  { value: "none", label: "Keep it simple" },
] as const;

export const UNDERTONE_PREFERENCES = [
  { value: "cool", label: "Cool" },
  { value: "warm", label: "Warm" },
  { value: "neutral", label: "Neutral" },
  { value: "unsure", label: "Not sure" },
] as const;

export const PHOTO_TYPES = [
  { value: "face", label: "Face" },
  { value: "full_body", label: "Full body" },
  { value: "other", label: "Other" },
] as const;

export type OptionValue<T extends readonly { value: string }[]> = T[number]["value"];

export function optionValues<T extends readonly { value: string }[]>(options: T) {
  return options.map((option) => option.value) as OptionValue<T>[];
}

export function labelFor(
  options: readonly { value: string; label: string }[],
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}
