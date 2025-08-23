// __mocks__/handlers/verifyEmail.ts
import { http, HttpResponse } from "msw";

export const verifyEmailHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/verifyEmail",
  async ({ request }) => {
    const body = (await request.json()) as {
      [key: string]: { id?: number; token?: string };
    };
    const input = body["0"];
    const id = input?.id ?? 0;
    if (input?.token === "valid-token") {
      return HttpResponse.json([
        {
          id,
          result: {
            data: { message: "Email verified successfully" },
          },
        },
      ]);
    }
    return HttpResponse.json(
      [
        {
          id,
          error: {
            message: "Invalid or expired token",
            code: -32001,
            data: {
              code: "UNAUTHORIZED",
              httpStatus: 401,
              path: "verifyEmail",
            },
          },
        },
      ],
      { status: 401 }
    );
  }
);
