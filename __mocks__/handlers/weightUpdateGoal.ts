// __mocks__/handlers/weightUpdateGoal.ts
import { http, HttpResponse } from "msw";
import jwt from "jsonwebtoken";

export const weightUpdateGoalHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/weight.updateGoal",
  async ({ request }) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        [
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
        ],
        { status: 400 }
      );
    }

    const headers = Object.fromEntries(request.headers.entries());
    const input = (
      body as { [key: string]: { id?: number; goalWeightKg?: number } }
    )["0"];
    const id = input?.id ?? 0;
    const userId = headers["authorization"]?.split("Bearer ")[1];

    if (!userId) {
      return HttpResponse.json(
        [
          {
            id,
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
        ],
        { status: 401 }
      );
    }

    try {
      jwt.verify(userId, process.env.JWT_SECRET || "your-secret-key");
    } catch {
      return HttpResponse.json(
        [
          {
            id,
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
        ],
        { status: 401 }
      );
    }

    if (!input?.goalWeightKg || input.goalWeightKg <= 0) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: "Goal weight must be a positive number",
              code: -32001,
              data: {
                code: "BAD_REQUEST",
                httpStatus: 400,
                path: "weight.updateGoal",
              },
            },
          },
        ],
        { status: 400 }
      );
    }

    return HttpResponse.json(
      [
        {
          id,
          result: {
            data: { goalWeightKg: input.goalWeightKg },
          },
        },
      ],
      { status: 200 }
    );
  }
);