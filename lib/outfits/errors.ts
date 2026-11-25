const FRIENDLY_ANALYSIS_ERROR =
  "We couldn’t finish this analysis right now. Please try again in a moment.";

const FRIENDLY_BUSY =
  "Our styling review service is busy right now. Please try again in a moment.";

const FRIENDLY_UNAVAILABLE =
  "Outfit analysis isn’t available right now. Please try again later.";

const FRIENDLY_INVALID =
  "We couldn’t validate the styling report. Please try analyzing again.";

/** Known internal codes we may persist on ai_jobs.error */
const INTERNAL_CODES = new Set([
  "invalid_model_response",
  "invalid_job_input",
  "outfit_not_found",
  "analysis_not_found",
  "consent_denied",
  "missing_key",
  "job_not_found",
  "analysis_failed",
  "follow_up_failed",
  "compare_failed",
]);

export type UserFacingAnalysisError = {
  title: string;
  message: string;
  retryable: boolean;
};

/**
 * Map stored / thrown analysis errors to copy safe for signed-in end users.
 * Never leak provider names, model ids, API keys, or raw upstream messages.
 */
export function toUserFacingAnalysisErrorDetails(
  error: string | null | undefined,
): UserFacingAnalysisError {
  if (!error?.trim()) {
    return {
      title: "Analysis didn’t finish",
      message: FRIENDLY_ANALYSIS_ERROR,
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
        "AI analysis consent is required before we can review this outfit.",
      retryable: false,
    };
  }

  if (normalized === "invalid_model_response") {
    return {
      title: "Couldn’t validate report",
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

  if (
    /no longer available|not found|unsupported model|invalid model/i.test(
      normalized,
    )
  ) {
    return {
      title: "Temporarily unavailable",
      message: FRIENDLY_UNAVAILABLE,
      retryable: true,
    };
  }

  if (INTERNAL_CODES.has(normalized)) {
    return {
      title: "Analysis didn’t finish",
      message: FRIENDLY_ANALYSIS_ERROR,
      retryable: true,
    };
  }

  if (
    /gemini|openai|anthropic|generativelanguage|models\/|api key|GOOGLE_|Bearer /i.test(
      normalized,
    )
  ) {
    return {
      title: "Analysis didn’t finish",
      message: FRIENDLY_ANALYSIS_ERROR,
      retryable: true,
    };
  }

  if (
    /consent|choose an outfit|two different outfits|enter a follow-up|8 MB|JPEG|PNG|WebP|storage consent/i.test(
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
    title: "Analysis didn’t finish",
    message: FRIENDLY_ANALYSIS_ERROR,
    retryable: true,
  };
}

export function toUserFacingAnalysisError(
  error: string | null | undefined,
): string {
  return toUserFacingAnalysisErrorDetails(error).message;
}

export function toUserFacingUnavailableMessage() {
  return FRIENDLY_UNAVAILABLE;
}
