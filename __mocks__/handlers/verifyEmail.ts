// __mocks__/handlers/verifyEmail.ts
import { http, HttpResponse } from 'msw';
import { mockUsers, type MockUser } from '../mockUsers';
import type { inferProcedureInput } from '@trpc/server';
import type { AppRouter } from '../../server/trpc';

interface TrpcRequestBody {
  '0': inferProcedureInput<AppRouter['verifyEmail']>; // { token: string }
}

export const verifyEmailHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/verifyEmail',
  async ({ request }) => {
    console.log('MSW intercepting verifyEmail request');
    let body: unknown;
    try {
      body = await request.json();
      console.log('Received body:', JSON.stringify(body, null, 2));
    } catch (error) {
      console.error('Error reading verifyEmail request body:', error);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid request body',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'verifyEmail' },
            },
          },
        ],
        { status: 200 }
      );
    }

    // Check if body is an object with a "0" key
    if (!body || typeof body !== 'object' || !('0' in body)) {
      console.error('Invalid body format: not an object with "0" key');
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid request body',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'verifyEmail' },
            },
          },
        ],
        { status: 200 }
      );
    }

    const input = (body as TrpcRequestBody)['0'];
    const { token } = input || {};

    if (!token) {
      console.log('Missing token');
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid or expired verification token',
              code: -32001,
              data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'verifyEmail' },
            },
          },
        ],
        { status: 200 }
      );
    }

    // Simulate delay for verifying message test (only for valid token)
    if (token === '42c6b154-c097-4a71-9b34-5b28669ea467') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const user = mockUsers.find((u: MockUser) => u.verificationToken === token);
    if (!user) {
      console.log('Invalid token:', token);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid or expired verification token',
              code: -32001,
              data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'verifyEmail' },
            },
          },
        ],
        { status: 200 }
      );
    }

    if (user.isEmailVerified) {
      console.log('Email already verified for user:', user.email);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Email already verified',
              code: -32001,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'verifyEmail' },
            },
          },
        ],
        { status: 200 }
      );
    }

    // Update user to mark email as verified
    user.isEmailVerified = true;
    user.verificationToken = null;
    user.updatedAt = new Date().toISOString();

    console.log('Email verified successfully for user:', user.email);
    return HttpResponse.json(
      [
        {
          id: 0,
          result: {
            data: {
              message: 'Email verified successfully!',
            },
          },
        },
      ],
      { status: 200 }
    );
  }
);