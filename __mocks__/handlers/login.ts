// __mocks__/handlers/login.ts
import { http, HttpResponse } from "msw";
import { mockUsers } from "../mockUsers";
import bcrypt from "bcryptjs";
import type { inferProcedureInput } from "@trpc/server";
import type { AppRouter } from "../../server/trpc";

interface TrpcRequestBody {
  "0": inferProcedureInput<AppRouter["login"]>; // { email: string; password: string }
}

export const loginHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/login",
  async ({ request }) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: "Invalid request body",
              code: -32600,
              data: { code: "BAD_REQUEST", httpStatus: 400, path: "login" },
            },
          },
        ],
        { status: 200 }
      );
    }

    // Check if body is an object with a "0" key
    if (!body || typeof body !== "object" || !("0" in body)) {
      console.error('Invalid body format: not an object with "0" key');
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: "Invalid request body",
              code: -32600,
              data: { code: "BAD_REQUEST", httpStatus: 400, path: "login" },
            },
          },
        ],
        { status: 200 }
      );
    }

    const input = (body as TrpcRequestBody)["0"];
    const { email, password } = input || {};

    if (!email || !password) {
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: "Email and password are required",
              code: -32603,
              data: { code: "BAD_REQUEST", httpStatus: 400, path: "login" },
            },
          },
        ],
        { status: 200 }
      );
    }

    const user = mockUsers.find((u) => u.email === email);
    if (!user) {
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: "Invalid email or password",
              code: -32001,
              data: { code: "UNAUTHORIZED", httpStatus: 401, path: "login" },
            },
          },
        ],
        { status: 200 }
      );
    }

    if (!user.isEmailVerified) {
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: "Please verify your email before logging in",
              code: -32001,
              data: { code: "UNAUTHORIZED", httpStatus: 401, path: "login" },
            },
          },
        ],
        { status: 200 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: "Invalid email or password",
              code: -32001,
              data: { code: "UNAUTHORIZED", httpStatus: 401, path: "login" },
            },
          },
        ],
        { status: 200 }
      );
    }

    return HttpResponse.json(
      [
        {
          id: 0,
          result: {
            data: {
              id: user.id,
              email: user.email,
              token: "mock-token",
              refreshToken: "mock-refresh-token",
            },
          },
        },
      ],
      { status: 200 }
    );
  }
);
