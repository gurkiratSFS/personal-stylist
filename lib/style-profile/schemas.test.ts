import {
  appearanceUpdateSchema,
  hasStyleEssentials,
  styleDnaSchema,
  styleEssentialsSchema,
  stylePreferencesSchema,
} from "@/lib/style-profile/schemas";

describe("styleEssentialsSchema", () => {
  it("accepts a complete essentials payload", () => {
    const parsed = styleEssentialsSchema.parse({
      fashion_categories: ["casual"],
      preferred_styles: ["minimal"],
      budget_band: "mid",
      climate: "temperate",
      lifestyle: "office",
    });
    expect(parsed.budget_band).toBe("mid");
  });

  it("rejects empty categories", () => {
    expect(
      styleEssentialsSchema.safeParse({
        fashion_categories: [],
        preferred_styles: ["classic"],
        budget_band: "value",
        climate: "tropical",
        lifestyle: "remote",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown style tokens", () => {
    expect(
      styleEssentialsSchema.safeParse({
        fashion_categories: ["casual"],
        preferred_styles: ["not-a-real-style"],
        budget_band: "mid",
        climate: "temperate",
        lifestyle: "office",
      }).success,
    ).toBe(false);
  });
});

describe("hasStyleEssentials", () => {
  it("returns true only when essentials are present and valid", () => {
    expect(
      hasStyleEssentials({
        fashion_categories: ["menswear"],
        preferred_styles: ["classic"],
        budget_band: "flexible",
        climate: "cold",
        lifestyle: "active",
      }),
    ).toBe(true);

    expect(
      hasStyleEssentials({
        fashion_categories: [],
        preferred_styles: ["classic"],
        budget_band: "flexible",
        climate: "cold",
        lifestyle: "active",
      }),
    ).toBe(false);
  });
});

describe("stylePreferencesSchema", () => {
  it("accepts optional color and fit arrays from allowlists", () => {
    const parsed = stylePreferencesSchema.parse({
      fashion_categories: ["unisex"],
      preferred_styles: ["street"],
      favorite_colors: ["navy", "beige"],
      disliked_colors: ["bright"],
      fit_preferences: ["relaxed"],
    });
    expect(parsed.favorite_colors).toEqual(["navy", "beige"]);
  });

  it("rejects unknown colors", () => {
    expect(
      stylePreferencesSchema.safeParse({
        fashion_categories: ["casual"],
        preferred_styles: ["minimal"],
        favorite_colors: ["neon-lime"],
      }).success,
    ).toBe(false);
  });
});

describe("styleDnaSchema", () => {
  it("trims empty DNA notes to null", () => {
    const parsed = styleDnaSchema.parse({
      summary: "  Classic and calm.  ",
      goals: "   ",
      palette_notes: undefined,
    });
    expect(parsed.summary).toBe("Classic and calm.");
    expect(parsed.goals).toBeNull();
  });

  it("accepts null DNA fields from a seeded merge", () => {
    const parsed = styleDnaSchema.parse({
      summary: "Seeded summary",
      goals: null,
      palette_notes: null,
      fit_notes: null,
      grooming_notes: null,
      shopping_notes: null,
    });
    expect(parsed.summary).toBe("Seeded summary");
    expect(parsed.goals).toBeNull();
    expect(parsed.grooming_notes).toBeNull();
  });
});

describe("appearanceUpdateSchema", () => {
  it("allows fully empty optional appearance", () => {
    const parsed = appearanceUpdateSchema.parse({
      preferred_hairstyles: [],
      grooming_preferences: [],
      height_cm: "",
    });
    expect(parsed.height_cm).toBeNull();
  });

  it("rejects height outside range", () => {
    expect(
      appearanceUpdateSchema.safeParse({
        height_cm: 90,
        preferred_hairstyles: [],
        grooming_preferences: [],
      }).success,
    ).toBe(false);
  });
});
