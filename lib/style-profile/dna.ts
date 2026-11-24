import { labelFor } from "@/lib/style-profile/options";
import {
  BUDGET_BANDS,
  CLIMATES,
  COLOR_OPTIONS,
  FASHION_CATEGORIES,
  FIT_PREFERENCES,
  GROOMING_PREFERENCES,
  LIFESTYLES,
  PREFERRED_STYLES,
} from "@/lib/style-profile/options";

export type DnaSeedInput = {
  fashion_categories: string[];
  preferred_styles: string[];
  budget_band: string | null;
  climate: string | null;
  lifestyle: string | null;
  favorite_colors: string[];
  disliked_colors: string[];
  fit_preferences: string[];
  goals: string | null;
  grooming_preferences: string[];
};

export type DnaSeedFields = {
  summary: string;
  goals: string | null;
  palette_notes: string | null;
  fit_notes: string | null;
  grooming_notes: string | null;
  shopping_notes: string | null;
};

function joinLabels(
  options: readonly { value: string; label: string }[],
  values: string[],
) {
  return values.map((value) => labelFor(options, value)).join(", ");
}

/** Build DNA narrative fields from structured answers. Never invents AI claims. */
export function buildDnaSeed(input: DnaSeedInput): DnaSeedFields {
  const categories = joinLabels(FASHION_CATEGORIES, input.fashion_categories);
  const styles = joinLabels(PREFERRED_STYLES, input.preferred_styles);
  const budget = input.budget_band
    ? labelFor(BUDGET_BANDS, input.budget_band)
    : null;
  const climate = input.climate ? labelFor(CLIMATES, input.climate) : null;
  const lifestyle = input.lifestyle
    ? labelFor(LIFESTYLES, input.lifestyle)
    : null;

  const summaryParts = [
    categories ? `You lean toward ${categories}` : null,
    styles ? `with a ${styles} feel` : null,
    lifestyle ? `for a ${lifestyle.toLowerCase()} life` : null,
    climate ? `in a ${climate.toLowerCase()} climate` : null,
  ].filter(Boolean);

  const summary =
    summaryParts.length > 0
      ? `${summaryParts.join(" ")}. Based on your answers — edit anytime.`
      : "Your Style DNA will fill in as you add preferences.";

  const palette_notes =
    input.favorite_colors.length > 0 || input.disliked_colors.length > 0
      ? [
          input.favorite_colors.length
            ? `Favorites: ${joinLabels(COLOR_OPTIONS, input.favorite_colors)}.`
            : null,
          input.disliked_colors.length
            ? `Avoid: ${joinLabels(COLOR_OPTIONS, input.disliked_colors)}.`
            : null,
        ]
          .filter(Boolean)
          .join(" ")
      : null;

  const fit_notes = input.fit_preferences.length
    ? `Preferred fits: ${joinLabels(FIT_PREFERENCES, input.fit_preferences)}.`
    : null;

  const grooming_notes = input.grooming_preferences.length
    ? `Grooming focus: ${joinLabels(GROOMING_PREFERENCES, input.grooming_preferences)}.`
    : null;

  const shopping_notes = budget
    ? `Budget orientation: ${budget}. Recommendations should respect this band.`
    : null;

  return {
    summary,
    goals: input.goals,
    palette_notes,
    fit_notes,
    grooming_notes,
    shopping_notes,
  };
}

type DnaExisting = {
  [K in keyof DnaSeedFields]?: string | null;
};

/** Merge a seed into existing DNA notes without overwriting user-edited text. */
export function mergeDnaSeed(
  existing: DnaExisting,
  seed: DnaSeedFields,
): DnaSeedFields {
  return {
    summary: existing.summary?.trim() ? existing.summary : seed.summary,
    goals: existing.goals?.trim() ? existing.goals : seed.goals,
    palette_notes: existing.palette_notes?.trim()
      ? existing.palette_notes
      : seed.palette_notes,
    fit_notes: existing.fit_notes?.trim() ? existing.fit_notes : seed.fit_notes,
    grooming_notes: existing.grooming_notes?.trim()
      ? existing.grooming_notes
      : seed.grooming_notes,
    shopping_notes: existing.shopping_notes?.trim()
      ? existing.shopping_notes
      : seed.shopping_notes,
  };
}
