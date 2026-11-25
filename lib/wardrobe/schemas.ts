import { z } from "zod";

import {
  MAX_GENERATE_COUNT,
  MIN_ITEMS_FOR_GENERATE,
  WARDROBE_CATEGORIES,
  WARDROBE_OCCASIONS,
  optionValues,
} from "@/lib/wardrobe/options";

export const ALLOWED_WARDROBE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_WARDROBE_BYTES = 8 * 1024 * 1024;

const category = z.enum(
  optionValues(WARDROBE_CATEGORIES) as [string, ...string[]],
);
const occasion = z.enum(
  optionValues(WARDROBE_OCCASIONS) as [string, ...string[]],
);

export const wardrobeUploadSchema = z.object({
  image_path: z.string().min(3).max(512),
  consent_storage: z.literal(true),
  consent_ai_processing: z.enum(["granted", "denied"]),
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || undefined),
  category: category.optional().nullable(),
  color: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => value || undefined),
  brand: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => value || undefined),
  bytes: z.number().int().positive().max(MAX_WARDROBE_BYTES).optional(),
  mime_type: z.enum(ALLOWED_WARDROBE_MIME_TYPES).optional(),
});

export type WardrobeUpload = z.infer<typeof wardrobeUploadSchema>;

export const wardrobeItemUpdateSchema = z.object({
  item_id: z.uuid(),
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || undefined),
  category: category.optional().nullable(),
  color: z
    .string()
    .trim()
    .max(80)
    .optional()
    .nullable()
    .transform((value) => value || null),
  brand: z
    .string()
    .trim()
    .max(80)
    .optional()
    .nullable()
    .transform((value) => value || null),
});

export type WardrobeItemUpdate = z.infer<typeof wardrobeItemUpdateSchema>;

export const wardrobeCategorizeResultSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    category,
    color: z.string().trim().min(1).max(80),
    brand: z.string().trim().max(80).optional().nullable(),
    attributes: z
      .array(
        z.object({
          key: z.string().trim().min(1).max(64),
          value: z.string().trim().min(1).max(240),
        }),
      )
      .max(12)
      .default([]),
  })
  .strict();

export type WardrobeCategorizeResult = z.infer<
  typeof wardrobeCategorizeResultSchema
>;

export const combinationCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  occasion: occasion.optional().nullable(),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => value || undefined),
  item_ids: z.array(z.uuid()).min(1).max(12),
  is_favorite: z.boolean().optional().default(false),
});

export type CombinationCreate = z.infer<typeof combinationCreateSchema>;

export const combinationUpdateSchema = z.object({
  combination_id: z.uuid(),
  title: z.string().trim().min(1).max(120).optional(),
  occasion: occasion.optional().nullable(),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable()
    .transform((value) => value || null),
  item_ids: z.array(z.uuid()).min(1).max(12).optional(),
  is_favorite: z.boolean().optional(),
});

export type CombinationUpdate = z.infer<typeof combinationUpdateSchema>;

export const generateCombinationsInputSchema = z.object({
  occasion: occasion.optional().nullable(),
  count: z
    .number()
    .int()
    .min(1)
    .max(MAX_GENERATE_COUNT)
    .optional()
    .default(MAX_GENERATE_COUNT),
});

export type GenerateCombinationsInput = z.infer<
  typeof generateCombinationsInputSchema
>;

export const generatedCombinationSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    occasion: z.union([occasion, z.literal("unknown")]).optional(),
    rationale: z.string().trim().min(1).max(400),
    item_ids: z.array(z.uuid()).min(2).max(8),
  })
  .strict();

export const generateCombinationsResultSchema = z
  .object({
    combinations: z
      .array(generatedCombinationSchema)
      .min(1)
      .max(MAX_GENERATE_COUNT),
  })
  .strict();

export type GenerateCombinationsResult = z.infer<
  typeof generateCombinationsResultSchema
>;

export const calendarAssignSchema = z.object({
  combination_id: z.uuid(),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value || undefined),
});

export type CalendarAssign = z.infer<typeof calendarAssignSchema>;

export { MIN_ITEMS_FOR_GENERATE };
