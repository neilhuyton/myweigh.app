// server/context.ts
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import type { IncomingMessage } from "http";

const prisma = new PrismaClient();

export type Context = {
  prisma: PrismaClient;
  userId?: string;
};

export function createContext({ req }: { req: IncomingMessage }): Context {
  let userId: string | undefined;
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
    } catch (error) {
      console.error("JWT verification failed:", error);
      // Let protected routes handle unauthorized errors
    }
  }
  return { prisma, userId };
}
