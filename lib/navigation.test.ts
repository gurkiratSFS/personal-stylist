import { moduleStatus } from "@/lib/navigation";

describe("moduleStatus", () => {
  it("marks Home, Outfit Analyzer, Wardrobe, and Profile as open", () => {
    expect(moduleStatus("/home")).toBe("open");
    expect(moduleStatus("/analyze")).toBe("open");
    expect(moduleStatus("/wardrobe")).toBe("open");
    expect(moduleStatus("/profile")).toBe("open");
  });

  it("marks unfinished destinations as pending", () => {
    expect(moduleStatus("/discover")).toBe("pending");
    expect(moduleStatus("/assistant")).toBe("pending");
    expect(moduleStatus("/grooming")).toBe("pending");
    expect(moduleStatus("/shopping")).toBe("pending");
  });

  it("marks an unknown path as unknown", () => {
    expect(moduleStatus("/not-a-module")).toBe("unknown");
  });
});
