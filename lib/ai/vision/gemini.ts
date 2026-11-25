import {
  STYLING_SYSTEM_PROMPT,
  buildCategorizeItemUserPrompt,
  buildCompareUserPrompt,
  buildFollowUpUserPrompt,
  buildGenerateCombinationsUserPrompt,
  buildOutfitUserPrompt,
} from "@/lib/ai/vision/prompt";
import type {
  CategorizeItemInput,
  CompareVisionInput,
  FollowUpVisionInput,
  GenerateCombinationsVisionInput,
  OutfitVisionInput,
  VisionAnalyzer,
} from "@/lib/ai/vision/provider";
import { OUTFIT_CATEGORY_VALUES } from "@/lib/outfits/options";

type GeminiConfig = {
  apiKey: string;
  model: string;
  fetchImpl?: typeof fetch;
};

type GeminiPart = {
  text?: string;
  inlineData?: { mimeType: string; data: string };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: { message?: string };
};

const OUTFIT_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    overall_score: { type: "NUMBER" },
    occasion: { type: "STRING" },
    summary: { type: "STRING" },
    categories: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          score: { type: "NUMBER" },
          reason: { type: "STRING" },
        },
        required: ["name", "score", "reason"],
      },
    },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    improvements: { type: "ARRAY", items: { type: "STRING" } },
    suggested_items: { type: "ARRAY", items: { type: "STRING" } },
    confidence: { type: "STRING" },
  },
  required: [
    "overall_score",
    "occasion",
    "summary",
    "categories",
    "strengths",
    "improvements",
    "suggested_items",
    "confidence",
  ],
} as const;

const FOLLOW_UP_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    answer: { type: "STRING" },
  },
  required: ["answer"],
} as const;

const COMPARE_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    prefer: { type: "STRING" },
    reasons: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["summary", "prefer", "reasons"],
} as const;

const CATEGORIZE_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    category: { type: "STRING" },
    color: { type: "STRING" },
    brand: { type: "STRING", nullable: true },
    attributes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          key: { type: "STRING" },
          value: { type: "STRING" },
        },
        required: ["key", "value"],
      },
    },
  },
  required: ["name", "category", "color", "attributes"],
} as const;

const GENERATE_COMBINATIONS_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    combinations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          occasion: { type: "STRING" },
          rationale: { type: "STRING" },
          item_ids: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["title", "rationale", "item_ids"],
      },
    },
  },
  required: ["combinations"],
} as const;

function redactKey(message: string, apiKey: string) {
  return message.split(apiKey).join("[REDACTED]");
}

async function imageUrlToInlineData(
  imageUrl: string,
  fetchImpl: typeof fetch,
) {
  const response = await fetchImpl(imageUrl);
  if (!response.ok) {
    throw new Error(`Could not load outfit image (${response.status}).`);
  }
  const mimeType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    mimeType: mimeType.split(";")[0] || "image/jpeg",
    data: buffer.toString("base64"),
  };
}

