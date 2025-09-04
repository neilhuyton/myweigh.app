// __mocks__/handlers/userUpdateFirstLogin.ts
import { http, HttpResponse } from "msw";
import { z } from "zod";
import {
  authenticateRequest,
  createTRPCErrorResponse,
  withBodyParsing,
  type AuthenticatedUser,
} from "../utils";

const updateFirstLoginInputSchema = z.object({
  isFirstLogin: z.boolean({ message: "isFirstLogin must be a boolean" }),
});

export const userUpdateFirstLoginHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/user.updateFirstLogin",
  withBodyParsing(
    updateFirstLoginInputSchema,
    "user.updateFirstLogin",
    async (body, request) => {
      // Use the reusable authentication utility
      const authResult = authenticateRequest(request, "user.updateFirstLogin");
      if (authResult instanceof HttpResponse) {
        return authResult; // Return error response if authentication fails
      }
      const { userId } = authResult as AuthenticatedUser;

      if (userId === "test-user-id") {
        return HttpResponse.json(
          {
            id: 0,
            result: {
              type: "data",
              data: { message: "First login status updated successfully" },
            },
          },
          { status: 200 }
        );
      }

      return createTRPCErrorResponse(
        0,
        "User not found",
        -32001,
        404,
        "user.updateFirstLogin"
      );
    },
    false
  ) // Disable Parsed body logging
);
