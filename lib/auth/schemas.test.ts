import {
  credentialsSchema,
  emailOnlySchema,
  newPasswordSchema,
} from "@/lib/auth/schemas";

describe("credentialsSchema", () => {
  it("accepts a valid email and password", () => {
    expect(
      credentialsSchema.parse({
        email: "user@example.com",
        password: "password1",
      }),
    ).toEqual({
      email: "user@example.com",
      password: "password1",
    });
  });

  it("rejects a short password", () => {
    expect(() =>
      credentialsSchema.parse({
        email: "user@example.com",
        password: "short",
      }),
    ).toThrow();
  });

  it("rejects an invalid email", () => {
    expect(() =>
      credentialsSchema.parse({
        email: "not-an-email",
        password: "password1",
      }),
    ).toThrow();
  });
});

describe("emailOnlySchema", () => {
  it("accepts a valid email", () => {
    expect(emailOnlySchema.parse({ email: "user@example.com" })).toEqual({
      email: "user@example.com",
    });
  });
});

describe("newPasswordSchema", () => {
  it("rejects a password longer than 72 characters", () => {
    expect(() =>
      newPasswordSchema.parse({ password: "a".repeat(73) }),
    ).toThrow();
  });
});
