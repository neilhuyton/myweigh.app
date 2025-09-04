// __mocks__/utils.ts
import { HttpResponse } from "msw";
import { z } from "zod";
import * as jwt from "jsonwebtoken";

export interface AuthenticatedUser {
  userId: string;
}

export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
  procedure: string
): Promise<T> {
  try {
    const rawBody = await request.text();
    if (!rawBody) {
      throw new Error("Empty body");
    }
    const parsed = JSON.parse(rawBody);
    return schema.parse(parsed);
  } catch (error) {
    console.error(`Failed to parse body for ${procedure}:`, error);
    throw new Error(
      `Invalid request body for ${procedure}: ${
        error instanceof Error ? error.message : "Malformed JSON"
      }`
    );
  }
}

export function createTRPCErrorResponse(
  id: number,
  message: string,
  code: number,
  httpStatus: number,
  path: string
) {
  return HttpResponse.json(
    {
      id,
      error: {
        message,
        code,
        data: {
          code:
            httpStatus === 400
              ? "BAD_REQUEST"
              : httpStatus === 401
              ? "UNAUTHORIZED"
              : httpStatus === 404
              ? "NOT_FOUND"
              : "INTERNAL_SERVER_ERROR",
          httpStatus,
          path,
        },
      },
    },
    { status: httpStatus }
  );
}

export function verifyJWT(token: string): { userId: string } | null {
  try {
    if (token === "mock-token-test-user-id") {
      return { userId: "test-user-id" };
    }
    return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as {
      userId: string;
    };
  } catch {
    console.error("JWT verification failed for token:", token);
    return null;
  }
}

export function withBodyParsing<T>(
  schema: z.ZodType<T>,
  procedure: string,
  handler: (body: T, request: Request) => Promise<Response>,
) {
  return async ({ request }: { request: Request }): Promise<Response> => {
    let body: T;
    try {
      body = await parseBody(request, schema, procedure);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error parsing request body";
      console.error(message);
      return createTRPCErrorResponse(0, message, -32600, 400, procedure);
    }
    return handler(body, request);
  };
}

export function authenticateRequest(
  request: Request,
  procedure: string
): AuthenticatedUser | Response {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error(`Missing or invalid Authorization header for ${procedure}`);
    return createTRPCErrorResponse(
      0,
      "Unauthorized: User must be logged in",
      -32001,
      401,
      procedure
    );
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyJWT(token);
  if (!decoded) {
    console.error(`Invalid token for ${procedure}`);
    return createTRPCErrorResponse(0, "Invalid token", -32001, 401, procedure);
  }

  return decoded;
}
