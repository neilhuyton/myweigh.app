// server/trpc.ts
import { t } from "./trpc-base";
import { loginRouter } from "./routers/login";
import { verifyEmailRouter } from "./routers/verifyEmail";
import { weightRouter } from "./routers/weight";
import { resetPasswordRouter } from "./routers/resetPassword";
import { refreshTokenRouter } from "./routers/refreshToken";
import { registerRouter } from "./routers/register";

export const appRouter = t.router({
  register: registerRouter.register,
  login: loginRouter.login,
  verifyEmail: verifyEmailRouter.verifyEmail,
  weight: weightRouter,
  resetPassword: resetPasswordRouter,
  refreshToken: refreshTokenRouter,
});

export type AppRouter = typeof appRouter;
