import { getVisionAnalyzer, isVisionConfigured } from "@/lib/ai/vision/factory";

describe("getVisionAnalyzer", () => {
  it("returns missing_key when GOOGLE_GEMINI_API_KEY is absent", () => {
    expect(
      getVisionAnalyzer({
        GOOGLE_GEMINI_API_KEY: "",
      }),
    ).toEqual({ ok: false, reason: "missing_key" });
    expect(isVisionConfigured({ GOOGLE_GEMINI_API_KEY: "" })).toBe(false);
  });

  it("returns a gemini analyzer when the key is present", () => {
    const result = getVisionAnalyzer({
      GOOGLE_GEMINI_API_KEY: "test-key",
      GEMINI_MODEL: "gemini-3.5-flash",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.analyzer.id).toBe("gemini");
      expect(result.analyzer.model).toBe("gemini-3.5-flash");
    }
  });
});
