import {
  toUserFacingWardrobeErrorDetails,
  toUserFacingWardrobeUnavailableMessage,
} from "@/lib/wardrobe/errors";

describe("wardrobe errors", () => {
  it("maps missing_key to unavailable copy", () => {
    const details = toUserFacingWardrobeErrorDetails("missing_key");
    expect(details.retryable).toBe(false);
    expect(details.message).toBe(toUserFacingWardrobeUnavailableMessage());
  });

  it("maps insufficient_items clearly", () => {
    const details = toUserFacingWardrobeErrorDetails("insufficient_items");
    expect(details.retryable).toBe(false);
    expect(details.message).toMatch(/at least three/i);
  });

  it("hides provider names from raw errors", () => {
    const details = toUserFacingWardrobeErrorDetails(
      "Gemini models/gemini-x failed with API key",
    );
    expect(details.message).not.toMatch(/gemini/i);
    expect(details.message).not.toMatch(/api key/i);
  });
});
