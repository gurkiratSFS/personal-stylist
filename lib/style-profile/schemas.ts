import { z } from "zod";

import {
  AGE_RANGES,
  BUDGET_BANDS,
  CLIMATES,
  COLOR_OPTIONS,
  FASHION_CATEGORIES,
  FIT_PREFERENCES,
  GENDER_PRESENTATIONS,
  GROOMING_PREFERENCES,
  HAIR_TYPES,
  HAIRSTYLE_PREFERENCES,
  LIFESTYLES,
  PREFERRED_STYLES,
  UNDERTONE_PREFERENCES,
  optionValues,
} from "@/lib/style-profile/options";

const fashionCategory = z.enum(
  optionValues(FASHION_CATEGORIES) as [string, ...string[]],
);
const preferredStyle = z.enum(
  optionValues(PREFERRED_STYLES) as [string, ...string[]],
);
const budgetBand = z.enum(optionValues(BUDGET_BANDS) as [string, ...string[]]);
const climate = z.enum(optionValues(CLIMATES) as [string, ...string[]]);
const lifestyle = z.enum(optionValues(LIFESTYLES) as [string, ...string[]]);
const color = z.enum(optionValues(COLOR_OPTIONS) as [string, ...string[]]);
const fit = z.enum(optionValues(FIT_PREFERENCES) as [string, ...string[]]);
const ageRange = z.enum(optionValues(AGE_RANGES) as [string, ...string[]]);
const genderPresentation = z.enum(
  optionValues(GENDER_PRESENTATIONS) as [string, ...string[]],
);
const hairType = z.enum(optionValues(HAIR_TYPES) as [string, ...string[]]);
const hairstyle = z.enum(
  optionValues(HAIRSTYLE_PREFERENCES) as [string, ...string[]],
);
const grooming = z.enum(
  optionValues(GROOMING_PREFERENCES) as [string, ...string[]],
);
const undertone = z.enum(
  optionValues(UNDERTONE_PREFERENCES) as [string, ...string[]],
);

/** Accepts string | null | undefined; empty becomes null for Postgres text columns. */
const optionalText = z.preprocess(
  (value) => (value == null ? "" : value),
  z
    .string()
    .trim()
    .max(2000)
    .transform((value) => (value.length > 0 ? value : null)),
);

export const styleEssentialsSchema = z.object({
  fashion_categories: z.array(fashionCategory).min(1),
  preferred_styles: z.array(preferredStyle).min(1),
  budget_band: budgetBand,
  climate,
  lifestyle,
});

export const stylePreferencesSchema = z.object({
  fashion_categories: z.array(fashionCategory).default([]),
  preferred_styles: z.array(preferredStyle).default([]),
  budget_band: budgetBand.nullable().optional(),
  climate: climate.nullable().optional(),
  lifestyle: lifestyle.nullable().optional(),
  favorite_colors: z.array(color).default([]),
  disliked_colors: z.array(color).default([]),
  fit_preferences: z.array(fit).default([]),
});

export const styleDnaSchema = z.object({
  summary: optionalText,
  goals: optionalText,
  palette_notes: optionalText,
  fit_notes: optionalText,
  grooming_notes: optionalText,
  shopping_notes: optionalText,
});

export const appearanceUpdateSchema = z.object({
  age_range: ageRange.nullable().optional(),
  gender_presentation: genderPresentation.nullable().optional(),
  height_cm: z.preprocess(
    (value) => {
      if (value === "" || value === undefined || value === null) return null;
      const number = typeof value === "number" ? value : Number(value);
      return Number.isFinite(number) ? number : null;
    },
    z.number().int().min(100).max(250).nullable(),
  ),
  proportion_notes: optionalText,
  hair_type: hairType.nullable().optional(),
  preferred_hairstyles: z.array(hairstyle).default([]),
  grooming_preferences: z.array(grooming).default([]),
  skin_undertone_preference: undertone.nullable().optional(),
});

export type StyleEssentials = z.infer<typeof styleEssentialsSchema>;
export type StylePreferences = z.infer<typeof stylePreferencesSchema>;
export type StyleDna = z.infer<typeof styleDnaSchema>;
export type AppearanceUpdate = z.infer<typeof appearanceUpdateSchema>;

export function hasStyleEssentials(input: {
  fashion_categories: string[];
  preferred_styles: string[];
  budget_band: string | null;
  climate: string | null;
  lifestyle: string | null;
}) {
  return styleEssentialsSchema.safeParse({
    fashion_categories: input.fashion_categories,
    preferred_styles: input.preferred_styles,
    budget_band: input.budget_band,
    climate: input.climate,
    lifestyle: input.lifestyle,
  }).success;
}
