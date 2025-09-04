// __mocks__/handlers/weightUpdateGoal.ts
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

const weightGoalInputSchema = z.object({
  goalId: z.string().uuid({ message: "Invalid goal ID" }),
  goalWeightKg: twoDecimalPlaces,
});

export const weightUpdateGoalHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/weight.updateGoal",
  withBodyParsing(
    weightGoalInputSchema,
    "weight.updateGoal",
    async (body, request) => {
      // Use the reusable authentication utility
      const authResult = authenticateRequest(request, "weight.updateGoal");
      if (authResult instanceof HttpResponse) {
        return authResult; // Return error response if authentication fails
      }
      const { userId } = authResult as AuthenticatedUser;

      const { goalId, goalWeightKg } = body;

      if (userId === "test-user-id") {
        return HttpResponse.json(
          {
            id: 0,
            result: {
              type: "data",
              data: {
                id: goalId,
                goalWeightKg: Number(goalWeightKg.toFixed(2)),
                goalSetAt: new Date().toISOString(),
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
        "weight.updateGoal"
      );
    }
  )
);
