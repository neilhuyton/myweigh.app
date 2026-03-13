import { router, createCallerFactory } from "@steel-cut/trpc-auth/server";
import { userRouter, healthRouter } from "@steel-cut/trpc-auth/server";
import { weightRouter } from "./routers/weight";

export const appRouter = router({
  user: userRouter,
  health: healthRouter,
  weight: weightRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
