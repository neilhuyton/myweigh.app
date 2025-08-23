import { http, HttpResponse } from "msw";
import { mockUsers } from "../mockUsers";

interface TrpcRequestBody {
  id: number;
  json: { input: { email?: string; token?: string; newPassword?: string } };
}

export const resetPasswordRequestHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/resetPassword.request",
  async ({ request }) => {
    const body = (await request.json()) as TrpcRequestBody[];
    const {
      id = 0,
      json: { input },
    } = body[0] || {};

    if (!input?.email) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: "Invalid email",
              code: -32603,
              data: {
                code: "BAD_REQUEST",
                httpStatus: 400,
                path: "resetPassword.request",
              },
            },
          },
        ],
        { status: 400 }
      );
    }

    const user = mockUsers.find((u) => u.email === input.email);
    if (!user) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: "Email not found",
              code: -32603,
              data: {
                code: "NOT_FOUND",
                httpStatus: 404,
                path: "resetPassword.request",
              },
            },
          },
        ],
        { status: 404 }
      );
    }

    return HttpResponse.json([
      {
        id,
        result: {
          data: {
            message: "Reset link sent to your email",
          },
        },
      },
    ]);
  }
);
