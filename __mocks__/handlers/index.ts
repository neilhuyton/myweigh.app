// __mocks__/handlers/index.ts
import { getUsersHandler } from "./getUsers";
import { verifyEmailHandler } from "./verifyEmail";
import { forgotPasswordHandler } from "./forgotPassword";
import { resetPasswordConfirmHandler } from "./resetPasswordConfirm";
import { resetPasswordRequestHandler } from "./resetPasswordRequest";
import { registerHandler } from "./register";
import { loginHandler } from "./login";
import { weightCreateHandler } from "./weightCreate";
import { weightDeleteHandler } from "./weightDelete";
import { weightGetWeightsHandler } from "./weightGetWeights"; // New combined handler
import { catchAllHandler } from "./catchAll";
import { refreshTokenHandler } from "./refreshToken";

export const handlers = [
  getUsersHandler,
  verifyEmailHandler,
  forgotPasswordHandler,
  resetPasswordConfirmHandler,
  resetPasswordRequestHandler,
  registerHandler,
  loginHandler,
  weightCreateHandler,
  weightDeleteHandler,
  // ...weightHandlers, // Spread the combined weight handlers
  weightGetWeightsHandler,
  catchAllHandler,
  refreshTokenHandler,
];
