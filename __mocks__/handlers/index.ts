import { weightDeleteHandler } from "./weightDelete";
import { weightGetWeightsHandler } from "./weightGetWeights";
import { weightGetCurrentGoalHandler } from "./weightGetCurrentGoal";
import { weightSetGoalHandler } from "./weightSetGoal";
import { weightUpdateGoalHandler } from "./weightUpdateGoal";
import { weightGetGoalsHandler } from "./weightGetGoals";
import { resetPasswordConfirmHandler } from "./resetPasswordConfirm";
import { resetPasswordRequestHandler } from "./resetPasswordRequest";
import { verifyEmailHandler } from "./verifyEmail";
import { userUpdateEmailHandler } from "./userUpdateEmail";
import { weightCreateHandler } from "./weightCreate";
import { userUpdateFirstLoginHandler } from "./updateFirstLogin";

export const handlers = [
  userUpdateFirstLoginHandler,
  weightGetGoalsHandler,
  verifyEmailHandler,
  weightDeleteHandler,
  weightGetWeightsHandler,
  weightGetCurrentGoalHandler,
  weightSetGoalHandler,
  weightUpdateGoalHandler,
  resetPasswordConfirmHandler,
  resetPasswordRequestHandler,
  userUpdateEmailHandler,
  weightCreateHandler,
];

export {
  userUpdateFirstLoginHandler,
  weightGetGoalsHandler,
  verifyEmailHandler,
  weightDeleteHandler,
  weightGetWeightsHandler,
  weightGetCurrentGoalHandler,
  weightSetGoalHandler,
  weightUpdateGoalHandler,
  resetPasswordConfirmHandler,
  resetPasswordRequestHandler,
  userUpdateEmailHandler,
  weightCreateHandler,
};
