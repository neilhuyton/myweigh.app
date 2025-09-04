// __mocks__/handlers/weightGetCurrentGoal.ts
import { http, HttpResponse } from "msw";
import {
  authenticateRequest,
  createTRPCErrorResponse,
  type AuthenticatedUser,
} from "../utils";

export const weightGetCurrentGoalHandler = http.get(
  "http://localhost:8888/.netlify/functions/trpc/weight.getCurrentGoal",
  async ({ request }) => {
    // Use the reusable authentication utility
    const authResult = authenticateRequest(request, "weight.getCurrentGoal");
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
            data: {
              id: "550e8400-e29b-41d4-a716-446655440000",
              goalWeightKg: 65.0,
              goalSetAt: "2025-08-28T00:00:00Z",
              reachedAt: null,
            },
          },
        },
        { status: 200 }
      );
    }

    if (userId === "empty-user-id") {
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: null,
          },
        },
        { status: 200 }
      );
    }

    return createTRPCErrorResponse(
      0,
      "Unauthorized: Invalid user ID",
      -32001,
      401,
      "weight.getCurrentGoal"
    );
  }
);
