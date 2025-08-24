// __mocks__/handlers/index.ts
import { getUsersHandler } from "./getUsers";
import { weightGetWeightsHandler } from "./weightGetWeights";
import { weightGetGoalHandler } from "./weightGetGoal";
import { verifyEmailHandler } from "./verifyEmail";
import { forgotPasswordHandler } from "./forgotPassword";
import { resetPasswordConfirmHandler } from "./resetPasswordConfirm";
import { resetPasswordRequestHandler } from "./resetPasswordRequest";
import { registerHandler } from "./register";
import { loginHandler } from "./login";
import { weightCreateHandler } from "./weightCreate";
import { weightDeleteHandler } from "./weightDelete";
import { weightSetGoalHandler } from "./weightSetGoal";
import { catchAllHandler } from "./catchAll";

export const handlers = [
  getUsersHandler,
  weightGetWeightsHandler,
  weightGetGoalHandler,
  verifyEmailHandler,
  forgotPasswordHandler,
  resetPasswordConfirmHandler,
  resetPasswordRequestHandler,
  registerHandler,
  loginHandler,
  weightCreateHandler,
  weightDeleteHandler,
  weightSetGoalHandler,
  catchAllHandler,
];
