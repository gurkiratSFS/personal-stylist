import { canAccessProfile } from "@/lib/profile/access";
import {
  profileUpdateSchema,
  type ProfileUpdate,
} from "@/lib/profile/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getProfileForUser(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, country, language, currency, timezone, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateProfileForUser(
  viewerId: string,
  profileId: string,
  input: ProfileUpdate,
) {
  if (!canAccessProfile(viewerId, profileId)) {
    throw new Error("You can only update your own profile.");
  }

  const values = profileUpdateSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", profileId)
    .select(
      "id, display_name, country, language, currency, timezone, created_at, updated_at",
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
