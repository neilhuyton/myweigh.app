// __mocks__/handlers/weightGetCurrentGoal.ts
import { http, HttpResponse } from "msw";
import { createTRPCErrorResponse, verifyJWT } from "../utils";

export const weightGetCurrentGoalHandler = http.get(
  "http://localhost:8888/.netlify/functions/trpc/weight.getCurrentGoal",
  async ({ request }) => {
    console.log("weight.getCurrentGoal handler called");

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return createTRPCErrorResponse(0, "Unauthorized: User must be logged in", -32001, 401, "weight.getCurrentGoal");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyJWT(token);
    if (!decoded) {
      console.error("Invalid token");
      return createTRPCErrorResponse(0, "Invalid token", -32001, 401, "weight.getCurrentGoal");
    }
    const { userId } = decoded;
    console.log("Decoded userId:", userId);

    if (userId === "test-user-id") {
      console.log("Returning current goal for userId:", userId);
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: {
              id: "550e8400-e29b-41d4-a716-446655440000", // Use a valid UUID
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
      console.log("No current goal for userId:", userId);
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

    console.error("Unauthorized userId:", userId);
    return createTRPCErrorResponse(0, "Unauthorized: Invalid user ID", -32001, 401, "weight.getCurrentGoal");
  }
);