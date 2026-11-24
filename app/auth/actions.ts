"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  credentialsSchema,
  emailOnlySchema,
  newPasswordSchema,
} from "@/lib/auth/schemas";
import { postAuthDestination } from "@/lib/style-profile/redirect";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
  message: string | null;
};

function formValues(formData: FormData) {
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signUp(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse(formValues(formData));
  if (!parsed.success) {
    return { error: "Enter a valid email and a password of at least 8 characters.", message: null };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    return { error: error.message, message: null };
  }

  const userId = data.user?.id;
  redirect(userId ? await postAuthDestination(userId) : "/onboarding");
}

export async function signIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse(formValues(formData));
  if (!parsed.success) {
    return { error: "Enter a valid email and password.", message: null };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message, message: null };
  }

  const userId = data.user?.id;
  redirect(userId ? await postAuthDestination(userId) : "/home");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailOnlySchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email address.", message: null };
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/update-password`,
  });

  if (error) {
    return { error: error.message, message: null };
  }

  return {
    error: null,
    message: "If that email exists, a reset link is on the way.",
  };
}

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = newPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return {
      error: "Enter a new password of at least 8 characters.",
      message: null,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message, message: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect(user?.id ? await postAuthDestination(user.id) : "/home");
}
