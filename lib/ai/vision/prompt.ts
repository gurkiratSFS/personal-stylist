import type {
  CategorizeItemInput,
  CompareVisionInput,
  FollowUpVisionInput,
  GenerateCombinationsVisionInput,
  OutfitVisionInput,
} from "@/lib/ai/vision/provider";
import { OUTFIT_CATEGORY_VALUES } from "@/lib/outfits/options";
import { WARDROBE_CATEGORY_VALUES } from "@/lib/wardrobe/options";

export const STYLING_SYSTEM_PROMPT = `You are a professional personal stylist giving a transparent styling assessment.

Hard rules:
- Score styling only. Never judge attractiveness, body shape, weight, age, gender presentation, ethnicity, skin condition, or personal worth.
- Never invent clothing that is not visible. Use "not_visible" language in reasons when footwear or accessories cannot be seen, and lower confidence.
- Do not give medical, dermatological, or diagnostic advice.
- Be specific, kind, and actionable. Prefer concrete swaps over vague praise.
- Return JSON only that matches the requested schema.`;

export function buildOutfitUserPrompt(input: OutfitVisionInput) {
  const categories = OUTFIT_CATEGORY_VALUES.join(", ");
  const styleBits = input.styleContext
    ? [
        input.styleContext.summary
          ? `Style DNA summary: ${input.styleContext.summary}`
          : null,
        input.styleContext.preferred_styles?.length
          ? `Preferred styles: ${input.styleContext.preferred_styles.join(", ")}`
          : null,
        input.styleContext.fashion_categories?.length
          ? `Fashion categories: ${input.styleContext.fashion_categories.join(", ")}`
          : null,
        input.styleContext.budget_band
          ? `Budget band: ${input.styleContext.budget_band}`
          : null,
        input.styleContext.climate
          ? `Climate: ${input.styleContext.climate}`
          : null,
        input.styleContext.lifestyle
          ? `Lifestyle: ${input.styleContext.lifestyle}`
          : null,
        input.styleContext.favorite_colors?.length
          ? `Favorite colors: ${input.styleContext.favorite_colors.join(", ")}`
          : null,
        input.styleContext.disliked_colors?.length
          ? `Disliked colors: ${input.styleContext.disliked_colors.join(", ")}`
          : null,
        input.styleContext.fit_preferences?.length
          ? `Fit preferences: ${input.styleContext.fit_preferences.join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "No style profile context provided.";

  const depthGuidance =
    input.feedbackDepth === "casual"
      ? "Keep the summary short and conversational. Still fill every category."
      : input.feedbackDepth === "improvement"
        ? "Emphasize concrete improvements and suggested swaps."
        : "Provide balanced detail across every category.";

  return `Analyze this outfit photo.

Feedback depth: ${input.feedbackDepth}
${depthGuidance}
Stated occasion: ${input.occasion ?? "unspecified"}

User context:
${styleBits}

Required categories (exactly these, no extras, no trend relevance): ${categories}

Respond with JSON:
{
  "overall_score": number 0-10,
  "occasion": one of casual|smart_casual|business|formal|date|party|athletic|travel|other|unknown,
  "summary": string,
  "categories": [{ "name": category, "score": 0-10, "reason": string }],
  "strengths": string[],
  "improvements": string[],
  "suggested_items": string[],
  "confidence": low|medium|high
}`;
}

export function buildFollowUpUserPrompt(input: FollowUpVisionInput) {
  return `The user has a prior outfit analysis and a follow-up question.

Prior summary: ${input.priorSummary}
Prior strengths: ${input.priorStrengths.join("; ") || "none"}
Prior improvements: ${input.priorImprovements.join("; ") || "none"}

Follow-up question: ${input.question}

Answer only about styling visible in the image. Respond with JSON: { "answer": string }`;
}

export function buildCompareUserPrompt(input: CompareVisionInput) {
  const styleBits = input.styleContext?.summary
    ? `Style DNA summary: ${input.styleContext.summary}`
    : "No style profile context provided.";

  return `Compare two outfit photos for the same person.

Outfit A occasion: ${input.occasionA ?? "unspecified"}
Outfit B occasion: ${input.occasionB ?? "unspecified"}
${styleBits}

Respond with JSON:
{
  "summary": string,
  "prefer": "a" | "b" | "tie",
  "reasons": string[]
}

Judge styling only. Never judge attractiveness or personal worth.`;
}

function styleContextBits(
  styleContext: CategorizeItemInput["styleContext"] | undefined,
) {
  if (!styleContext) return "No style profile context provided.";
  return [
    styleContext.summary
      ? `Style DNA summary: ${styleContext.summary}`
      : null,
    styleContext.preferred_styles?.length
      ? `Preferred styles: ${styleContext.preferred_styles.join(", ")}`
      : null,
    styleContext.fashion_categories?.length
      ? `Fashion categories: ${styleContext.fashion_categories.join(", ")}`
      : null,
    styleContext.favorite_colors?.length
      ? `Favorite colors: ${styleContext.favorite_colors.join(", ")}`
      : null,
    styleContext.disliked_colors?.length
      ? `Disliked colors: ${styleContext.disliked_colors.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n") || "No style profile context provided.";
}

export function buildCategorizeItemUserPrompt(input: CategorizeItemInput) {
  const categories = WARDROBE_CATEGORY_VALUES.join(", ");
  return `Categorize this single clothing item photo for a digital wardrobe.

User context:
${styleContextBits(input.styleContext)}

Allowed categories (pick exactly one): ${categories}

Respond with JSON:
{
  "name": short item name,
  "category": one of the allowed categories,
  "color": primary color,
  "brand": brand if visible else null,
  "attributes": [{ "key": string, "value": string }]
}

Do not invent brands that are not readable. Attributes may include pattern, season, or material when clear.`;
}

export function buildGenerateCombinationsUserPrompt(
  input: GenerateCombinationsVisionInput,
) {
  const catalog = input.items
    .map((item) => {
      const attrs =
        item.attributes?.map((a) => `${a.key}=${a.value}`).join("; ") || "none";
      return `- id=${item.id}; name=${item.name ?? "unnamed"}; category=${item.category ?? "unknown"}; color=${item.color ?? "unknown"}; brand=${item.brand ?? "unknown"}; attrs=${attrs}`;
    })
    .join("\n");

  return `Create ${input.count} outfit combinations using ONLY the wardrobe items listed below.

Occasion focus: ${input.occasion ?? "unspecified"}

User context:
${styleContextBits(input.styleContext)}

Wardrobe catalog:
${catalog}

Rules:
- Every item_ids value MUST be an id from the catalog. Never invent ids.
- Each combination needs at least 2 items and should be wearable as a look.
- Prefer variety across the ${input.count} combinations.
- Styling only — no body or worth judgments.

Respond with JSON:
{
  "combinations": [
    {
      "title": string,
      "occasion": casual|smart_casual|business|formal|date|party|athletic|travel|other|unknown,
      "rationale": string,
      "item_ids": string[]
    }
  ]
}`;
}
