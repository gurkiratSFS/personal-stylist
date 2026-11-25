import {
  assertOwnedItemIds,
  canAccessCombination,
  canAccessWardrobeItem,
  canAccessWardrobeJob,
  isOwnedWardrobePath,
} from "@/lib/wardrobe/access";

describe("wardrobe access", () => {
  it("allows a user to access their own item, combination, and job", () => {
    expect(canAccessWardrobeItem("user-a", "user-a")).toBe(true);
    expect(canAccessCombination("user-a", "user-a")).toBe(true);
    expect(canAccessWardrobeJob("user-a", "user-a")).toBe(true);
  });

  it("blocks cross-user access", () => {
    expect(canAccessWardrobeItem("user-a", "user-b")).toBe(false);
    expect(canAccessCombination("user-a", "user-b")).toBe(false);
    expect(canAccessWardrobeJob("user-a", "user-b")).toBe(false);
  });

  it("requires storage paths under the owner folder", () => {
    expect(isOwnedWardrobePath("user-a", "user-a/item/photo.jpg")).toBe(true);
    expect(isOwnedWardrobePath("user-a", "user-b/item/photo.jpg")).toBe(false);
  });

  it("rejects combination item ids outside the owned catalog", () => {
    const allowed = new Set(["a", "b"]);
    expect(assertOwnedItemIds(allowed, ["a", "b"])).toBe(true);
    expect(assertOwnedItemIds(allowed, ["a", "c"])).toBe(false);
  });
});
