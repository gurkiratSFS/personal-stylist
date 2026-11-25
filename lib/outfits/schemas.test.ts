import {
  outfitAnalysisReportSchema,
  compareSchema,
  followUpSchema,
  startAnalysisSchema,
} from "@/lib/outfits/schemas";
import { OUTFIT_CATEGORY_VALUES } from "@/lib/outfits/options";

function validReport(overrides: Record<string, unknown> = {}) {
  return {
    overall_score: 8.4,
    occasion: "smart_casual",
    summary: "A balanced and coordinated outfit.",
    categories: OUTFIT_CATEGORY_VALUES.map((name, index) => ({
      name,
      score: 7 + (index % 3) * 0.5,
      reason: `Reason for ${name}`,
    })),
    strengths: ["Good color balance", "Cohesive styling"],
    improvements: ["Try alternative footwear"],
    suggested_items: ["Neutral sneakers"],
    confidence: "medium",
    ...overrides,
  };
}

describe("outfitAnalysisReportSchema", () => {
  it("accepts a complete valid report", () => {
    expect(outfitAnalysisReportSchema.parse(validReport())).toMatchObject({
      overall_score: 8.4,
      confidence: "medium",
    });
  });

  it("rejects scores above 10", () => {
    expect(() =>
      outfitAnalysisReportSchema.parse(validReport({ overall_score: 10.1 })),
    ).toThrow();
  });

  it("rejects scores below 0", () => {
    expect(() =>
      outfitAnalysisReportSchema.parse(
        validReport({
          categories: OUTFIT_CATEGORY_VALUES.map((name) => ({
            name,
            score: name === "fit" ? -1 : 8,
            reason: "ok",
          })),
        }),
      ),
    ).toThrow();
  });

  it("rejects a wrong category name", () => {
    const report = validReport({
      categories: [
        ...OUTFIT_CATEGORY_VALUES.slice(0, 6).map((name) => ({
          name,
          score: 8,
          reason: `Reason for ${name}`,
        })),
        { name: "trend_relevance", score: 8, reason: "nope" },
      ],
    });
    expect(() => outfitAnalysisReportSchema.parse(report)).toThrow();
  });

  it("rejects duplicate category names", () => {
    const report = validReport();
    report.categories = [
      ...report.categories.slice(0, 6),
      { name: "fit", score: 8, reason: "duplicate" },
    ];
    expect(() => outfitAnalysisReportSchema.parse(report)).toThrow();
  });

  it("rejects missing summary", () => {
    expect(() =>
      outfitAnalysisReportSchema.parse(validReport({ summary: "" })),
    ).toThrow();
  });

  it("rejects extra keys", () => {
    expect(() =>
      outfitAnalysisReportSchema.parse(
        validReport({ attractiveness: 9 } as Record<string, unknown>),
      ),
    ).toThrow();
  });

  it("rejects a non-enum occasion", () => {
    expect(() =>
      outfitAnalysisReportSchema.parse(validReport({ occasion: "wedding-extravaganza" })),
    ).toThrow();
  });
});

describe("supporting schemas", () => {
  it("accepts a start analysis payload", () => {
    expect(
      startAnalysisSchema.parse({
        outfit_id: "11111111-1111-4111-8111-111111111111",
        feedback_depth: "detailed",
      }),
    ).toMatchObject({ feedback_depth: "detailed" });
  });

  it("rejects comparing the same outfit twice", () => {
    expect(() =>
      compareSchema.parse({
        outfit_a_id: "11111111-1111-4111-8111-111111111111",
        outfit_b_id: "11111111-1111-4111-8111-111111111111",
      }),
    ).toThrow();
  });

  it("rejects a short follow-up question", () => {
    expect(() =>
      followUpSchema.parse({
        analysis_id: "11111111-1111-4111-8111-111111111111",
        question: "hi",
      }),
    ).toThrow();
  });
});
