// __mocks__/handlers/index.ts
import { getUsersHandler } from './getUsers';
import { weightGetWeightsHandler } from './weightGetWeights';
import { weightGetGoalHandler } from './weightGetGoal';
import { verifyEmailHandler } from './verifyEmail';
import { forgotPasswordHandler } from './forgotPassword';
import { resetPasswordHandler } from './resetPassword';
import { registerHandler } from './register';
import { loginHandler } from './login';
import { weightCreateHandler } from './weightCreate';
import { weightDeleteHandler } from './weightDelete';
import { weightSetGoalHandler } from './weightSetGoal';
import { catchAllHandler } from './catchAll';

export const handlers = [
  getUsersHandler,
  weightGetWeightsHandler,
  weightGetGoalHandler,
  verifyEmailHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  registerHandler,
  loginHandler,
  weightCreateHandler,
  weightDeleteHandler,
  weightSetGoalHandler,
  catchAllHandler,
];