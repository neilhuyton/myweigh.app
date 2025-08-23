import { http, HttpResponse } from "msw";
import { mockUsers } from "../mockUsers";

interface TrpcRequestBody {
  [key: string]: { token?: string; newPassword?: string };
}

export const resetPasswordConfirmHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/resetPassword.confirm",
  async ({ request }) => {
    const body = (await request.json()) as TrpcRequestBody;
    const input = body["0"] || {};


    if (!input.token || !input.newPassword) {
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: "Token and password are required",
              code: -32603,
              data: {
                code: "BAD_REQUEST",
                httpStatus: 400,
                path: "resetPassword.confirm",
              },
            },
          },
        ],
        { status: 400 }
      );
    }

    const user = mockUsers.find(
      (u) =>
        u.resetPasswordToken === input.token &&
        new Date(u.resetPasswordTokenExpiresAt || 0) > new Date()
    );
    if (!user) {
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: "Invalid or expired reset token",
              code: -32603,
              data: {
                code: "BAD_REQUEST",
                httpStatus: 400,
                path: "resetPassword.confirm",
              },
            },
          },
        ],
        { status: 400 }
      );
    }

    if (input.newPassword.length < 8) {
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: "Password must be at least 8 characters",
              code: -32603,
              data: {
                code: "BAD_REQUEST",
                httpStatus: 400,
                path: "resetPassword.confirm",
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
          id: 0,
          result: {
            data: {
              message: "Password reset successfully",
            },
          },
        },
      ],
      { status: 200 }
    );
  }
);