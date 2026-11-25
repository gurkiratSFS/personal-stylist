import {
  toUserFacingAnalysisError,
  toUserFacingAnalysisErrorDetails,
  toUserFacingUnavailableMessage,
} from "@/lib/outfits/errors";

describe("toUserFacingAnalysisError", () => {
  it("hides provider and model leakage", () => {
    expect(
      toUserFacingAnalysisError(
        "This model models/gemini-2.5-flash is no longer available to new users.",
      ),
    ).toBe(toUserFacingUnavailableMessage());
  });

  it("maps high demand to a busy message with retry", () => {
    const details = toUserFacingAnalysisErrorDetails(
      "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
    );
    expect(details.title).toBe("Service is busy");
    expect(details.message).toMatch(/busy/i);
    expect(details.retryable).toBe(true);
  });

  it("maps missing_key to unavailable copy", () => {
    expect(toUserFacingAnalysisError("missing_key")).toBe(
      toUserFacingUnavailableMessage(),
    );
  });

  it("keeps consent messaging", () => {
    expect(
      toUserFacingAnalysisError(
        "AI processing consent is required before analysis.",
      ),
    ).toMatch(/consent/i);
  });
});
