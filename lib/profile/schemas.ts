import { z } from "zod";

export const profileUpdateSchema = z.object({
  display_name: z.string().trim().min(1).max(80),
  country: z.string().length(2),
  language: z.string().min(2).max(16),
  currency: z.string().length(3),
  timezone: z.string().min(1).max(64),
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
