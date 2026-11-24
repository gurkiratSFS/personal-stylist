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
    });
  });
});
