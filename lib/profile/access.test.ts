import { canAccessProfile } from "@/lib/profile/access";

describe("canAccessProfile", () => {
  it("returns true when the viewer owns the profile", () => {
    expect(canAccessProfile("user-1", "user-1")).toBe(true);
  });

  it("returns false when the viewer does not own the profile", () => {
    expect(canAccessProfile("user-1", "user-2")).toBe(false);
  });
});
