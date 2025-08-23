// __mocks__/handlers/resetPassword.ts
import { http, HttpResponse } from 'msw';
import { mockUsers } from '../mockUsers';

export const resetPasswordHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/resetPassword',
  async ({ request }) => {
    let body;
    try {
      body = await request.json();
      console.log('Handling resetPassword request:', body);
    } catch (error) {
      console.error('Error reading resetPassword request body:', error);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid request body',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword' },
            },
          },
        ],
        { status: 400 }
      );
    }

    const input = (body as { [key: string]: { id?: number; token?: string; newPassword?: string } })['0'];
    const id = input?.id ?? 0;
    const user = mockUsers.find(
      (u) =>
        u.resetPasswordToken === input?.token &&
        new Date(u.resetPasswordTokenExpiresAt || 0) > new Date()
    );
    if (!user) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: 'Invalid or expired reset token',
              code: -32603,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword' },
            },
          },
        ],
        { status: 400 }
      );
    }
    if (!input?.newPassword || input.newPassword.length < 8) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: 'Password must be at least 8 characters',
              code: -32603,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword' },
            },
          },
        ],
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
  }
);