// __mocks__/utils.ts
import { HttpResponse } from "msw";
import { z } from "zod";
import * as jwt from "jsonwebtoken";

export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
  procedure: string
): Promise<T> {
  try {
    const rawBody = await request.text();
    console.log(`Raw body for ${procedure}:`, rawBody || "Empty body");
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