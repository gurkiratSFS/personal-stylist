import { publicEnvSchema, readPublicEnv, readServerEnv } from "@/lib/env";

const validPublic = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
};

describe("readPublicEnv", () => {
  it("returns the URL and publishable key for valid input", () => {
    expect(readPublicEnv(validPublic)).toEqual(validPublic);
  });

  it("throws a Zod error when the URL is missing", () => {
    expect(() =>
      readPublicEnv({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      }),
    ).toThrow();
  });

  it("does not expose SUPABASE_SECRET_KEY on the public schema", () => {
    expect(publicEnvSchema.shape).not.toHaveProperty("SUPABASE_SECRET_KEY");
  });

  it("does not expose GOOGLE_GEMINI_API_KEY on the public schema", () => {
    expect(publicEnvSchema.shape).not.toHaveProperty("GOOGLE_GEMINI_API_KEY");
  });
});

describe("readServerEnv", () => {
  it("throws when SUPABASE_SECRET_KEY is missing", () => {
    expect(() => readServerEnv(validPublic)).toThrow();
  });

  it("returns the secret key when present", () => {
    expect(
      readServerEnv({
        ...validPublic,
        SUPABASE_SECRET_KEY: "secret-key",
      }),
    ).toEqual({
      ...validPublic,
      SUPABASE_SECRET_KEY: "secret-key",
      GOOGLE_GEMINI_API_KEY: undefined,
      GEMINI_MODEL: undefined,
      INTERNAL_RUNNER_TOKEN: undefined,
      APP_URL: undefined,
    });
  });

  it("accepts optional Gemini and runner settings", () => {
    expect(
      readServerEnv({
        ...validPublic,
        SUPABASE_SECRET_KEY: "secret-key",
        GOOGLE_GEMINI_API_KEY: "gemini-key",
        GEMINI_MODEL: "gemini-3.5-flash",
        INTERNAL_RUNNER_TOKEN: "runner-token-123456",
        APP_URL: "http://localhost:3000",
      }),
    ).toMatchObject({
      GOOGLE_GEMINI_API_KEY: "gemini-key",
      GEMINI_MODEL: "gemini-3.5-flash",
      INTERNAL_RUNNER_TOKEN: "runner-token-123456",
      APP_URL: "http://localhost:3000",
    });
  });
});
