import { http } from "msw";

export const loginHandler = http.post(
  "*/.netlify/functions/trpc/login",
  async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    const { email, password } = body || {};

    if (email === "testuser@example.com" && password === "password123") {
      return new Response(
        JSON.stringify({
          id: 0,
          result: {
            type: "data",
            data: {
              id: "test-user-1",
              email: "testuser@example.com",
              token:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMSJ9.dummy-signature",
              refreshToken: "mock-refresh-token",
            },
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        id: 0,
        error: {
          message: "Invalid email or password",
          code: -32600,
          data: { code: "BAD_REQUEST", httpStatus: 400, path: "login" },
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
);