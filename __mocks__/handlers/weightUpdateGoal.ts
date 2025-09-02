import { http, HttpResponse } from "msw";
import jwt from "jsonwebtoken";

interface TRPCRequestBody {
  id?: number;
  input?: { goalId: string; goalWeightKg: number };
  goalId?: string;
  goalWeightKg?: number;
}

export const weightUpdateGoalHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/weight.updateGoal",
  async ({ request }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
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
    } catch {
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

    // Handle tRPC request body (flat or nested input)
    let goalId: string | undefined;
    let goalWeightKg: number | undefined;
    let id: number = 0;

    if (Array.isArray(body)) {
      const firstBody = body[0] as TRPCRequestBody;
      goalId = firstBody.input?.goalId ?? firstBody.goalId;
      goalWeightKg = firstBody.input?.goalWeightKg ?? firstBody.goalWeightKg;
      id = firstBody.id ?? 0;
    } else {
      const typedBody = body as TRPCRequestBody;
      goalId = typedBody.input?.goalId ?? typedBody.goalId;
      goalWeightKg = typedBody.input?.goalWeightKg ?? typedBody.goalWeightKg;
      id = typedBody.id ?? 0;
    }

    if (userId === "test-user-id" && goalId && goalWeightKg && goalWeightKg > 0) {
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
);