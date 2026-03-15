import { router, createCallerFactory } from "@steel-cut/trpc-shared/server";
import { userRouter, healthRouter } from "@steel-cut/trpc-shared/server";
import { weightRouter } from "./routers/weight";

export const appRouter = router({
  user: userRouter,
  health: healthRouter,
  weight: weightRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
