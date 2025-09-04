import { initTRPC } from '@trpc/server';
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import type { IncomingMessage } from "http";
import { registerRouter } from './routers/register';
import { loginRouter } from './routers/login';
import { verifyEmailRouter } from './routers/verifyEmail';
import { weightRouter } from './routers/weight';
import { resetPasswordRouter } from './routers/resetPassword';
import { refreshTokenRouter } from './routers/refreshToken';
import { userRouter } from './routers/user';

export type Context = {
  prisma: PrismaClient;
  userId?: string;
  email?: string;
};

export function createContext({ req }: { req: IncomingMessage }): Context {
  let userId: string | undefined;
  let email: string | undefined;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1];
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      ) as {
        userId: string;
        email: string;
        iat: number;
        exp: number;
      };
      userId = decoded.userId;
      email = decoded.email;
    } catch {
      void 0;
    }
  }

  return { prisma: new PrismaClient(), userId, email };
}

export const t = initTRPC.context<Context>().create();

export const appRouter = t.router({
  user: userRouter,
  register: registerRouter.register,
  login: loginRouter.login,
  verifyEmail: verifyEmailRouter.verifyEmail,
  weight: weightRouter,
  resetPassword: resetPasswordRouter,
  refreshToken: refreshTokenRouter,
});

export type AppRouter = typeof appRouter;