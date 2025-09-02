// __mocks__/handlers/resetPasswordConfirm.ts
import { http, HttpResponse } from "msw";

export const resetPasswordConfirmHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/resetPassword.confirm",
  async ({ request }) => {
    const body = await request.json() as { token?: string; newPassword?: string } | null;

    if (!body || !body.token || !body.newPassword) {
      return HttpResponse.json(
        {
          error: {
            message: "Invalid request body",
            code: -32600,
            data: { code: "BAD_REQUEST", httpStatus: 400, path: "resetPassword.confirm" },
          },
        },
        { status: 200 }
      );
    }

    if (body.token === "123e4567-e89b-12d3-a456-426614174000") {
      return HttpResponse.json({
        result: { data: { success: true } },
      });
    }

    return HttpResponse.json(
      {
        error: {
          message: "Invalid or expired token",
          code: -32600,
          data: { code: "BAD_REQUEST", httpStatus: 400, path: "resetPassword.confirm" },
        },
      },
      { status: 200 }
    );
  }
);