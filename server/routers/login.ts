import { t } from '../trpc-base';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export const loginRouter = t.router({
  login: t.procedure
    .input(
      z.object({
        email: z.string().email({ message: 'Invalid email address' }),
        password: z
          .string()
          .min(8, { message: 'Password must be at least 8 characters' }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      const user = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.isEmailVerified) {
        throw new Error('Please verify your email before logging in');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      return { id: user.id, email: user.email };
    }),
});