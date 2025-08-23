// server/routers/resetPassword.ts
import { t } from "../trpc-base";
import { z } from "zod";
import crypto from "crypto";
import { sendResetPasswordEmail } from "../email";

export const resetPasswordRouter = t.router({
  request: t.procedure
    .input(
      z.object({
        email: z.string().email({ message: "Invalid email address" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email } = input;

      const user = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error("Email not found");
      }

      const resetToken = crypto.randomUUID();
      const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

      await ctx.prisma.user.update({
        where: { email },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordTokenExpiresAt: resetTokenExpiresAt,
        },
      });

      const emailResult = await sendResetPasswordEmail(email, resetToken);
      if (!emailResult.success) {
        throw new Error("Failed to send reset email");
      }

      return { message: "Reset link sent to your email" };
    }),
});
