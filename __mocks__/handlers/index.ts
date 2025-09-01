// __mocks__/handlers/index.ts
import { verifyEmailHandler } from './verifyEmail';
import { forgotPasswordHandler } from './forgotPassword';
import { resetPasswordConfirmHandler } from './resetPasswordConfirm';
import { resetPasswordRequestHandler } from './resetPasswordRequest';
import { registerHandler } from './register';
import { loginHandler } from './login';
import { weightCreateHandler } from './weightCreate';
import { weightDeleteHandler } from './weightDelete';
import { weightGetWeightsHandler } from './weightGetWeights';
import { weightGetCurrentGoalHandler } from './weightGetCurrentGoal';
import { catchAllHandler } from './catchAll';
import { refreshTokenHandler } from './refreshToken';
import { weightSetGoalHandler } from './weightSetGoal';
import { weightUpdateGoalHandler } from './weightUpdateGoal';

export const handlers = [
  verifyEmailHandler,
  forgotPasswordHandler,
  resetPasswordConfirmHandler,
  resetPasswordRequestHandler,
  registerHandler,
  loginHandler,
  weightCreateHandler,
  weightDeleteHandler,
  weightGetWeightsHandler,
  weightGetCurrentGoalHandler,
  weightSetGoalHandler,
  weightUpdateGoalHandler,
  catchAllHandler,
  refreshTokenHandler,
];

// Explicitly export handlers to avoid TypeScript errors
export {
  verifyEmailHandler,
  forgotPasswordHandler,
  resetPasswordConfirmHandler,
  resetPasswordRequestHandler,
  registerHandler,
  loginHandler,
  weightCreateHandler,
  weightDeleteHandler,
  weightGetWeightsHandler,
  weightGetCurrentGoalHandler,
  weightSetGoalHandler,
  weightUpdateGoalHandler,
  catchAllHandler,
  refreshTokenHandler,
};