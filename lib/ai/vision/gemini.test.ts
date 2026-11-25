import { createGeminiAnalyzer } from "@/lib/ai/vision/gemini";
import { outfitAnalysisReportSchema } from "@/lib/outfits/schemas";
import { OUTFIT_CATEGORY_VALUES } from "@/lib/outfits/options";

function validPayload() {
  return {
    overall_score: 8.2,
    occasion: "casual",
    summary: "Clean and balanced.",
    categories: OUTFIT_CATEGORY_VALUES.map((name) => ({
      name,
      score: 8,
      reason: `${name} looks solid`,
    })),
    strengths: ["Balanced proportions"],
    improvements: ["Simplify accessories"],
    suggested_items: ["Minimal watch"],
    confidence: "medium",
  };
}

describe("createGeminiAnalyzer", () => {
  it("returns parsed JSON from a successful Gemini response", async () => {
    const payload = validPayload();
    const fetchImpl = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("generativelanguage.googleapis.com")) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [{ text: JSON.stringify(payload) }],
                  },
                },
              ],
              usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 20,
              },
            }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: async () => new ArrayBuffer(8),
      } as unknown as Response;
    });

    const analyzer = createGeminiAnalyzer({
      apiKey: "secret-key-abc",
      model: "gemini-2.5-flash",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const raw = await analyzer.analyzeOutfit({
      imageUrl: "https://example.com/outfit.jpg",
      feedbackDepth: "detailed",
    });

    expect(outfitAnalysisReportSchema.parse(raw).overall_score).toBe(8.2);
  });

  it("rejects malformed JSON from Gemini", async () => {
    const fetchImpl = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("generativelanguage.googleapis.com")) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              candidates: [{ content: { parts: [{ text: "{not-json" }] } }],
            }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: async () => new ArrayBuffer(8),
      } as unknown as Response;
    });

    const analyzer = createGeminiAnalyzer({
      apiKey: "secret-key-abc",
      model: "gemini-2.5-flash",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(
      analyzer.analyzeOutfit({
        imageUrl: "https://example.com/outfit.jpg",
        feedbackDepth: "casual",
      }),
    ).rejects.toThrow("malformed JSON");
  });

  it("lets Zod reject out-of-range payloads from the model", async () => {
    const bad = validPayload();
    bad.overall_score = 99;
    const fetchImpl = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("generativelanguage.googleapis.com")) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              candidates: [{ content: { parts: [{ text: JSON.stringify(bad) }] } }],
            }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: async () => new ArrayBuffer(8),
      } as unknown as Response;
    });

    const analyzer = createGeminiAnalyzer({
      apiKey: "secret-key-abc",
      model: "gemini-2.5-flash",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const raw = await analyzer.analyzeOutfit({
      imageUrl: "https://example.com/outfit.jpg",
      feedbackDepth: "improvement",
    });

    expect(() => outfitAnalysisReportSchema.parse(raw)).toThrow();
  });

  it("redacts the API key from error messages", async () => {
    const fetchImpl = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("generativelanguage.googleapis.com")) {
        return {
          ok: false,
          status: 400,
          text: async () =>
            JSON.stringify({
              error: { message: "bad key secret-key-abc leaked" },
            }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: async () => new ArrayBuffer(8),
      } as unknown as Response;
    });

    const analyzer = createGeminiAnalyzer({
      apiKey: "secret-key-abc",
      model: "gemini-2.5-flash",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(
      analyzer.analyzeOutfit({
        imageUrl: "https://example.com/outfit.jpg",
        feedbackDepth: "detailed",
      }),
    ).rejects.toThrow(/\[REDACTED\]/);
  });
});
