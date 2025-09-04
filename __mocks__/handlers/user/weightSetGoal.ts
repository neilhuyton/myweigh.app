// __mocks__/handlers/weightSetGoal.ts
import { http, HttpResponse } from "msw";
import { z } from "zod";
import {
  authenticateRequest,
  createTRPCErrorResponse,
  withBodyParsing,
  type AuthenticatedUser,
} from "../../utils";

const twoDecimalPlaces = z
  .number()
  .positive({ message: "Weight must be a positive number" })
  .refine(
    (val) => {
      const decimalPlaces = val.toString().split(".")[1]?.length || 0;
      return decimalPlaces <= 2;
    },
    { message: "Weight can have up to two decimal places" }
  );

const goalInputSchema = z.object({
  goalWeightKg: twoDecimalPlaces,
});

export const weightSetGoalHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/weight.setGoal",
  withBodyParsing(goalInputSchema, "weight.setGoal", async (body, request) => {
    // Use the reusable authentication utility
    const authResult = authenticateRequest(request, "weight.setGoal");
    if (authResult instanceof HttpResponse) {
      return authResult; // Return error response if authentication fails
    }
    const { userId } = authResult as AuthenticatedUser;

    const { goalWeightKg } = body;

    if (userId === "test-user-id" || userId === "empty-user-id") {
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: {
              id:
                userId === "test-user-id"
                  ? "550e8400-e29b-41d4-a716-446655440000"
                  : "123e4567-e89b-12d3-a456-426614174000",
              goalWeightKg: Number(goalWeightKg.toFixed(2)),
              goalSetAt: new Date().toISOString(),
              reachedAt: null,
            },
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
      "weight.setGoal"
    );
  })
);
