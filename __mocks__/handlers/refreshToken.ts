import { http, HttpResponse } from "msw";
import jwt from "jsonwebtoken";
import { mockUsers, type MockUser } from "../mockUsers";

interface RefreshTokenInput {
  json: { refreshToken: string };
}

export const refreshTokenHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/refreshToken.refresh",
  async ({ request }) => {
    try {
      const body = await request.json();
      const input = (body && typeof body === "object" && "json" in body ? body : { json: {} }) as RefreshTokenInput;
      const { refreshToken } = input.json;

      const user = mockUsers.find((u: MockUser) => u.refreshToken === refreshToken);
      if (user) {
        const newToken = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET || "your-secret-key",
          { expiresIn: "1h" }
        );
        return HttpResponse.json(
          {
            id: 0,
            result: {
              type: "data",
              data: { token: newToken, refreshToken: "new-mock-refresh-token" },
            },
          },
          { status: 200 }
        );
      }
      return HttpResponse.json(
        { id: 0, error: { message: "Invalid refresh token", code: -32001, data: { code: "UNAUTHORIZED", httpStatus: 401, path: "refreshToken.refresh" } } },
        { status: 401 }
      );
    } catch {
      return HttpResponse.json(
        { id: 0, error: { message: "Internal server error", code: -32002, data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500, path: "refreshToken.refresh" } } },
        { status: 500 }
      );
    }
  }
);