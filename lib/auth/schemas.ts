import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

export const emailOnlySchema = z.object({
  email: z.email(),
});

export const newPasswordSchema = z.object({
  password: z.string().min(8).max(72),
});
