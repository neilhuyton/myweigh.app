import { http, HttpResponse } from "msw";

interface WeightCreateRequestBody {
  weightKg: number | string;
  note?: string;
}

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

    // Validate body against WeightCreateRequestBody
    const isValidBody = (b: unknown): b is WeightCreateRequestBody =>
      b !== null &&
      typeof b === "object" &&
      "weightKg" in b &&
      (b.weightKg === undefined || typeof b.weightKg === "number" || typeof b.weightKg === "string") &&
      ("note" in b ? b.note === undefined || typeof b.note === "string" : true);

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

    const weightKgInput = body.weightKg;
    const weightKg = typeof weightKgInput === "string" ? parseFloat(weightKgInput) : weightKgInput;

    if (!weightKg || isNaN(weightKg) || weightKg <= 0) {
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