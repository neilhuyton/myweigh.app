// __mocks__/handlers/weightGetGoals.ts
import { http, HttpResponse } from "msw";

export const weightGetGoalsHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc",
  async ({ request }) => {
    const headers = Object.fromEntries(request.headers.entries());
    const userId = headers["authorization"]?.split("Bearer ")[1];
    const body = (await request.json()) as {
      [key: string]: { path: string; input?: any; id?: number };
    };
    const query = body["0"];
    console.log("Mock server received request:", {
      path: query.path,
      headers,
      body,
    }); // Debug log

    if (query.path !== "weight.getGoals") {
      return; // Let other handlers process
    }

    if (!userId) {
      return HttpResponse.json(
        [
          {
            error: {
              message: "Unauthorized: User must be logged in",
              code: -32001,
              data: {
                code: "UNAUTHORIZED",
                httpStatus: 401,
                path: "weight.getGoals",
              },
            },
          },
        ],
        { status: 401 }
      );
    }

    return HttpResponse.json([
      {
        result: {
          data: [
            {
              id: "goal-1",
              goalWeightKg: 65.0,
              goalSetAt: "2025-08-28T12:00:00Z",
              reachedAt: null,
            },
            {
              id: "goal-2",
              goalWeightKg: 70.0,
              goalSetAt: "2025-08-27T12:00:00Z",
              reachedAt: null,
            },
          ],
        },
      },
    ]);
  }
);
