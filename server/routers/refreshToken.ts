// server/routers/refreshToken.ts
import { t } from '../trpc-base';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

export const refreshTokenRouter = t.router({
  refresh: t.procedure
    .input(z.object({ refreshToken: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { refreshToken } = input;

      const user = await ctx.prisma.user.findFirst({
        where: { refreshToken },
      });

      if (!user) {
        throw new Error('Invalid refresh token');
      }

      const newAccessToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      return {
        token: newAccessToken,
        refreshToken,
      };
    }),
});