// src/mocks/handlers/refreshTokenHandler.ts
import { http, HttpResponse } from 'msw';
import jwt from 'jsonwebtoken';

// Define input type for refreshToken.refresh
interface RefreshTokenInput {
  refreshToken: string;
}

// Define the shape of a single tRPC request
interface TRPCRequest {
  params: { input: RefreshTokenInput };
  id?: number;
}

// Define the shape of the request body (for batch requests)
type TRPCRequestBody = { [key: string]: TRPCRequest };

export const refreshTokenHandler = http.post(
  /http:\/\/localhost:8888\/\.netlify\/functions\/trpc\/refreshToken\.refresh/,
  async ({ request }) => {
    const body = (await request.json()) as TRPCRequestBody;
    const { refreshToken } = body['0'].params.input;

    if (refreshToken === 'valid-refresh-token') {
      const newToken = jwt.sign(
        { userId: 'empty-user-id' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' },
      );
      return HttpResponse.json(
        [
          {
            id: 0,
            result: {
              data: { token: newToken, refreshToken: 'new-refresh-token' },
            },
          },
        ],
        { status: 200 },
      );
    }

    return HttpResponse.json(
      [
        {
          id: 0,
          error: {
            message: 'Invalid refresh token',
            code: -32001,
            data: {
              code: 'UNAUTHORIZED',
              httpStatus: 401,
              path: 'refreshToken.refresh',
            },
          },
        },
      ],
      { status: 200 },
    );
  },
);