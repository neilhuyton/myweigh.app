// server/trpc-base.ts
import { initTRPC } from '@trpc/server';
import type { Context } from './context';

// Initialize TRPC with context
const t = initTRPC.context<Context>().create();

export { t };