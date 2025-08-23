import { t } from '../trpc-base';
import { z } from 'zod';

export const verifyEmailRouter = t.router({
  verifyEmail: t.procedure
    .input(
      z.object({
        token: z.string().uuid({ message: 'Invalid verification token' }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { token } = input;

      const user = await ctx.prisma.user.findFirst({
        where: { verificationToken: token },
      });

      if (!user) {
        const existingUser = await ctx.prisma.user.findFirst({
          where: { verificationToken: null, isEmailVerified: true },
          select: { email: true },
        });
        if (existingUser) {
          throw new Error('Email already verified');
        }
        throw new Error('Invalid verification token');
      }

      if (user.isEmailVerified) {
        throw new Error('Email already verified');
      }

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          verificationToken: null,
        },
      });

      return {
        message: 'Email verified successfully!',
      };
    }),
});