import {
  isAuthConfirmPath,
  isProtectedAppPath,
  isPublicAuthPath,
} from "@/lib/auth/paths";

describe("auth path helpers", () => {
  it("recognizes public auth pages", () => {
    expect(isPublicAuthPath("/login")).toBe(true);
    expect(isPublicAuthPath("/signup")).toBe(true);
    expect(isPublicAuthPath("/forgot-password")).toBe(true);
    expect(isPublicAuthPath("/profile")).toBe(false);
  });

  it("recognizes protected app pages", () => {
    expect(isProtectedAppPath("/home")).toBe(true);
    expect(isProtectedAppPath("/onboarding")).toBe(true);
    expect(isProtectedAppPath("/profile")).toBe(true);
    expect(isProtectedAppPath("/analyze")).toBe(true);
    expect(isProtectedAppPath("/grooming")).toBe(true);
    expect(isProtectedAppPath("/shopping")).toBe(true);
    expect(isProtectedAppPath("/login")).toBe(false);
  });

  it("recognizes auth confirm routes", () => {
    expect(isAuthConfirmPath("/auth/confirm")).toBe(true);
    expect(isAuthConfirmPath("/login")).toBe(false);
  });
});
