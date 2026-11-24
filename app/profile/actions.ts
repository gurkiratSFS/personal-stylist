"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { profileUpdateSchema } from "@/lib/profile/schemas";
import { updateProfileForUser } from "@/lib/profile/service";

export type ProfileActionState = {
  error: string | null;
  message: string | null;
};

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  const parsed = profileUpdateSchema.safeParse({
    display_name: String(formData.get("display_name") ?? ""),
    country: String(formData.get("country") ?? ""),
    language: String(formData.get("language") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: "Check your display name and locale preferences.",
      message: null,
    };
  }

  try {
    await updateProfileForUser(user.id, user.id, parsed.data);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save profile.",
      message: null,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  return { error: null, message: "Preferences saved." };
}
