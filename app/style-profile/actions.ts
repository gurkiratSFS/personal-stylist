"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import {
  completeStyleEssentialsForUser,
  skipOnboardingForUser,
  updateAppearanceForUser,
  updateStyleDnaForUser,
  updateStylePreferencesForUser,
} from "@/lib/style-profile/service";
import {
  appearanceUpdateSchema,
  styleDnaSchema,
  styleEssentialsSchema,
  stylePreferencesSchema,
} from "@/lib/style-profile/schemas";

export type StyleActionState = {
  error: string | null;
  message: string | null;
};

function parseCsv(value: FormDataEntryValue | null) {
  const raw = String(value ?? "");
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export async function saveStylePreferences(
  _prev: StyleActionState,
  formData: FormData,
): Promise<StyleActionState> {
  const user = await requireUser();
  const parsed = stylePreferencesSchema.safeParse({
    fashion_categories: parseCsv(formData.get("fashion_categories")),
    preferred_styles: parseCsv(formData.get("preferred_styles")),
    budget_band: String(formData.get("budget_band") || "") || null,
    climate: String(formData.get("climate") || "") || null,
    lifestyle: String(formData.get("lifestyle") || "") || null,
    favorite_colors: parseCsv(formData.get("favorite_colors")),
    disliked_colors: parseCsv(formData.get("disliked_colors")),
    fit_preferences: parseCsv(formData.get("fit_preferences")),
  });

  if (!parsed.success) {
    return { error: "Check your style preferences and try again.", message: null };
  }

  try {
    await updateStylePreferencesForUser(user.id, user.id, parsed.data);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save style preferences.",
      message: null,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/onboarding");
  return { error: null, message: "Style preferences saved." };
}

export async function saveStyleDna(
  _prev: StyleActionState,
  formData: FormData,
): Promise<StyleActionState> {
  const user = await requireUser();
  const parsed = styleDnaSchema.safeParse({
    summary: String(formData.get("summary") ?? ""),
    goals: String(formData.get("goals") ?? ""),
    palette_notes: String(formData.get("palette_notes") ?? ""),
    fit_notes: String(formData.get("fit_notes") ?? ""),
    grooming_notes: String(formData.get("grooming_notes") ?? ""),
    shopping_notes: String(formData.get("shopping_notes") ?? ""),
  });

  if (!parsed.success) {
    return { error: "Check your Style DNA notes and try again.", message: null };
  }

  try {
    await updateStyleDnaForUser(user.id, user.id, parsed.data);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save Style DNA.",
      message: null,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  return { error: null, message: "Style DNA updated." };
}

export async function saveAppearance(
  _prev: StyleActionState,
  formData: FormData,
): Promise<StyleActionState> {
  const user = await requireUser();
  const heightRaw = String(formData.get("height_cm") ?? "").trim();
  const parsed = appearanceUpdateSchema.safeParse({
    age_range: String(formData.get("age_range") || "") || null,
    gender_presentation: String(formData.get("gender_presentation") || "") || null,
    height_cm: heightRaw,
    proportion_notes: String(formData.get("proportion_notes") ?? ""),
    hair_type: String(formData.get("hair_type") || "") || null,
    preferred_hairstyles: parseCsv(formData.get("preferred_hairstyles")),
    grooming_preferences: parseCsv(formData.get("grooming_preferences")),
    skin_undertone_preference:
      String(formData.get("skin_undertone_preference") || "") || null,
  });

  if (!parsed.success) {
    return {
      error: "Check appearance fields. Height must be between 100 and 250 cm if set.",
      message: null,
    };
  }

  try {
    await updateAppearanceForUser(user.id, user.id, parsed.data);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save appearance.",
      message: null,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/onboarding");
  return { error: null, message: "Appearance preferences saved." };
}

export async function completeOnboarding(
  _prev: StyleActionState,
  formData: FormData,
): Promise<StyleActionState> {
  const user = await requireUser();
  const parsed = styleEssentialsSchema.safeParse({
    fashion_categories: parseCsv(formData.get("fashion_categories")),
    preferred_styles: parseCsv(formData.get("preferred_styles")),
    budget_band: String(formData.get("budget_band") ?? ""),
    climate: String(formData.get("climate") ?? ""),
    lifestyle: String(formData.get("lifestyle") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: "Choose at least one category, one style, plus budget, climate, and lifestyle.",
      message: null,
    };
  }

  try {
    await completeStyleEssentialsForUser(user.id, user.id, {
      ...parsed.data,
      favorite_colors: parseCsv(formData.get("favorite_colors")),
      disliked_colors: parseCsv(formData.get("disliked_colors")),
      fit_preferences: parseCsv(formData.get("fit_preferences")),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not complete onboarding.",
      message: null,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/onboarding");
  redirect("/home");
}

export async function skipOnboarding(): Promise<void> {
  const user = await requireUser();
  await skipOnboardingForUser(user.id, user.id);
  revalidatePath("/home");
  revalidatePath("/profile");
  redirect("/home");
}
