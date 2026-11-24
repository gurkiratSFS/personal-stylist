import {
  canAccessAppearanceProfile,
  canAccessStyleProfile,
} from "@/lib/style-profile/access";
import { buildDnaSeed, mergeDnaSeed } from "@/lib/style-profile/dna";
import {
  appearanceUpdateSchema,
  hasStyleEssentials,
  styleDnaSchema,
  styleEssentialsSchema,
  stylePreferencesSchema,
  type AppearanceUpdate,
  type StyleDna,
  type StyleEssentials,
  type StylePreferences,
} from "@/lib/style-profile/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const STYLE_COLUMNS =
  "id, user_id, fashion_categories, preferred_styles, budget_band, climate, lifestyle, favorite_colors, disliked_colors, fit_preferences, goals, palette_notes, fit_notes, grooming_notes, shopping_notes, summary, onboarding_completed_at, onboarding_skipped_at, created_at, updated_at";

const APPEARANCE_COLUMNS =
  "id, user_id, age_range, gender_presentation, height_cm, proportion_notes, hair_type, preferred_hairstyles, grooming_preferences, skin_undertone_preference, created_at, updated_at";

export async function getStyleProfileForUser(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("style_profiles")
    .select(STYLE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAppearanceProfileForUser(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("appearance_profiles")
    .select(APPEARANCE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export function isOnboardingEssentialsComplete(
  style: Awaited<ReturnType<typeof getStyleProfileForUser>>,
) {
  if (!style) return false;
  if (style.onboarding_completed_at) return true;
  return hasStyleEssentials(style);
}

async function seedDnaIfEmpty(
  viewerId: string,
  style: NonNullable<Awaited<ReturnType<typeof getStyleProfileForUser>>>,
  appearanceGrooming: string[] = [],
) {
  const seed = buildDnaSeed({
    fashion_categories: style.fashion_categories,
    preferred_styles: style.preferred_styles,
    budget_band: style.budget_band,
    climate: style.climate,
    lifestyle: style.lifestyle,
    favorite_colors: style.favorite_colors,
    disliked_colors: style.disliked_colors,
    fit_preferences: style.fit_preferences,
    goals: style.goals,
    grooming_preferences: appearanceGrooming,
  });

  const merged = mergeDnaSeed(
    {
      summary: style.summary,
      goals: style.goals,
      palette_notes: style.palette_notes,
      fit_notes: style.fit_notes,
      grooming_notes: style.grooming_notes,
      shopping_notes: style.shopping_notes,
    },
    seed,
  );

  return updateStyleDnaForUser(viewerId, style.user_id, merged);
}

export async function updateStylePreferencesForUser(
  viewerId: string,
  ownerId: string,
  input: StylePreferences,
) {
  if (!canAccessStyleProfile(viewerId, ownerId)) {
    throw new Error("You can only update your own style profile.");
  }

  const values = stylePreferencesSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("style_profiles")
    .update(values)
    .eq("user_id", ownerId)
    .select(STYLE_COLUMNS)
    .single();

  if (error) throw new Error(error.message);

  const appearance = await getAppearanceProfileForUser(ownerId);
  await seedDnaIfEmpty(
    viewerId,
    data,
    appearance?.grooming_preferences ?? [],
  );

  return getStyleProfileForUser(ownerId);
}

export async function completeStyleEssentialsForUser(
  viewerId: string,
  ownerId: string,
  input: StyleEssentials & Partial<StylePreferences>,
) {
  if (!canAccessStyleProfile(viewerId, ownerId)) {
    throw new Error("You can only update your own style profile.");
  }

  const essentials = styleEssentialsSchema.parse(input);
  const extras = stylePreferencesSchema.parse({
    fashion_categories: essentials.fashion_categories,
    preferred_styles: essentials.preferred_styles,
    budget_band: essentials.budget_band,
    climate: essentials.climate,
    lifestyle: essentials.lifestyle,
    favorite_colors: input.favorite_colors ?? [],
    disliked_colors: input.disliked_colors ?? [],
    fit_preferences: input.fit_preferences ?? [],
  });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("style_profiles")
    .update({
      ...extras,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("user_id", ownerId)
    .select(STYLE_COLUMNS)
    .single();

  if (error) throw new Error(error.message);

  const appearance = await getAppearanceProfileForUser(ownerId);
  await seedDnaIfEmpty(
    viewerId,
    data,
    appearance?.grooming_preferences ?? [],
  );

  return getStyleProfileForUser(ownerId);
}

export async function skipOnboardingForUser(viewerId: string, ownerId: string) {
  if (!canAccessStyleProfile(viewerId, ownerId)) {
    throw new Error("You can only update your own style profile.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("style_profiles")
    .update({ onboarding_skipped_at: new Date().toISOString() })
    .eq("user_id", ownerId)
    .select(STYLE_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateStyleDnaForUser(
  viewerId: string,
  ownerId: string,
  input: StyleDna,
) {
  if (!canAccessStyleProfile(viewerId, ownerId)) {
    throw new Error("You can only update your own style profile.");
  }

  const values = styleDnaSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("style_profiles")
    .update(values)
    .eq("user_id", ownerId)
    .select(STYLE_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateAppearanceForUser(
  viewerId: string,
  ownerId: string,
  input: AppearanceUpdate,
) {
  if (!canAccessAppearanceProfile(viewerId, ownerId)) {
    throw new Error("You can only update your own appearance profile.");
  }

  const values = appearanceUpdateSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("appearance_profiles")
    .update(values)
    .eq("user_id", ownerId)
    .select(APPEARANCE_COLUMNS)
    .single();

  if (error) throw new Error(error.message);

  const style = await getStyleProfileForUser(ownerId);
  if (style) {
    await seedDnaIfEmpty(viewerId, style, data.grooming_preferences);
  }

  return data;
}

export async function setOnboardingStepPreference(
  userId: string,
  step: string,
) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      preference_key: "onboarding_step",
      preference_value: { step },
    },
    { onConflict: "user_id,preference_key" },
  );

  if (error) throw new Error(error.message);
}

export async function getOnboardingStepPreference(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_preferences")
    .select("preference_value")
    .eq("user_id", userId)
    .eq("preference_key", "onboarding_step")
    .maybeSingle();

  if (error) throw new Error(error.message);
  const value = data?.preference_value as { step?: string } | null;
  return value?.step ?? null;
}
