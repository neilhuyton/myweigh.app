// __mocks__/handlers/weightUpdateGoal.ts
import { http, HttpResponse } from "msw";
import { z } from "zod";
import { parseBody, createTRPCErrorResponse, verifyJWT } from "../utils";

// Match server’s twoDecimalPlaces validator
const twoDecimalPlaces = z
  .number()
  .positive({ message: "Weight must be a positive number" })
  .refine(
    (val) => {
      const decimalPlaces = (val.toString().split(".")[1]?.length || 0);
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
  async ({ request }) => {
    console.log("weight.updateGoal handler called");

    let body: { goalId: string; goalWeightKg: number };
    try {
      body = await parseBody(request, weightGoalInputSchema, "weight.updateGoal");
      console.log("Parsed body:", JSON.stringify(body));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error parsing request body";
      console.error(message);
      return createTRPCErrorResponse(0, message, -32600, 400, "weight.updateGoal");
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return createTRPCErrorResponse(0, "Unauthorized: User must be logged in", -32001, 401, "weight.updateGoal");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyJWT(token);
    if (!decoded) {
      console.error("Invalid token");
      return createTRPCErrorResponse(0, "Invalid token", -32001, 401, "weight.updateGoal");
    }
    const { userId } = decoded;
    console.log("Decoded userId:", userId);

    const { goalId, goalWeightKg } = body;

    if (userId === "test-user-id") {
      console.log("Returning success response for userId:", userId);
      return HttpResponse.json(
        {
          id: 0, // Client doesn’t send id, so use 0
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

    console.error("Unauthorized userId:", userId);
    return createTRPCErrorResponse(0, "Unauthorized: Invalid user ID", -32001, 401, "weight.updateGoal");
  }
);