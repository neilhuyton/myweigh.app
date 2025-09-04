import { http, HttpResponse } from "msw";
import jwt from "jsonwebtoken";

// Define the expected shape of the request body
interface GoalInput {
  goalWeightKg?: number;
  input?: { goalWeightKg?: number };
  id?: number;
}

export const weightSetGoalHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/weight.setGoal",
  async ({ request }) => {
    console.log("weight.setGoal handler called");
    let body: unknown;
    try {
      body = await request.json();
      console.log("Request body:", JSON.stringify(body));
    } catch {
      console.error("Failed to parse request body");
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Failed to parse request body",
            code: -32600,
            data: {
              code: "BAD_REQUEST",
              httpStatus: 400,
              path: "weight.setGoal",
            },
          },
        },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Unauthorized: User must be logged in",
            code: -32001,
            data: {
              code: "UNAUTHORIZED",
              httpStatus: 401,
              path: "weight.setGoal",
            },
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
            data: {
              code: "UNAUTHORIZED",
              httpStatus: 401,
              path: "weight.setGoal",
            },
          },
        },
        { status: 401 }
      );
    }

    let goalWeightKg: number | undefined;
    let id: number = 0;

    // Handle different possible body formats
    if (Array.isArray(body)) {
      const firstItem = body[0] as GoalInput | undefined;
      goalWeightKg = firstItem?.input?.goalWeightKg ?? firstItem?.goalWeightKg;
      id = firstItem?.id ?? 0;
    } else if (body && typeof body === "object") {
      const bodyObj = body as GoalInput;
      goalWeightKg = bodyObj.input?.goalWeightKg ?? bodyObj.goalWeightKg;
      id = bodyObj.id ?? 0;
    }

    console.log("Goal weight:", goalWeightKg);

    if (goalWeightKg === undefined || goalWeightKg === null || isNaN(goalWeightKg) || goalWeightKg <= 0) {
      console.error("Invalid goal weight:", goalWeightKg);
      return HttpResponse.json(
        {
          id,
          error: {
            message: "Goal weight must be a positive number",
            code: -32001,
            data: {
              code: "BAD_REQUEST",
              httpStatus: 400,
              path: "weight.setGoal",
            },
          },
        },
        { status: 400 }
      );
    }

    const goalWeightStr = goalWeightKg.toString();
    const decimalPlaces = (goalWeightStr.split(".")[1]?.length || 0);
    if (decimalPlaces > 2) {
      console.error("Goal weight has too many decimal places:", decimalPlaces);
      return HttpResponse.json(
        {
          id,
          error: {
            message: "Goal weight can have up to two decimal places",
            code: -32001,
            data: {
              code: "BAD_REQUEST",
              httpStatus: 400,
              path: "weight.setGoal",
            },
          },
        },
        { status: 400 }
      );
    }

    if (userId === "test-user-id" || userId === "empty-user-id") {
      console.log("Returning success response for userId:", userId);
      return HttpResponse.json(
        {
          id,
          result: {
            type: "data",
            data: {
              id: userId === "test-user-id" ? "2" : "goal-1",
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
    return HttpResponse.json(
      {
        id,
        error: {
          message: "Unauthorized: Invalid user ID",
          code: -32001,
          data: {
            code: "UNAUTHORIZED",
            httpStatus: 401,
            path: "weight.setGoal",
          },
        },
      },
      { status: 401 }
    );
  }
);