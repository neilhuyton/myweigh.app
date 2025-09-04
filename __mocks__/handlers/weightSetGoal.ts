// __mocks__/handlers/weightSetGoal.ts
import { http, HttpResponse } from "msw";
import { z } from "zod";
import { parseBody, createTRPCErrorResponse, verifyJWT } from "../utils";

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

const goalInputSchema = z.object({
  goalWeightKg: twoDecimalPlaces,
});

export const weightSetGoalHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/weight.setGoal",
  async ({ request }) => {
    console.log("weight.setGoal handler called");

    let body: { goalWeightKg: number };
    try {
      body = await parseBody(request, goalInputSchema, "weight.setGoal");
      console.log("Parsed body:", JSON.stringify(body));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error parsing request body";
      console.error(message);
      return createTRPCErrorResponse(0, message, -32600, 400, "weight.setGoal");
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return createTRPCErrorResponse(0, "Unauthorized: User must be logged in", -32001, 401, "weight.setGoal");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyJWT(token);
    if (!decoded) {
      console.error("Invalid token");
      return createTRPCErrorResponse(0, "Invalid token", -32001, 401, "weight.setGoal");
    }
    const { userId } = decoded;
    console.log("Decoded userId:", userId);

    const { goalWeightKg } = body;

    if (userId === "test-user-id" || userId === "empty-user-id") {
      console.log("Returning success response for userId:", userId);
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: {
              id: userId === "test-user-id" ? "550e8400-e29b-41d4-a716-446655440000" : "123e4567-e89b-12d3-a456-426614174000",
              goalWeightKg: Number(goalWeightKg.toFixed(2)),
              goalSetAt: new Date().toISOString(),
              reachedAt: null,
            },
          },
        },
        { status: 200 }
      );
    }

    console.error("Unauthorized userId:", userId);
    return createTRPCErrorResponse(0, "Unauthorized: Invalid user ID", -32001, 401, "weight.setGoal");
  }
);