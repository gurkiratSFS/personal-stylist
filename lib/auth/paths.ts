export const PUBLIC_AUTH_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
] as const;

export const PROTECTED_APP_PATHS = [
  "/home",
  "/onboarding",
  "/profile",
  "/wardrobe",
  "/discover",
  "/assistant",
  "/analyze",
  "/grooming",
  "/shopping",
  "/update-password",
] as const;

export function isPublicAuthPath(pathname: string) {
  return PUBLIC_AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isAuthConfirmPath(pathname: string) {
  return pathname === "/auth/confirm" || pathname.startsWith("/auth/");
}

export function isProtectedAppPath(pathname: string) {
  return PROTECTED_APP_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
