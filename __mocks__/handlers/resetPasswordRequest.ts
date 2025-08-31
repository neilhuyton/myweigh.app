// __mocks__/handlers/resetPasswordRequest.ts
import { http, HttpResponse } from 'msw';
import type { inferProcedureInput } from '@trpc/server';
import type { AppRouter } from '../../server/trpc';

interface TrpcRequestBody {
  '0': inferProcedureInput<AppRouter['resetPassword']['request']>; // { email: string }
}

export const resetPasswordRequestHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/resetPassword.request',
  async ({ request }) => {
    console.log('MSW intercepting resetPassword.request request');
    let body: unknown;
    try {
      body = await request.json();
      console.log('Received body:', JSON.stringify(body, null, 2));
    } catch (error) {
      console.error('Error reading resetPassword.request body:', error);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid request body',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword.request' },
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
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword.request' },
            },
          },
        ],
        { status: 200 }
      );
    }

    const input = (body as TrpcRequestBody)['0'];
    const { email } = input || {};

    if (!email) {
      console.log('Missing email');
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid email',
              code: -32603,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword.request' },
            },
          },
        ],
        { status: 200 }
      );
    }

    console.log('Password reset request processed for email:', email);
    return HttpResponse.json(
      [
        {
          id: 0,
          result: {
            data: {
              message: 'If the email exists, a reset link has been sent.',
            },
          },
        },
      ],
      { status: 200 }
    );
  }
);