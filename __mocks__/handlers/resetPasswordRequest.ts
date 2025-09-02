// __mocks__/handlers/resetPasswordRequest.ts
import { http, HttpResponse } from "msw";

interface TRPCRequestBody {
  id?: number;
  input?: { email: string };
  email?: string;
}

export const resetPasswordRequestHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/resetPassword.request",
  async ({ request }) => {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Invalid request body",
            code: -32600,
            data: {
              code: "BAD_REQUEST",
              httpStatus: 400,
              path: "resetPassword.request",
            },
          },
        },
        { status: 400 }
      );
    }

    let email: string | undefined;
    let id: number = 0;

    if (Array.isArray(body)) {
      email = body[0]?.input?.email ?? body[0]?.email;
      id = body[0]?.id ?? 0;
    } else if (body && typeof body === "object") {
      email = (body as TRPCRequestBody).input?.email ?? (body as TRPCRequestBody).email;
      id = (body as TRPCRequestBody).id ?? 0;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return HttpResponse.json(
        {
          id,
          error: {
            message: "Invalid email",
            code: -32001,
            data: {
              code: "BAD_REQUEST",
              httpStatus: 400,
              path: "resetPassword.request",
            },
          },
        },
        { status: 400 }
      );
    }

    const response = {
      id,
      result: {
        type: "data",
        data: {
          message: "If the email exists, a reset link has been sent.",
        },
      },
    };
    return HttpResponse.json(response, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
);