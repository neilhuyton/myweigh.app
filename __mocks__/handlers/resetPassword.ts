// __mocks__/handlers/resetPassword.ts
import { http, HttpResponse } from 'msw';
import { mockUsers } from '../mockUsers';

interface TrpcRequestBody {
  id: number;
  json: { input: { email?: string; token?: string; newPassword?: string } };
}

export const resetPasswordHandlers = [
  http.post('http://localhost:8888/.netlify/functions/trpc/resetPassword.request', async ({ request }) => {
    let body: unknown;
    try {
      body = await request.json();
      console.log('resetPassword.request body:', JSON.stringify(body, null, 2));
    } catch (error) {
      console.error('Error reading resetPassword.request body:', error);
      return HttpResponse.json(
        {
          error: {
            message: 'Invalid request body',
            code: -32600,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword.request' },
          },
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body) || body.length === 0) {
      return HttpResponse.json(
        {
          error: {
            message: 'Invalid tRPC request format',
            code: -32600,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword.request' },
          },
        },
        { status: 400 }
      );
    }

    const requestItem = body[0] as TrpcRequestBody;
    const id = requestItem.id ?? 0;
    const input = requestItem.json?.input;

    if (!input?.email) {
      return HttpResponse.json(
        {
          error: {
            message: 'Invalid email',
            code: -32603,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword.request' },
          },
        },
        { status: 400 }
      );
    }

    const user = mockUsers.find((u) => u.email === input.email);
    if (!user) {
      return HttpResponse.json(
        {
          error: {
            message: 'Email not found',
            code: -32603,
            data: { code: 'NOT_FOUND', httpStatus: 404, path: 'resetPassword.request' },
          },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json([
      {
        id,
        result: {
          data: {
            message: 'Reset link sent to your email',
          },
        },
      },
    ]);
  }),

  http.post('http://localhost:8888/.netlify/functions/trpc/resetPassword', async ({ request }) => {
    let body: unknown;
    try {
      body = await request.json();
      console.log('resetPassword body:', JSON.stringify(body, null, 2));
    } catch (error) {
      console.error('Error reading resetPassword request body:', error);
      return HttpResponse.json(
        {
          error: {
            message: 'Invalid request body',
            code: -32600,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword' },
          },
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body) || body.length === 0) {
      return HttpResponse.json(
        {
          error: {
            message: 'Invalid tRPC request format',
            code: -32600,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword' },
          },
        },
        { status: 400 }
      );
    }

    const requestItem = body[0] as TrpcRequestBody;
    const id = requestItem.id ?? 0;
    const input = requestItem.json?.input;

    const user = mockUsers.find(
      (u) => u.resetPasswordToken === input?.token && new Date(u.resetPasswordTokenExpiresAt || 0) > new Date()
    );
    if (!user) {
      return HttpResponse.json(
        {
          error: {
            message: 'Invalid or expired reset token',
            code: -32603,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword' },
          },
        },
        { status: 400 }
      );
    }
    if (!input?.newPassword || input.newPassword.length < 8) {
      return HttpResponse.json(
        {
          error: {
            message: 'Password must be at least 8 characters',
            code: -32603,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword' },
          },
        },
        { status: 400 }
      );
    }
    return HttpResponse.json([
      {
        id,
        result: {
          data: {
            message: 'Password reset successfully',
          },
        },
      },
    ]);
  }),
];