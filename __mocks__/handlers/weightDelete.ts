// __mocks__/handlers/weightDelete.ts
import { http, HttpResponse } from "msw";
import jwt from "jsonwebtoken";
import { weights } from "./weightsData";

interface TRPCRequestBody {
  id?: number;
  method?: string;
  path?: string;
  json?: { weightId: string };
}

interface SimpleRequestBody {
  weightId: string;
}

export const weightDeleteHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc",
  async ({ request }) => {
    let body: unknown;
    try {
      body = await request.clone().json();
    } catch {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Invalid request body",
            code: -32000,
            data: { code: "BAD_REQUEST", httpStatus: 400, path: "weight.delete" },
          },
        },
        { status: 200 }
      );
    }

    let deleteRequest: TRPCRequestBody | SimpleRequestBody | undefined;
    if (Array.isArray(body)) {
      deleteRequest = body.find((req: TRPCRequestBody) => req.path === "weight.delete");
    } else if (body && typeof body === "object") {
      if ("path" in body && body.path === "weight.delete") {
        deleteRequest = body as TRPCRequestBody;
      } else if ("weightId" in body) {
        deleteRequest = body as SimpleRequestBody;
      }
    }

    if (!deleteRequest) {
      return; // Pass to other handlers
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          id: (deleteRequest as TRPCRequestBody).id || 0,
          error: {
            message: "Unauthorized",
            code: -32001,
            data: { code: "UNAUTHORIZED", httpStatus: 401, path: "weight.delete" },
          },
        },
        { status: 200 }
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
          id: (deleteRequest as TRPCRequestBody).id || 0,
          error: {
            message: "Invalid token",
            code: -32001,
            data: { code: "UNAUTHORIZED", httpStatus: 401, path: "weight.delete" },
          },
        },
        { status: 200 }
      );
    }

    if (userId === "error-user-id") {
      return HttpResponse.json(
        {
          id: (deleteRequest as TRPCRequestBody).id || 0,
          error: {
            message: "Failed to delete weight",
            code: -32002,
            data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500, path: "weight.delete" },
          },
        },
        { status: 200 }
      );
    }

    const input = (deleteRequest as TRPCRequestBody).json || (deleteRequest as SimpleRequestBody);
    if (!input || !input.weightId) {
      return HttpResponse.json(
        {
          id: (deleteRequest as TRPCRequestBody).id || 0,
          error: {
            message: "Invalid input",
            code: -32000,
            data: { code: "BAD_REQUEST", httpStatus: 400, path: "weight.delete" },
          },
        },
        { status: 200 }
      );
    }

    const weightIndex = weights.findIndex((w) => w.id === input.weightId);
    if (weightIndex !== -1) {
      weights.splice(weightIndex, 1);
      return HttpResponse.json(
        {
          id: (deleteRequest as TRPCRequestBody).id || 0,
          result: {
            type: "data",
            data: { id: input.weightId },
          },
        },
        { status: 200 }
      );
    }

    return HttpResponse.json(
      {
        id: (deleteRequest as TRPCRequestBody).id || 0,
        error: {
          message: "Weight measurement not found",
          code: -32001,
          data: {
            code: "NOT_FOUND",
            httpStatus: 404,
            path: "weight.delete",
          },
        },
      },
      { status: 200 }
    );
  }
);