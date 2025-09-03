import { http, HttpResponse } from "msw";

interface Goal {
  id: string;
  goalWeightKg: number;
  goalSetAt: string;
  reachedAt: string | null;
}

let goal: Goal | null = {
  id: "1",
  goalWeightKg: 65.0,
  goalSetAt: "2025-08-28T00:00:00Z",
  reachedAt: null,
};

export const weightGetCurrentGoalHandler = http.get(
  "http://localhost:8888/.netlify/functions/trpc/weight.getCurrentGoal",
  async ({ request, params }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Unauthorized",
            code: -32001,
            data: {
              code: "UNAUTHORIZED",
              httpStatus: 401,
              path: params.path ?? "weight.getCurrentGoal",
            },
          },
        },
        { status: 200 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    let userId: string | null = null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.userId;
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
              path: params.path ?? "weight.getCurrentGoal",
            },
          },
        },
        { status: 200 }
      );
    }

    if (userId === "test-user-id") {
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: goal,
          },
        },
        { status: 200 }
      );
    }

    if (userId === "empty-user-id") {
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

    if (userId === "error-user-id") {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Failed to fetch current goal",
            code: -32002,
            data: {
              code: "INTERNAL_SERVER_ERROR",
              httpStatus: 500,
              path: params.path?.includes("weight.getCurrentGoal")
                ? "weight.getCurrentGoal"
                : "unknown",
            },
          },
        },
        { status: 200 }
      );
    }

    if (userId === "invalid-user-id") {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Invalid token",
            code: -32001,
            data: {
              code: "UNAUTHORIZED",
              httpStatus: 401,
              path: params.path ?? "weight.getCurrentGoal",
            },
          },
        },
        { status: 200 }
      );
    }

    return HttpResponse.json(
      {
        id: 0,
        error: {
          message: "Unauthorized",
          code: -32001,
          data: {
            code: "UNAUTHORIZED",
            httpStatus: 401,
            path: params.path ?? "weight.getCurrentGoal",
          },
        },
      },
      { status: 200 }
    );
  }
);

export const weightCreateHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/weight.create",
  async ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Unauthorized",
            code: -32001,
            data: {
              code: "UNAUTHORIZED",
              httpStatus: 401,
              path: "weight.create",
            },
          },
        },
        { status: 200 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    let userId: string | null = null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.userId;
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
              path: "weight.create",
            },
          },
        },
        { status: 200 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Invalid request body",
            code: -32000,
            data: {
              code: "BAD_REQUEST",
              httpStatus: 400,
              path: "weight.create",
            },
          },
        },
        { status: 200 }
      );
    }

    const isValidBody = (b: unknown): b is { weightKg: number | string; note?: string } =>
      b !== null &&
      typeof b === "object" &&
      "weightKg" in b &&
      (typeof b.weightKg === "number" || typeof b.weightKg === "string") &&
      ("note" in b ? typeof b.note === "string" || b.note === undefined : true);

    if (!isValidBody(body)) {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Invalid request body: missing or invalid weightKg",
            code: -32000,
            data: {
              code: "BAD_REQUEST",
              httpStatus: 400,
              path: "weight.create",
            },
          },
        },
        { status: 200 }
      );
    }

    const weightKg = typeof body.weightKg === "string" ? parseFloat(body.weightKg) : body.weightKg;

    if (isNaN(weightKg) || weightKg <= 0) {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Invalid weight value",
            code: -32000,
            data: {
              code: "BAD_REQUEST",
              httpStatus: 400,
              path: "weight.create",
            },
          },
        },
        { status: 200 }
      );
    }

    if (userId === "test-user-id") {
      if (goal && weightKg <= goal.goalWeightKg && !goal.reachedAt) {
        goal = { ...goal, reachedAt: "2025-09-02T00:00:00Z" };
      }
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: {
              id: "weight-1",
              userId,
              weightKg,
              note: body.note || null,
              createdAt: "2025-09-02T00:00:00Z",
            },
          },
        },
        { status: 200 }
      );
    }

    if (userId === "error-user-id") {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Failed to create weight",
            code: -32002,
            data: {
              code: "INTERNAL_SERVER_ERROR",
              httpStatus: 500,
              path: "weight.create",
            },
          },
        },
        { status: 200 }
      );
    }

    return HttpResponse.json(
      {
        id: 0,
        error: {
          message: "Unauthorized",
          code: -32001,
          data: {
            code: "UNAUTHORIZED",
            httpStatus: 401,
            path: "weight.create",
          },
        },
      },
      { status: 200 }
    );
  }
);