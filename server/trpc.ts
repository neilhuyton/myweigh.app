// server/trpc.ts

import { router, createCallerFactory, publicProcedure } from "./trpc-base";
import { userRouter } from "./routers/user";
import { weightRouter } from "./routers/weight";

export const healthRouter = router({
  ping: publicProcedure.query(async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }),
});

export const appRouter = router({
  user: userRouter,

  weight: weightRouter,

  health: healthRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
