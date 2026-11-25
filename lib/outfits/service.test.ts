import { outfitAnalysisReportSchema } from "@/lib/outfits/schemas";
import { OUTFIT_CATEGORY_VALUES } from "@/lib/outfits/options";

const mockFrom = jest.fn();
const mockStorageFrom = jest.fn();
const mockAnalyzeOutfit = jest.fn();

jest.mock("@/lib/supabase/admin", () => ({
  createServiceSupabaseClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
    storage: {
      from: (...args: unknown[]) => mockStorageFrom(...args),
    },
  }),
}));

jest.mock("@/lib/ai/vision/factory", () => ({
  getVisionAnalyzer: () => ({
    ok: true,
    analyzer: {
      id: "gemini",
      model: "gemini-2.5-flash",
      analyzeOutfit: (...args: unknown[]) => mockAnalyzeOutfit(...args),
      answerFollowUp: jest.fn(),
      compareOutfits: jest.fn(),
      lastUsage: null,
    },
  }),
}));

import { processOutfitAnalysisJob } from "@/lib/outfits/service";

describe("processOutfitAnalysisJob", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("marks the job failed with invalid_model_response and never inserts an analysis when parse fails", async () => {
    const jobUpdate = jest.fn(async () => ({ data: null, error: null }));
    const analysisInsert = jest.fn();

    mockFrom.mockImplementation((table: string) => {
      if (table === "ai_jobs") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "job-1",
                  user_id: "user-1",
                  job_type: "outfit_analysis",
                  status: "queued",
                  input_reference: {
                    outfit_id: "outfit-1",
                    feedback_depth: "detailed",
                    occasion: "casual",
                  },
                  result_reference: null,
                  error: null,
                },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: jobUpdate,
          }),
        };
      }
      if (table === "outfits") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "outfit-1",
                  user_id: "user-1",
                  image_path: "user-1/outfit-1/look.jpg",
                  occasion: "casual",
                  consent_ai_processing: "granted",
                  title: "Look",
                  notes: null,
                  source: "upload",
                  status: "draft",
                  consent_storage: true,
                  bytes: 100,
                  mime_type: "image/jpeg",
                  created_at: "",
                  updated_at: "",
                },
                error: null,
              }),
            }),
          }),
          update: () => ({ eq: jest.fn() }),
        };
      }
      if (table === "outfit_analyses") {
        return {
          insert: analysisInsert,
        };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    });

    mockStorageFrom.mockReturnValue({
      createSignedUrl: async () => ({
        data: { signedUrl: "https://example.com/signed.jpg" },
        error: null,
      }),
    });

    const invalidPayload = {
      overall_score: 99,
      occasion: "casual",
      summary: "bad",
      categories: OUTFIT_CATEGORY_VALUES.map((name) => ({
        name,
        score: 8,
        reason: "x",
      })),
      strengths: ["a"],
      improvements: [],
      suggested_items: [],
      confidence: "medium",
    };

    expect(() => outfitAnalysisReportSchema.parse(invalidPayload)).toThrow();
    mockAnalyzeOutfit.mockResolvedValue(invalidPayload);

    const result = await processOutfitAnalysisJob("job-1");

    expect(result).toEqual({ ok: false, error: "invalid_model_response" });
    expect(analysisInsert).not.toHaveBeenCalled();
    expect(jobUpdate).toHaveBeenCalled();
  });
});
