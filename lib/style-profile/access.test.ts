import {
  canAccessAppearanceProfile,
  canAccessStyleProfile,
  canAccessUserPhoto,
  isOwnedStoragePath,
} from "@/lib/style-profile/access";

describe("style profile access", () => {
  it("allows only the owner", () => {
    expect(canAccessStyleProfile("u1", "u1")).toBe(true);
    expect(canAccessStyleProfile("u1", "u2")).toBe(false);
    expect(canAccessAppearanceProfile("u1", "u1")).toBe(true);
    expect(canAccessAppearanceProfile("u1", "u2")).toBe(false);
    expect(canAccessUserPhoto("u1", "u1")).toBe(true);
    expect(canAccessUserPhoto("u1", "u2")).toBe(false);
  });

  it("requires storage paths under the user folder", () => {
    expect(isOwnedStoragePath("u1", "u1/photo-id/file.jpg")).toBe(true);
    expect(isOwnedStoragePath("u1", "u2/photo-id/file.jpg")).toBe(false);
    expect(isOwnedStoragePath("u1", "file.jpg")).toBe(false);
  });
});
