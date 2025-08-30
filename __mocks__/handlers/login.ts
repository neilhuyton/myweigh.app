import { http, HttpResponse } from "msw";
import { mockUsers } from "../mockUsers";
import bcrypt from "bcryptjs";

interface TrpcRequestBody {
  email: string;
  password: string;
}

export const loginHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/login",
  async ({ request }) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    let body: unknown;
    try {
      body = await request.json();
      console.log("Mock Server Request Body:", JSON.stringify(body, null, 2));
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

    let input: TrpcRequestBody;

    if (Array.isArray(body) && body.length > 0) {
      const first = body[0];
      if (first?.input) {
        // Standard tRPC batch format: [{ input: { email, password } }]
        input = first.input as TrpcRequestBody;
      } else if (first && "email" in first && "password" in first) {
        // Fallback for batch without input wrapper: [{ email, password }]
        input = first as TrpcRequestBody;
      } else {
        console.error("Invalid array body format:", body);
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
    } else if (typeof body === "object" && body !== null) {
      if ("email" in body && "password" in body) {
        // Non-batched: { email, password }
        input = body as TrpcRequestBody;
      } else if (
        "0" in body &&
        typeof body["0"] === "object" &&
        body["0"] !== null &&
        "email" in body["0"] &&
        "password" in body["0"]
      ) {
        // Custom batch format: { 0: { email, password } }
        input = body["0"] as TrpcRequestBody;
      } else {
        console.error("Invalid object body format:", body);
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
    } else {
      console.error("Invalid body format:", body);
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

    const { email, password } = input;

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