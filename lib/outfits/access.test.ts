import {
  canAccessAnalysis,
  canAccessJob,
  canAccessOutfit,
  canAccessSavedLook,
  isOwnedOutfitPath,
} from "@/lib/outfits/access";

describe("outfit access", () => {
  it("allows a user to access their own outfit, analysis, job, and saved look", () => {
    expect(canAccessOutfit("user-a", "user-a")).toBe(true);
    expect(canAccessAnalysis("user-a", "user-a")).toBe(true);
    expect(canAccessJob("user-a", "user-a")).toBe(true);
    expect(canAccessSavedLook("user-a", "user-a")).toBe(true);
  });

  it("blocks cross-user access", () => {
    expect(canAccessOutfit("user-a", "user-b")).toBe(false);
    expect(canAccessAnalysis("user-a", "user-b")).toBe(false);
    expect(canAccessJob("user-a", "user-b")).toBe(false);
    expect(canAccessSavedLook("user-a", "user-b")).toBe(false);
  });

  it("requires storage paths under the owner folder", () => {
    expect(isOwnedOutfitPath("user-a", "user-a/outfit/photo.jpg")).toBe(true);
    expect(isOwnedOutfitPath("user-a", "user-b/outfit/photo.jpg")).toBe(false);
  });
});
