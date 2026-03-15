import { initTRPC, TRPCError } from "@trpc/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify, createRemoteJWKSet } from "jose";

import { weightRouter } from "./routers/weight";
import { healthRouter, userRouter } from "@steel-cut/trpc-shared/server";

let prismaClient: PrismaClient | undefined;

function getPrisma(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL environment variable");
}

const JWKS = createRemoteJWKSet(
  new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
);
const ISSUER = `${SUPABASE_URL}/auth/v1`;

export function extractToken(req: Request): string | null {
  const header =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export async function verifyTokenAndGetUserId(
  token: string | null,
): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: "authenticated",
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch (err) {
    console.warn("JWT verification failed:", err);
    return null;
  }
}

export interface Context {
  prisma: PrismaClient;
  userId: string | null;
}

export async function createContext({
  req,
}: {
  req: Request;
}): Promise<Context> {
  const token = extractToken(req);
  const userId = await verifyTokenAndGetUserId(token);
  return { prisma: getPrisma(), userId };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const createCallerFactory = t.createCallerFactory;

export const appRouter = router({
  user: userRouter,
  health: healthRouter,
  weight: weightRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
