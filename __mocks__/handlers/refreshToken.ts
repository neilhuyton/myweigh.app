// __mocks__/handlers/refreshToken.ts
import { http, HttpResponse } from "msw";
import jwt from "jsonwebtoken";

export const refreshTokenHandler = http.post(
  /http:\/\/localhost:8888\/\.netlify\/functions\/trpc\/refreshToken\.refresh/,
  async ({ request }) => {
    console.log(
      "MSW: Intercepted refreshToken.refresh request:",
      request.url,
      request.method
    );
    const body = await request.json();
    const { refreshToken } = (body as any)[0].params.input;

    if (refreshToken === "valid-refresh-token") {
      const newToken = jwt.sign(
        { userId: "empty-user-id" },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "1h" }
      );
      return HttpResponse.json(
        [
          {
            id: 0,
            result: {
              data: { token: newToken, refreshToken: "new-refresh-token" },
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
          error: {
            message: "Invalid refresh token",
            code: -32001,
            data: {
              code: "UNAUTHORIZED",
              httpStatus: 401,
              path: "refreshToken.refresh",
            },
          },
        },
      ],
      { status: 200 }
    );
  }
);
