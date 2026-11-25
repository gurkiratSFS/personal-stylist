import { z } from "zod";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SECRET_KEY: z.string().min(1),
  GOOGLE_GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).optional(),
  INTERNAL_RUNNER_TOKEN: z.string().min(16).optional(),
  APP_URL: z.string().url().optional(),
});

export function readPublicEnv(source: Record<string, string | undefined>) {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: source.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function readServerEnv(source: Record<string, string | undefined>) {
  return serverEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: source.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: source.SUPABASE_SECRET_KEY,
    GOOGLE_GEMINI_API_KEY: source.GOOGLE_GEMINI_API_KEY || undefined,
    GEMINI_MODEL: source.GEMINI_MODEL || undefined,
    INTERNAL_RUNNER_TOKEN: source.INTERNAL_RUNNER_TOKEN || undefined,
    APP_URL: source.APP_URL || undefined,
  });
}

export function getGeminiApiKey(
  source: Record<string, string | undefined> = process.env,
) {
  const value = source.GOOGLE_GEMINI_API_KEY?.trim();
  return value || null;
}

export function getGeminiModel(
  source: Record<string, string | undefined> = process.env,
) {
  return source.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
}

export function getInternalRunnerToken(
  source: Record<string, string | undefined> = process.env,
) {
  const value = source.INTERNAL_RUNNER_TOKEN?.trim();
  if (value) return value;
  if (process.env.NODE_ENV !== "production") {
    return "dev-internal-runner-token";
  }
  return null;
}

export function getAppUrl(
  source: Record<string, string | undefined> = process.env,
) {
  return source.APP_URL?.trim() || "http://localhost:3000";
}
