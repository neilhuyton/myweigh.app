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
import { authLogoutHandler } from "./authLogout";
import { userUpdateEmailHandler } from "./userUpdateEmail";

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
  authLogoutHandler,
  userUpdateEmailHandler,
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
  authLogoutHandler,
  userUpdateEmailHandler,
};
