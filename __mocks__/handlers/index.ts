// __mocks__/handlers/index.ts
import { registerHandler } from "./register";
import { resetPasswordConfirmHandler } from "./resetPasswordConfirm";
import { resetPasswordRequestHandler } from "./resetPasswordRequest";
import { userUpdateEmailHandler } from "./userUpdateEmail";
import { userUpdateFirstLoginHandler } from "./updateFirstLogin";
import { verifyEmailHandler } from "./verifyEmail";
import { weightCreateHandler } from "./weightCreate";
import { weightDeleteHandler } from "./weightDelete";
import { weightGetCurrentGoalHandler } from "./weightGetCurrentGoal";
import { weightGetGoalsHandler } from "./weightGetGoals";
import { weightGetWeightsHandler } from "./weightGetWeights";
import { weightSetGoalHandler } from "./weightSetGoal";
import { weightUpdateGoalHandler } from "./weightUpdateGoal";

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
};
