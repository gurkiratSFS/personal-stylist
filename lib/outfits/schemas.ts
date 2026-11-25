import { z } from "zod";

import {
  OUTFIT_CATEGORIES,
  OUTFIT_CONFIDENCE,
  OUTFIT_FEEDBACK_DEPTHS,
  OUTFIT_OCCASIONS,
  optionValues,
} from "@/lib/outfits/options";

export const ALLOWED_OUTFIT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_OUTFIT_BYTES = 8 * 1024 * 1024;

const feedbackDepth = z.enum(
  optionValues(OUTFIT_FEEDBACK_DEPTHS) as [string, ...string[]],
);
const occasion = z.enum(
  optionValues(OUTFIT_OCCASIONS) as [string, ...string[]],
);
const categoryName = z.enum(
  optionValues(OUTFIT_CATEGORIES) as [string, ...string[]],
);
const confidence = z.enum(
  optionValues(OUTFIT_CONFIDENCE) as [string, ...string[]],
);

export const categoryScoreSchema = z
  .object({
    name: categoryName,
    score: z.number().min(0).max(10),
    reason: z.string().trim().min(1).max(600),
  })
  .strict();

const EXPECTED_CATEGORIES = optionValues(OUTFIT_CATEGORIES);

export const outfitAnalysisReportSchema = z
  .object({
    overall_score: z.number().min(0).max(10),
    occasion: z.union([occasion, z.literal("unknown")]),
    summary: z.string().trim().min(1).max(600),
    categories: z
      .array(categoryScoreSchema)
      .length(EXPECTED_CATEGORIES.length)
      .superRefine((categories, ctx) => {
        const names = categories.map((c) => c.name);
        const unique = new Set(names);
        if (unique.size !== names.length) {
          ctx.addIssue({
            code: "custom",
            message: "Category names must be unique.",
          });
        }
        for (const expected of EXPECTED_CATEGORIES) {
          if (!unique.has(expected)) {
            ctx.addIssue({
              code: "custom",
              message: `Missing category: ${expected}`,
            });
          }
        }
      }),
    strengths: z.array(z.string().trim().min(1).max(240)).min(1).max(6),
    improvements: z.array(z.string().trim().min(1).max(240)).max(6),
    suggested_items: z.array(z.string().trim().min(1).max(240)).max(6),
    confidence,
  })
  .strict();

export type OutfitAnalysisReport = z.infer<typeof outfitAnalysisReportSchema>;

export const outfitUploadSchema = z.object({
  image_path: z.string().min(3).max(512),
  consent_storage: z.literal(true),
  consent_ai_processing: z.enum(["granted", "denied"]),
  title: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || undefined),
  occasion: occasion.optional().nullable(),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => value || undefined),
  bytes: z.number().int().positive().max(MAX_OUTFIT_BYTES).optional(),
  mime_type: z.enum(ALLOWED_OUTFIT_MIME_TYPES).optional(),
});

export type OutfitUpload = z.infer<typeof outfitUploadSchema>;

export const startAnalysisSchema = z.object({
  outfit_id: z.uuid(),
  feedback_depth: feedbackDepth,
  occasion: occasion.optional().nullable(),
});

export type StartAnalysis = z.infer<typeof startAnalysisSchema>;

export const saveLookSchema = z.object({
  outfit_id: z.uuid(),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => value || undefined),
});

export type SaveLook = z.infer<typeof saveLookSchema>;

export const followUpSchema = z.object({
  analysis_id: z.uuid(),
  question: z.string().trim().min(3).max(500),
});

export type FollowUp = z.infer<typeof followUpSchema>;

export const compareSchema = z.object({
  outfit_a_id: z.uuid(),
  outfit_b_id: z.uuid(),
}).refine((value) => value.outfit_a_id !== value.outfit_b_id, {
  message: "Choose two different outfits to compare.",
});

export type CompareInput = z.infer<typeof compareSchema>;

export const followUpAnswerSchema = z
  .object({
    answer: z.string().trim().min(1).max(1200),
  })
  .strict();

export const compareReportSchema = z
  .object({
    summary: z.string().trim().min(1).max(800),
    prefer: z.enum(["a", "b", "tie"]),
    reasons: z.array(z.string().trim().min(1).max(240)).min(1).max(6),
  })
  .strict();
