// server/trpc-base.ts
import { initTRPC } from '@trpc/server';
import { PrismaClient } from '@prisma/client';

// Define the context type
export type Context = {
  prisma: PrismaClient;
  userId?: string;
};

// Initialize TRPC with context
const t = initTRPC.context<Context>().create();

export { t };