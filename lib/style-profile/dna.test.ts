import { buildDnaSeed, mergeDnaSeed } from "@/lib/style-profile/dna";

describe("buildDnaSeed", () => {
  it("builds a user-answer summary without attractiveness language", () => {
    const seed = buildDnaSeed({
      fashion_categories: ["casual"],
      preferred_styles: ["minimal", "classic"],
      budget_band: "mid",
      climate: "temperate",
      lifestyle: "office",
      favorite_colors: ["navy"],
      disliked_colors: ["bright"],
      fit_preferences: ["tailored"],
      goals: "Look sharp for work",
      grooming_preferences: ["clean_shave"],
    });

    expect(seed.summary.toLowerCase()).toContain("casual");
    expect(seed.summary.toLowerCase()).not.toContain("attractive");
    expect(seed.palette_notes).toContain("Navy");
    expect(seed.shopping_notes).toContain("Mid-range");
    expect(seed.goals).toBe("Look sharp for work");
  });
});

describe("mergeDnaSeed", () => {
  it("does not overwrite non-empty user DNA notes", () => {
    const merged = mergeDnaSeed(
      {
        summary: "My custom summary",
        palette_notes: null,
        fit_notes: "Keep jackets short",
      },
      {
        summary: "Seeded summary",
        goals: "Seeded goals",
        palette_notes: "Seeded palette",
        fit_notes: "Seeded fit",
        grooming_notes: "Seeded grooming",
        shopping_notes: "Seeded shopping",
      },
    );

    expect(merged.summary).toBe("My custom summary");
    expect(merged.fit_notes).toBe("Keep jackets short");
    expect(merged.palette_notes).toBe("Seeded palette");
    expect(merged.goals).toBe("Seeded goals");
  });
});
