// server/routers/resetPassword.ts
import { t } from '../trpc-base';
import { z } from 'zod';
import crypto from 'crypto';
import { sendResetPasswordEmail } from '../email';
import bcrypt from 'bcryptjs';

export const resetPasswordRouter = t.router({
  request: t.procedure
    .input(
      z.object({
        email: z.string().email({ message: 'Invalid email address' }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email } = input;

      const user = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Return success to avoid leaking user existence
        return { message: 'If the email exists, a reset link has been sent.' };
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
        throw new Error('Failed to send reset email');
      }

      return { message: 'Reset link sent to your email' };
    }),
  confirm: t.procedure
    .input(
      z.object({
        token: z.string().min(1, { message: 'Reset token is required' }),
        newPassword: z.string().min(8, { message: 'Password must be at least 8 characters' }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          resetPasswordToken: input.token,
          resetPasswordTokenExpiresAt: { gt: new Date() },
        },
      });

      if (!user) {
        throw new Error('Invalid or expired token');
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 10);
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordTokenExpiresAt: null,
        },
      });

      return { message: 'Password reset successfully' };
    }),
});