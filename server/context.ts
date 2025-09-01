// server/context.ts
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import type { IncomingMessage } from "http";

const prisma = new PrismaClient();

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
      // Don’t throw; let procedures handle unauthenticated state
    }
  }

  return { prisma, userId, email };
}