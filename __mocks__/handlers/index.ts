// __mocks__/handlers/index.ts
import { loginHandler } from "./auth/login";
import { refreshTokenHandler } from "./auth/refreshToken";
import { registerHandler } from "./auth/register";
import { resetPasswordConfirmHandler } from "./auth/resetPasswordConfirm";
import { resetPasswordRequestHandler } from "./auth/resetPasswordRequest";
import { userUpdateEmailHandler } from "./user/userUpdateEmail";
import { userUpdateFirstLoginHandler } from "./user/userUpdateFirstLogin";
import { verifyEmailHandler } from "./auth/verifyEmail";
import { weightCreateHandler } from "./user/weightCreate";
import { weightDeleteHandler } from "./user/weightDelete";
import { weightGetCurrentGoalHandler } from "./user/weightGetCurrentGoal";
import { weightGetGoalsHandler } from "./user/weightGetGoals";
import { weightGetWeightsHandler } from "./user/weightGetWeights";
import { weightSetGoalHandler } from "./user/weightSetGoal";
import { weightUpdateGoalHandler } from "./user/weightUpdateGoal";

export const handlers = [
  registerHandler,
  resetPasswordConfirmHandler,
  resetPasswordRequestHandler,
  userUpdateEmailHandler,
  userUpdateFirstLoginHandler,
  verifyEmailHandler,
  weightCreateHandler,
  weightDeleteHandler,
  weightGetCurrentGoalHandler,
  weightGetGoalsHandler,
  weightGetWeightsHandler,
  weightSetGoalHandler,
  weightUpdateGoalHandler,
  refreshTokenHandler,
  loginHandler,
];

export {
  registerHandler,
  resetPasswordConfirmHandler,
  resetPasswordRequestHandler,
  userUpdateEmailHandler,
  userUpdateFirstLoginHandler,
  verifyEmailHandler,
  weightCreateHandler,
  weightDeleteHandler,
  weightGetCurrentGoalHandler,
  weightGetGoalsHandler,
  weightGetWeightsHandler,
  weightSetGoalHandler,
  weightUpdateGoalHandler,
  refreshTokenHandler,
  loginHandler,
};
