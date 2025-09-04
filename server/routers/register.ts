// server/routers/register.ts
import { t } from '../trpc-base';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../email';

export const registerRouter = t.router({
  register: t.procedure
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

      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = crypto.randomUUID();
      const refreshToken = crypto.randomUUID();

      const user = await ctx.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          verificationToken,
          refreshToken,
          isEmailVerified: false,
        },
      });

      const emailResult = await sendVerificationEmail(email, verificationToken);
      if (!emailResult.success) {
        throw new Error('Failed to send verification email');
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      return {
        id: user.id,
        email: user.email,
        token,
        refreshToken,
        message: 'Registration successful! Please check your email to verify your account.',
      };
    }),
});