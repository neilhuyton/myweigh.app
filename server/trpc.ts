import { t } from "./trpc-base";
import { userRouter } from "./routers/user";
import { registerRouter } from "./routers/register";
import { loginRouter } from "./routers/login";
import { verifyEmailRouter } from "./routers/verifyEmail";
import { weightRouter } from "./routers/weight";
import { resetPasswordRouter } from "./routers/resetPassword";

export const appRouter = t.router({
  getUsers: userRouter.getUsers,
  register: registerRouter.register,
  login: loginRouter.login,
  verifyEmail: verifyEmailRouter.verifyEmail,
  weight: weightRouter,
  resetPassword: resetPasswordRouter,
});

export type AppRouter = typeof appRouter;
