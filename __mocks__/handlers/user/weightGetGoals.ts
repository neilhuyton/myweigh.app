// __mocks__/handlers/weightGetGoals.ts
import { http, HttpResponse } from "msw";
import {
  authenticateRequest,
  createTRPCErrorResponse,
  type AuthenticatedUser,
} from "../../utils";

export const weightGetGoalsHandler = http.get(
  "http://localhost:8888/.netlify/functions/trpc/weight.getGoals",
  async ({ request }) => {
    // Use the reusable authentication utility
    const authResult = authenticateRequest(request, "weight.getGoals");
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
            data: [
              {
                id: "550e8400-e29b-41d4-a716-446655440000",
                goalWeightKg: 65.0,
                goalSetAt: "2025-08-28T00:00:00Z",
                reachedAt: null,
              },
              {
                id: "123e4567-e89b-12d3-a456-426614174000",
                goalWeightKg: 70.0,
                goalSetAt: "2025-08-27T00:00:00Z",
                reachedAt: "2025-08-27T12:00:00Z",
              },
            ],
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
            data: [],
          },
        },
        { status: 200 }
      );
    }

    if (userId === "error-user-id") {
      return createTRPCErrorResponse(
        0,
        "Failed to fetch goals",
        -32002,
        500,
        "weight.getGoals"
      );
    }

    return createTRPCErrorResponse(
      0,
      "Unauthorized: Invalid user ID",
      -32001,
      401,
      "weight.getGoals"
    );
  }
);
