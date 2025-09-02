// __mocks__/handlers/verifyEmail.ts

import { http, HttpResponse } from 'msw';
import { mockUsers, type MockUser } from '../mockUsers';

interface TrpcRequestBody {
  token: string;
}

export const verifyEmailHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/verifyEmail',
  async ({ request }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        {
          error: {
            message: 'Invalid request body',
            code: -32600,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'verifyEmail' },
          },
        },
        { status: 400 }
      );
    }

    const { token } = body as TrpcRequestBody;

    if (!token) {
      return HttpResponse.json(
        {
          error: {
            message: 'No verification token provided',
            code: -32600,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'verifyEmail' },
          },
        },
        { status: 400 }
      );
    }

    const user = mockUsers.find((u: MockUser) => u.verificationToken === token);
    if (!user) {
      return HttpResponse.json(
        {
          error: {
            message: 'Invalid or expired verification token',
            code: -32602,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'verifyEmail' },
          },
        },
        { status: 400 }
      );
    }

    if (user.isEmailVerified) {
      return HttpResponse.json(
        {
          error: {
            message: 'Email already verified',
            code: -32602,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'verifyEmail' },
          },
        },
        { status: 400 }
      );
    }

    user.isEmailVerified = true;
    user.verificationToken = null;
    user.updatedAt = new Date().toISOString();

    return HttpResponse.json(
      {
        result: {
          data: {
            message: 'Email verified successfully!',
          },
        },
      },
      { status: 200 }
    );
  }
);