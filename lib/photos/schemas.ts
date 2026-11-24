import { z } from "zod";

import { PHOTO_TYPES, optionValues } from "@/lib/style-profile/options";

export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

const photoType = z.enum(optionValues(PHOTO_TYPES) as [string, ...string[]]);

export const photoRegisterSchema = z.object({
  photo_type: photoType,
  storage_path: z.string().min(3).max(512),
  consent_storage: z.literal(true),
  bytes: z.number().int().positive().max(MAX_PHOTO_BYTES).optional(),
  mime_type: z.enum(ALLOWED_PHOTO_MIME_TYPES).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type PhotoRegister = z.infer<typeof photoRegisterSchema>;
