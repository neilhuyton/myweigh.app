// server/routers/login.ts
import { t } from "../trpc-base";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const loginRouter = t.router({
  login: t.procedure
    .input(
      z.object({
        email: z.string().email({ message: "Invalid email address" }),
        password: z
          .string()
          .min(8, { message: "Password must be at least 8 characters" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      const user = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error("Invalid email or password");
      }

      if (!user.isEmailVerified) {
        throw new Error("Please verify your email before logging in");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      // Generate JWT access token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "1h" }
      );

      // Generate and store refresh token
      const refreshToken = crypto.randomUUID();
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      return {
        id: user.id,
        email: user.email,
        token,
        refreshToken,
      };
    }),
});