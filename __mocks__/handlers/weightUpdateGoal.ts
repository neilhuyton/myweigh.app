import { http, HttpResponse } from "msw";
import jwt from "jsonwebtoken";

export const weightUpdateGoalHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/weight.updateGoal",
  async ({ request }) => {
    console.log("weight.updateGoal handler called");
    let body;
    try {
      body = await request.json();
      console.log("Request body:", JSON.stringify(body));
    } catch {
      console.error("Failed to parse request body");
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Invalid request body",
            code: -32600,
            data: {
              code: "BAD_REQUEST",
              httpStatus: 400,
              path: "weight.updateGoal",
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
              path: "weight.updateGoal",
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
              path: "weight.updateGoal",
            },
          },
        },
        { status: 401 }
      );
    }

    let goalId: string | undefined;
    let goalWeightKg: number | undefined;
    let id: number = 0;

    // Handle different possible body formats
    if (Array.isArray(body)) {
      goalId = body[0]?.input?.goalId ?? body[0]?.goalId;
      goalWeightKg = body[0]?.input?.goalWeightKg ?? body[0]?.goalWeightKg;
      id = body[0]?.id ?? 0;
    } else if (body && typeof body === "object") {
      goalId = (body as any).input?.goalId ?? (body as any).goalId;
      goalWeightKg = (body as any).input?.goalWeightKg ?? (body as any).goalWeightKg;
      id = (body as any).id ?? 0;
    }

    console.log("Goal ID:", goalId, "Goal weight:", goalWeightKg);

    if (!goalId || goalWeightKg === undefined || goalWeightKg <= 0) {
      console.error("Invalid goal ID or weight:", { goalId, goalWeightKg });
      return HttpResponse.json(
        {
          id,
          error: {
            message: "Goal ID and valid weight are required",
            code: -32001,
            data: {
              code: "BAD_REQUEST",
              httpStatus: 400,
              path: "weight.updateGoal",
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
              path: "weight.updateGoal",
            },
          },
        },
        { status: 400 }
      );
    }

    if (userId === "test-user-id") {
      console.log("Returning success response for userId:", userId);
      return HttpResponse.json(
        {
          id,
          result: {
            type: "data",
            data: { id: goalId, goalWeightKg, goalSetAt: new Date().toISOString() },
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
            path: "weight.updateGoal",
          },
        },
      },
      { status: 401 }
    );
  }
);