async function callGemini(options: {
  apiKey: string;
  model: string;
  fetchImpl: typeof fetch;
  userText: string;
  images: Array<{ mimeType: string; data: string }>;
  responseSchema: unknown;
}): Promise<{ payload: unknown; usage: GeminiResponse["usageMetadata"] }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(options.model)}:generateContent?key=${options.apiKey}`;

  const parts: GeminiPart[] = [
    { text: `${STYLING_SYSTEM_PROMPT}\n\n${options.userText}` },
    ...options.images.map((image) => ({
      inlineData: { mimeType: image.mimeType, data: image.data },
    })),
  ];

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: options.responseSchema,
      temperature: 0.4,
    },
  };

  let response: Response;
  try {
    response = await options.fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gemini request failed.";
    throw new Error(redactKey(message, options.apiKey));
  }

  const rawText = await response.text();
  let parsed: GeminiResponse;
  try {
    parsed = JSON.parse(rawText) as GeminiResponse;
  } catch {
    throw new Error(
      redactKey(
        `Gemini returned non-JSON (${response.status}): ${rawText.slice(0, 200)}`,
        options.apiKey,
      ),
    );
  }

  if (!response.ok) {
    throw new Error(
      redactKey(
        parsed.error?.message || `Gemini request failed (${response.status}).`,
        options.apiKey,
      ),
    );
  }

  const text = parsed.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    return {
      payload: JSON.parse(text) as unknown,
      usage: parsed.usageMetadata,
    };
  } catch {
    throw new Error("Gemini returned malformed JSON.");
  }
}

export type GeminiCallResult = {
  payload: unknown;
  usage?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

export function createGeminiAnalyzer(config: GeminiConfig): VisionAnalyzer & {
  lastUsage: GeminiCallResult["usage"] | null;
} {
  const fetchImpl: typeof fetch =
    config.fetchImpl ??
    ((input, init) => {
      if (typeof globalThis.fetch !== "function") {
        throw new Error("fetch is not available in this runtime.");
      }
      return globalThis.fetch(input, init);
    });
  let lastUsage: GeminiCallResult["usage"] | null = null;

  return {
    id: "gemini",
    model: config.model,
    get lastUsage() {
      return lastUsage;
    },
    async analyzeOutfit(input: OutfitVisionInput) {
      const image = await imageUrlToInlineData(input.imageUrl, fetchImpl);
      const result = await callGemini({
        apiKey: config.apiKey,
        model: config.model,
        fetchImpl,
        userText: `${buildOutfitUserPrompt(input)}\n\nCategories must include exactly: ${OUTFIT_CATEGORY_VALUES.join(", ")}`,
        images: [image],
        responseSchema: OUTFIT_RESPONSE_SCHEMA,
      });
      lastUsage = result.usage ?? null;
      return result.payload;
    },
    async answerFollowUp(input: FollowUpVisionInput) {
      const image = await imageUrlToInlineData(input.imageUrl, fetchImpl);
      const result = await callGemini({
        apiKey: config.apiKey,
        model: config.model,
        fetchImpl,
        userText: buildFollowUpUserPrompt(input),
        images: [image],
        responseSchema: FOLLOW_UP_RESPONSE_SCHEMA,
      });
      lastUsage = result.usage ?? null;
      return result.payload;
    },
    async compareOutfits(input: CompareVisionInput) {
      const [imageA, imageB] = await Promise.all([
        imageUrlToInlineData(input.imageUrlA, fetchImpl),
        imageUrlToInlineData(input.imageUrlB, fetchImpl),
      ]);
      const result = await callGemini({
        apiKey: config.apiKey,
        model: config.model,
        fetchImpl,
        userText: buildCompareUserPrompt(input),
        images: [imageA, imageB],
        responseSchema: COMPARE_RESPONSE_SCHEMA,
      });
      lastUsage = result.usage ?? null;
      return result.payload;
    },
    async categorizeItem(input: CategorizeItemInput) {
      const image = await imageUrlToInlineData(input.imageUrl, fetchImpl);
      const result = await callGemini({
        apiKey: config.apiKey,
        model: config.model,
        fetchImpl,
        userText: buildCategorizeItemUserPrompt(input),
        images: [image],
        responseSchema: CATEGORIZE_RESPONSE_SCHEMA,
      });
      lastUsage = result.usage ?? null;
      return result.payload;
    },
    async generateCombinations(input: GenerateCombinationsVisionInput) {
      const result = await callGemini({
        apiKey: config.apiKey,
        model: config.model,
        fetchImpl,
        userText: buildGenerateCombinationsUserPrompt(input),
        images: [],
        responseSchema: GENERATE_COMBINATIONS_RESPONSE_SCHEMA,
      });
      lastUsage = result.usage ?? null;
      return result.payload;
    },
  };
}
