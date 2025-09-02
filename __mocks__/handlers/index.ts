import { loginHandler } from "./login";
import { weightDeleteHandler } from "./weightDelete";
import { weightGetWeightsHandler } from "./weightGetWeights";
import { weightGetCurrentGoalHandler } from "./weightGetCurrentGoal";
import { weightSetGoalHandler } from "./weightSetGoal";
import { weightUpdateGoalHandler } from "./weightUpdateGoal";
import { weightGetGoalsHandler } from "./weightGetGoals";
import { refreshTokenHandler } from "./refreshToken";
import { resetPasswordConfirmHandler } from "./resetPasswordConfirm";
import { resetPasswordRequestHandler } from "./resetPasswordRequest";
import { verifyEmailHandler } from "./verifyEmail";

export const handlers = [
  verifyEmailHandler,
  loginHandler,
  weightDeleteHandler,
  weightGetWeightsHandler,
  weightGetCurrentGoalHandler,
  weightSetGoalHandler,
  weightUpdateGoalHandler,
  weightGetGoalsHandler,
  refreshTokenHandler,
  resetPasswordConfirmHandler,
  resetPasswordRequestHandler,
];

export {
  verifyEmailHandler,
  loginHandler,
  weightDeleteHandler,
  weightGetWeightsHandler,
  weightGetCurrentGoalHandler,
  weightSetGoalHandler,
  weightUpdateGoalHandler,
  weightGetGoalsHandler,
  refreshTokenHandler,
  resetPasswordConfirmHandler,
  resetPasswordRequestHandler,
};
