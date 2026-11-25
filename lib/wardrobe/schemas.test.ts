import {
  generateCombinationsResultSchema,
  wardrobeCategorizeResultSchema,
  combinationCreateSchema,
} from "@/lib/wardrobe/schemas";

const ownedA = "11111111-1111-4111-8111-111111111111";
const ownedB = "22222222-2222-4222-8222-222222222222";
const foreign = "33333333-3333-4333-8333-333333333333";

describe("wardrobe schemas", () => {
  it("accepts a valid categorize result", () => {
    const parsed = wardrobeCategorizeResultSchema.parse({
      name: "Navy oxford",
      category: "shirts",
      color: "navy",
      brand: null,
      attributes: [{ key: "pattern", value: "solid" }],
    });
    expect(parsed.category).toBe("shirts");
  });

  it("rejects unknown wardrobe categories", () => {
    expect(() =>
      wardrobeCategorizeResultSchema.parse({
        name: "Thing",
        category: "sneakers",
        color: "white",
        attributes: [],
      }),
    ).toThrow();
  });

  it("accepts generated combinations with owned-looking uuids", () => {
    const parsed = generateCombinationsResultSchema.parse({
      combinations: [
        {
          title: "Smart casual Friday",
          occasion: "smart_casual",
          rationale: "Balanced layers.",
          item_ids: [ownedA, ownedB],
        },
      ],
    });
    expect(parsed.combinations).toHaveLength(1);
  });

  it("rejects generated combinations with empty item lists", () => {
    expect(() =>
      generateCombinationsResultSchema.parse({
        combinations: [
          {
            title: "Empty",
            rationale: "Nope",
            item_ids: [],
          },
        ],
      }),
    ).toThrow();
  });

  it("requires at least one item for manual combinations", () => {
    expect(() =>
      combinationCreateSchema.parse({
        title: "Look",
        item_ids: [],
      }),
    ).toThrow();

    expect(
      combinationCreateSchema.parse({
        title: "Look",
        item_ids: [ownedA],
      }).item_ids,
    ).toEqual([ownedA]);
  });

  it("documents foreign id rejection is enforced after parse via allowlist", () => {
    const parsed = generateCombinationsResultSchema.parse({
      combinations: [
        {
          title: "Sneaky",
          rationale: "Uses a foreign id",
          item_ids: [ownedA, foreign],
        },
      ],
    });
    const allowed = new Set([ownedA, ownedB]);
    const valid = parsed.combinations.filter((combo) =>
      combo.item_ids.every((id) => allowed.has(id)),
    );
    expect(valid).toHaveLength(0);
  });
});
