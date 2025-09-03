import { http, HttpResponse } from "msw";
import jwt from "jsonwebtoken";

interface TRPCRequestBody {
  id?: number;
  input?: { isFirstLogin: boolean };
  isFirstLogin?: boolean;
}

export const userUpdateFirstLoginHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/user.updateFirstLogin",
  async ({ request }) => {
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
              path: "user.updateFirstLogin",
            },
          },
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    let userId: string | null = null;
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      ) as { userId: string };
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
              path: "user.updateFirstLogin",
            },
          },
        },
        { status: 401 }
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
            code: -32600,
            data: {
              code: "BAD_REQUEST",
              httpStatus: 400,
              path: "user.updateFirstLogin",
            },
          },
        },
        { status: 400 }
      );
    }

    let isFirstLogin: boolean | undefined;
    let id: number = 0;
    if (Array.isArray(body)) {
      const firstBody = body[0] as TRPCRequestBody;
      isFirstLogin = firstBody.input?.isFirstLogin ?? firstBody.isFirstLogin;
      id = firstBody.id ?? 0;
    } else {
      const typedBody = body as TRPCRequestBody;
      isFirstLogin = typedBody.input?.isFirstLogin ?? typedBody.isFirstLogin;
      id = typedBody.id ?? 0;
    }

    if (isFirstLogin === undefined) {
      return HttpResponse.json(
        {
          id,
          error: {
            message: "isFirstLogin is required",
            code: -32600,
            data: {
              code: "BAD_REQUEST",
              httpStatus: 400,
              path: "user.updateFirstLogin",
            },
          },
        },
        { status: 400 }
      );
    }

    if (userId === "test-user-id") {
      return HttpResponse.json(
        {
          id,
          result: {
            type: "data",
            data: { message: "First login status updated successfully" },
          },
        },
        { status: 200 }
      );
    }

    return HttpResponse.json(
      {
        id,
        error: {
          message: "User not found",
          code: -32001,
          data: {
            code: "NOT_FOUND",
            httpStatus: 404,
            path: "user.updateFirstLogin",
          },
        },
      },
      { status: 404 }
    );
  }
);
