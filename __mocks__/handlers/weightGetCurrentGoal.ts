import { http, HttpResponse } from "msw";
import jwt from "jsonwebtoken";

export const weightGetCurrentGoalHandler = http.get(
  "http://localhost:8888/.netlify/functions/trpc/weight.getCurrentGoal",
  async ({ request }) => {
    console.log("weight.getCurrentGoal handler called");
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Unauthorized: User must be logged in",
            code: -32001,
            data: { code: "UNAUTHORIZED", httpStatus: 401, path: "weight.getCurrentGoal" },
          },
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    let userId: string | null = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string };
      userId = decoded.userId;
      console.log("Decoded userId:", userId);
    } catch {
      console.error("Invalid token");
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Invalid token",
            code: -32001,
            data: { code: "UNAUTHORIZED", httpStatus: 401, path: "weight.getCurrentGoal" },
          },
        },
        { status: 401 }
      );
    }

    if (userId === "test-user-id") {
      console.log("Returning existing goal for test-user-id");
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: {
              id: "1",
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
      console.log("Returning null for empty-user-id (no goal)");
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
    return HttpResponse.json(
      {
        id: 0,
        error: {
          message: "Unauthorized: Invalid user ID",
          code: -32001,
          data: { code: "UNAUTHORIZED", httpStatus: 401, path: "weight.getCurrentGoal" },
        },
      },
      { status: 401 }
    );
  }
);