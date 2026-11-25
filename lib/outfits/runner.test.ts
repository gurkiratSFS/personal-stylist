import { authorizeRunnerToken } from "@/lib/outfits/runner";

describe("authorizeRunnerToken", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      INTERNAL_RUNNER_TOKEN: "runner-token-12345678",
      NODE_ENV: "test",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("rejects missing authorization", () => {
    expect(authorizeRunnerToken(null)).toBe(false);
  });

  it("rejects an invalid bearer token", () => {
    expect(authorizeRunnerToken("Bearer wrong-token-12345678")).toBe(false);
  });

  it("accepts the configured bearer token", () => {
    expect(authorizeRunnerToken("Bearer runner-token-12345678")).toBe(true);
  });
});
