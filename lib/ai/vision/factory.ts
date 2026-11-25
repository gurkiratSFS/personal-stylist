import { createGeminiAnalyzer } from "@/lib/ai/vision/gemini";
import type { VisionAnalyzerResult } from "@/lib/ai/vision/provider";
import { getGeminiApiKey, getGeminiModel } from "@/lib/env";

export function getVisionAnalyzer(
  source: Record<string, string | undefined> = process.env,
): VisionAnalyzerResult {
  const apiKey = getGeminiApiKey(source);
  if (!apiKey) {
    return { ok: false, reason: "missing_key" };
  }

  return {
    ok: true,
    analyzer: createGeminiAnalyzer({
      apiKey,
      model: getGeminiModel(source),
    }),
  };
}

export function isVisionConfigured(
  source: Record<string, string | undefined> = process.env,
) {
  return getVisionAnalyzer(source).ok;
}
