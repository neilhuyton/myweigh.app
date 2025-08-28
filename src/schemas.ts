import { z } from "zod";

export const verifyEmailSearchSchema = z.object({
  token: z.string().uuid().optional(),
});

export const confirmResetPasswordSearchSchema = z.object({
  token: z.string().uuid().optional(),
});
