// __mocks__/handlers/weightGetGoals.ts
import { http, HttpResponse } from "msw";
import { createTRPCErrorResponse, verifyJWT } from "../utils";

export const weightGetGoalsHandler = http.get(
  "http://localhost:8888/.netlify/functions/trpc/weight.getGoals",
  async ({ request }) => {
    console.log("weight.getGoals handler called");

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return createTRPCErrorResponse(
        0,
        "Unauthorized: User must be logged in",
        -32001,
        401,
        "weight.getGoals"
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyJWT(token);
    if (!decoded) {
      console.error("Invalid token");
      return createTRPCErrorResponse(
        0,
        "Invalid token",
        -32001,
        401,
        "weight.getGoals"
      );
    }
    const { userId } = decoded;
    console.log("Decoded userId:", userId);

    if (userId === "test-user-id") {
      console.log("Returning goals for userId:", userId);
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
      console.log("No goals for userId:", userId);
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
      console.error("Simulating server error for userId:", userId);
      return createTRPCErrorResponse(
        0,
        "Failed to fetch goals",
        -32002,
        500,
        "weight.getGoals"
      );
    }

    console.error("Unauthorized userId:", userId);
    return createTRPCErrorResponse(
      0,
      "Unauthorized: Invalid user ID",
      -32001,
      401,
      "weight.getGoals"
    );
  }
);
