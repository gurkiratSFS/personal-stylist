const FRIENDLY_ERROR =
  "We couldn’t finish this wardrobe request right now. Please try again in a moment.";

const FRIENDLY_BUSY =
  "Our styling service is busy right now. Please try again in a moment.";

const FRIENDLY_UNAVAILABLE =
  "Wardrobe AI features aren’t available right now. You can still add items and build outfits manually.";

const FRIENDLY_INVALID =
  "We couldn’t validate the AI response. Please try again.";

const INTERNAL_CODES = new Set([
  "invalid_model_response",
  "invalid_job_input",
  "item_not_found",
  "consent_denied",
  "missing_key",
  "job_not_found",
  "insufficient_items",
  "foreign_item_ids",
  "categorize_failed",
  "generate_failed",
]);

export type UserFacingWardrobeError = {
  title: string;
  message: string;
  retryable: boolean;
};

export function toUserFacingWardrobeErrorDetails(
  error: string | null | undefined,
): UserFacingWardrobeError {
  if (!error?.trim()) {
    return {
      title: "Request didn’t finish",
      message: FRIENDLY_ERROR,
      retryable: true,
    };
  }

  const normalized = error.trim();

  if (normalized === "missing_key") {
    return {
      title: "Temporarily unavailable",
      message: FRIENDLY_UNAVAILABLE,
      retryable: false,
    };
  }

  if (normalized === "consent_denied") {
    return {
      title: "Consent needed",
      message:
        "AI processing consent is required before we can categorize or generate outfits.",
      retryable: false,
    };
  }

  if (normalized === "insufficient_items") {
    return {
      title: "Need more pieces",
      message:
        "Add at least three ready wardrobe items before generating outfit combinations.",
      retryable: false,
    };
  }

  if (normalized === "invalid_model_response" || normalized === "foreign_item_ids") {
    return {
      title: "Couldn’t validate result",
      message: FRIENDLY_INVALID,
      retryable: true,
    };
  }

  if (
    /high demand|spikes in demand|try again later|overloaded|capacity|rate limit|quota|429|503|temporarily unavailable|busy/i.test(
      normalized,
    )
  ) {
    return {
      title: "Service is busy",
      message: FRIENDLY_BUSY,
      retryable: true,
    };
  }

  if (INTERNAL_CODES.has(normalized)) {
    return {
      title: "Request didn’t finish",
      message: FRIENDLY_ERROR,
      retryable: true,
    };
  }

  if (
    /gemini|openai|anthropic|generativelanguage|models\/|api key|GOOGLE_|Bearer /i.test(
      normalized,
    )
  ) {
    return {
      title: "Request didn’t finish",
      message: FRIENDLY_ERROR,
      retryable: true,
    };
  }

  if (
    /consent|JPEG|PNG|WebP|8 MB|storage consent|own|another user|category|title/i.test(
      normalized,
    )
  ) {
    return {
      title: "Check your details",
      message: normalized,
      retryable: false,
    };
  }

  return {
    title: "Request didn’t finish",
    message: FRIENDLY_ERROR,
    retryable: true,
  };
}

export function toUserFacingWardrobeError(
  error: string | null | undefined,
): string {
  return toUserFacingWardrobeErrorDetails(error).message;
}

export function toUserFacingWardrobeUnavailableMessage() {
  return FRIENDLY_UNAVAILABLE;
}
